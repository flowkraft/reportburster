# Admin & Security 🔒

High-level operational notes for Business Intelligence deployments.

- **API keys:** components require an `api-key` for authenticated data fetches. Keep keys scoped and rotate periodically.
- **Apps & Docker:** Starter Apps (Portal, FlowKraft) require Docker to be installed and running for start/stop. See *Help → Apps* in the app UI. ⚠️
- **Performance:** prefer server-side aggregations for large datasets; use pagination and virtual scrolling on Tabulator.

For advanced multi-tenant deployments and scaling guidance, see the Admin guide (to be expanded).
