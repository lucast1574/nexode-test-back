import { Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { MongoClient } from 'mongodb';
import { createClient } from 'redis';
import { createConnection } from 'mysql2/promise';
import { connect as connectTls } from 'node:tls';

type DatabaseName = 'postgres' | 'mongodb' | 'redis' | 'mysql';
type ProbeResult = { configured: boolean; reachable: boolean; latency_ms?: number };

@Injectable()
export class AppService {
  private async probe(name: DatabaseName, url: string | undefined): Promise<ProbeResult> {
    if (!url) return { configured: false, reachable: false };
    const started = Date.now();
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        this.probeConnection(name, url),
        new Promise<never>((_, reject) => { timeout = setTimeout(() => reject(new Error('Database probe timed out')), 6000); }),
      ]);
      return { configured: true, reachable: true, latency_ms: Date.now() - started };
    } catch {
      return { configured: true, reachable: false };
    } finally {
      if (timeout) clearTimeout(timeout);
    }
  }

  private async probeConnection(name: DatabaseName, url: string): Promise<void> {
      if (name === 'postgres') {
        const parsed = new URL(url);
        // The public gateway routes by TLS SNI, before PostgreSQL's normal
        // SSLRequest. Open TLS first and send the PostgreSQL protocol inside it.
        const pool = new Pool({
          host: parsed.hostname,
          port: Number(parsed.port || 443),
          user: decodeURIComponent(parsed.username),
          password: decodeURIComponent(parsed.password),
          database: decodeURIComponent(parsed.pathname.slice(1)),
          ssl: false,
          stream: () => {
            const socket = connectTls({ host: parsed.hostname, port: Number(parsed.port || 443), servername: parsed.hostname, rejectUnauthorized: true });
            // pg calls connect() on its stream and waits for a connect event.
            // Delay that event until the outer TLS handshake is complete.
            socket.connect = () => socket;
            socket.once('secureConnect', () => socket.emit('connect'));
            return socket;
          },
          connectionTimeoutMillis: 4000,
          max: 1,
        });
        try { await pool.query('SELECT 1'); } finally { await pool.end(); }
      } else if (name === 'mongodb') {
        const client = new MongoClient(url, { serverSelectionTimeoutMS: 4000, connectTimeoutMS: 4000 });
        try { await client.connect(); await client.db().command({ ping: 1 }); } finally { await client.close(); }
      } else if (name === 'redis') {
        const parsed = new URL(url);
        const client = createClient({ url, socket: { connectTimeout: 4000, reconnectStrategy: false, tls: true, servername: parsed.hostname, rejectUnauthorized: true } });
        client.on('error', () => { /* Keep connection errors out of public responses. */ });
        try { await client.connect(); await client.ping(); } finally { if (client.isOpen) await client.quit(); }
      } else {
        // Nexode's shared :443 TCP gateway selects databases by TLS SNI before
        // MySQL's greeting, so the client opens TLS first and runs MySQL inside it.
        const parsed = new URL(url);
        const client = await createConnection({
          host: parsed.hostname,
          port: Number(parsed.port || 443),
          user: decodeURIComponent(parsed.username),
          password: decodeURIComponent(parsed.password),
          database: decodeURIComponent(parsed.pathname.slice(1)),
          connectTimeout: 4000,
          stream: () => connectTls({ host: parsed.hostname, port: Number(parsed.port || 443), servername: parsed.hostname, rejectUnauthorized: true }),
        });
        try { await client.query('SELECT 1'); } finally { await client.end(); }
      }
  }

  async getStatus() {
    const [postgres, mongodb, redis, mysql] = await Promise.all([
      this.probe('postgres', process.env.POSTGRES_URL),
      this.probe('mongodb', process.env.MONGODB_URL),
      this.probe('redis', process.env.REDIS_URL),
      this.probe('mysql', process.env.MYSQL_URL),
    ]);
    const databases = { postgres, mongodb, redis, mysql };
    const allReady = Object.values(databases).every(result => result.configured && result.reachable);
    return {
      status: allReady ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: 'nexode-test-backend',
      databases,
    };
  }

  getMockData() {
    return [
      { id: 1, name: 'Item 1', description: 'This is mock data from NestJS' },
      { id: 2, name: 'Item 2', description: 'Used for Nexode deployment testing' },
      { id: 3, name: 'Item 3', description: 'If you see this, the connectivity is working!' },
    ];
  }
}
