# ReportBurster Server - Docker Deployment

## Quick Start

```bash
# Start the server (first run will extract default configuration)
./startServer.sh

# View logs
docker compose logs -f

# Stop the server
./shutServer.sh
```

## Access Points

- **Web UI:** http://localhost:9090
- **MailHog (Test Email):** http://localhost:8025

## Building the Docker Image

### Development Build (with caching)

```bash
# From the repository root directory
docker build -t flowkraft/reportburster-server:dev .
```

### Release Build (100% clean, no cache)

```bash
# From the repository root directory
docker build --no-cache \
    --build-arg BUILD_DATE=$(date -u +%Y%m%d%H%M%S) \
    -t flowkraft/reportburster-server:10.2.0 .
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SERVER_PORT` | `9090` | HTTP port for the web UI |
| `API_KEY` | (auto-generated) | API authentication key |

### Volumes

The following directories are mounted as volumes for persistence:

| Path | Description |
|------|-------------|
| `./backup` | Backup files |
| `./config` | Configuration files |
| `./input-files` | Input documents |
| `./logs` | Log files |
| `./output` | Output documents |
| `./quarantine` | Failed processing |
| `./poll` | Polling directory |
| `./samples` | Sample files |
| `./scripts` | Custom scripts |
| `./_apps` | Docker apps configuration |
| `./db` | Database configurations |

### API Key Authentication

The API key is:
1. Auto-generated on first start
2. Persisted in `./config/_internal/api-key.txt`
3. Also written to the frontend's `config.json`

To use a custom API key, set the `API_KEY` environment variable in `docker-compose.yml`.

## Docker-in-Docker

The container mounts `/var/run/docker.sock` to enable:
- **StarterPacks:** Database servers (PostgreSQL, MySQL, Oracle, etc.)
- **Docker Apps:** CloudBeaver, Metabase, Keycloak, etc.

## Clean Reset

To completely reset and start fresh:

```bash
./shutServer.sh
./_clean.sh
./startServer.sh
```

⚠️ **Warning:** This will delete all data directories!

## Troubleshooting

### Container won't start

Check logs:
```bash
docker compose logs reportburster-server
```

### API authentication failing

1. Check if `./config/_internal/api-key.txt` exists
2. Check if `./lib/frend/assets/config.json` has the same key
3. Restart the container to regenerate keys

### Docker-in-Docker not working

Ensure the Docker socket is mounted:
```bash
ls -la /var/run/docker.sock
```

Make sure the user running Docker has socket access.
