import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getStatus() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: 'nexode-test-backend',
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
