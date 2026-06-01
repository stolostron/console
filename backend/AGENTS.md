# Backend

Node.js 20+ ESM proxy server. Sits between the browser and the hub cluster API server, handling authentication, RBAC enforcement, resource watching, and API proxying.

## Key Technologies

- **Runtime**: Node.js with native ESM (`"type": "module"`)
- **Router**: `find-my-way` for HTTP/2 route matching
- **Proxy**: `http2-proxy` for API passthrough
- **Logging**: Pino with structured JSON output (use `pino-zen` for dev formatting)
- **Metrics**: `prom-client` for Prometheus integration
- **HTTP Client**: `got` for outbound requests
- **WebSocket**: `ws` for event streaming

## Source Layout

| Directory | Purpose |
|-----------|---------|
| `src/lib/` | Core server: `main.ts` entry, `server.ts`, auth, cookies, CORS, proxy, search, SSE, logging, config |
| `src/routes/` | HTTP route handlers: proxy, OAuth, search, events, hub, serve, metrics, managed cluster proxy, etc. |
| `src/resources/` | Backend resource watchers and handlers |
| `test/` | Jest test files |
| `config/` | Runtime configuration |
| `certs/` | TLS certificates (auto-generated on `npm install`) |

## Commands

Run from the `backend/` directory, or use the `npm run *:backend` variants from the repo root.

| Command | Purpose |
|---------|---------|
| `npm start` | Start dev server with nodemon + inspector |
| `npm test` | Run Jest tests |
| `npm run lint` | ESLint check |
| `npm run tsc` | TypeScript type check |
| `npm run check` | Run lint + prettier + tsc together |
| `npm run build` | Production build via tsc + rollup → `backend.mjs` |
| `npm run clean` | Remove build artifacts |
| `npm run generate-certs` | Regenerate TLS certificates |

## Architecture

```text
Browser → Backend (HTTP/2 proxy) → Hub Cluster API Server
                ↓
          Watches resources via service account
          Enforces RBAC via user token + SubjectAccessReview
          Streams events to frontend via SSE
```

## Security

- Never log sensitive data (tokens, passwords, credentials)
- Validate and sanitize all inputs
- Guard against injection vulnerabilities (command injection, path traversal)
- Ensure proper authentication and authorization checks on all routes

## Testing

- Test files are in `test/`
- Tests should meaningfully cover behavior, not just achieve coverage metrics
- Properly mock and isolate dependencies
- Async tests must handle promises correctly

## Environment

The backend requires a `.env` file for cluster connection. Generate it with `npm run setup` from the repo root. Key variables include the cluster API URL, OAuth credentials, and service account token.
