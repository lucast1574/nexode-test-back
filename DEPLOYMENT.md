# Nexode deployment test backend

Set these runtime variables from Nexode database resources:

| Variable | Resource |
| --- | --- |
| `POSTGRES_URL` | PostgreSQL public URI |
| `MONGODB_URL` | MongoDB public URI |
| `REDIS_URL` | Redis TLS public URI |
| `MYSQL_URL` | MySQL public URI |

`GET /status` and `GET /health` check a real connection to every engine and return only configuration, reachability and latency. Credentials and connection URIs are never returned. `/data` remains a mock endpoint.

MySQL uses a TLS-first connection to Nexode's shared port 443. The test uses `mysql2` with a TLS socket supplied through its `stream` option; a plain MySQL client cannot select this SNI-routed endpoint without an equivalent TLS tunnel.

Use the Nexode MCP `nexode_compute_link_database` tool to set each variable by database ID without exposing the connection string to the agent, then redeploy the backend.
