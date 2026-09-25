# Nexode deployment test backend

Set these runtime variables from Nexode database resources:

| Variable | Resource |
| --- | --- |
| `POSTGRES_URL` | PostgreSQL public URI |
| `MONGODB_URL` | MongoDB public URI |
| `REDIS_URL` | Redis TLS public URI |
| `MYSQL_URL` | MySQL public URI |

`GET /status` and `GET /health` check a real connection to every engine and return only configuration, reachability and latency. Credentials and connection URIs are never returned. `/data` remains a mock endpoint.

Use the Nexode MCP `nexode_compute_link_database` tool to set each variable by database ID without exposing the connection string to the agent, then redeploy the backend.
