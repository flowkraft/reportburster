# ReportBurster Server - Docker Deployment

## Quick Start

```bash
# Start the server
docker compose up -d

# Stop the server
docker compose down

# Run the CLI inside the service container (forward arguments to the reportburster CLI)
./reportburster.sh -c config/my-config.xml --testlist entry1

# View logs
docker compose logs -f
```

## Access Points

- **Web UI:** http://localhost:9090
- **MailHog (Test Email):** http://localhost:8025
