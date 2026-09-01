# Known Node backend quirks (ACM-42590)

Documented so Go can **replicate** them on purpose, or **fix later** with an explicit decision. Contract tests encode the current Node wire behavior.

## Replicate (bug-compatible / observable contract)

### DELETED SSE events skip RBAC

`eventFilter` in `backend/src/routes/events.ts` returns `true` for every `DELETED` event. ADDED/MODIFIED go through SelfSubjectAccessReview. Comment in source: namespace deletion makes a later access check fail.

**Decision:** replicate until a dedicated security follow-up tracks who previously received the object.

### SSAR cache TTL 60s

Per-token access cache: TTL 60s, cleanup interval 90s, max 1000 tokens (`ACCESS_CACHE_TTL` in `events.ts`).

**Decision:** replicate. Tests do not assert wall-clock TTL (flake); they assert authorized vs unauthorized snapshots.

### Kube proxy header allowlist

`proxy.ts` forwards only `accept`, `accept-encoding`, `content-encoding`, `content-length`, `content-type` to the API server, and only `cache-control`, `content-type`, `content-length`, `content-encoding`, `etag` back to the client. Cookies and `X-Forwarded-*` are not passed through.

**Decision:** replicate. Tests assert `content-type` is present and `set-cookie` is absent on `/api`.

### Session probe is GET /api, not TokenReview

`isAuthenticated` uses `GET {CLUSTER_API_URL}/api` with the user Bearer token. `/username` and `/userpreference` use TokenReview.

**Decision:** replicate. `/authenticated` returns that status with an empty body.

### OAuth routes only when NODE_ENV !== production

`/configure`, `/login`, `/login/callback`, `/logout` are registered only outside production.

**Decision:** replicate. Local `npm run plugins` is development, so these cases are required there.

### 401 / 404 / 500 bodies are empty

`unauthorized`, `notFound`, and `respondInternalServerError` write status with no JSON body.

**Decision:** replicate (`bodyEmpty: true` on negative cases).

### Search WebSocket injects Authorization in `connection_init`

The browser graphql-ws `connection_init` payload is rewritten to include `Authorization: Bearer <token>` before relay to search-api. The HTTP POST `/proxy/search` sends Bearer on the outbound request.

**Decision:** replicate. WS test sends `connection_init` without a token and expects `connection_ack` if Search is up.

### userpreference username sanitization

TokenReview username is lowercased and non `[a-z0-9-.]` characters become `-` for the CR name.

**Decision:** replicate. Tests only assert GET returns JSON.

### Metrics path rewrite

`/observability/*` and `/prometheus/*` replace the first path segment with `/api/v1` before proxying.

**Decision:** replicate.

### Authentication CR is not fanned out on SSE

`{ kind: 'Authentication', apiVersion: 'config.openshift.io/v1', forwardEventsToClients: false }`. Hub still reads it for `/hub`.

**Decision:** replicate. Watched-kind set used by SSE tests omits Authentication.

### SSE framing, packets, compression, keepalive

- `id:` + `data:{json}` + blank line
- Snapshot order: START, SETTINGS, then ManagedCluster/HostedCluster/… packets ending with `EOP`, remainder, LOADED
- Gzip (not brotli; Firefox) unless `DISABLE_STREAM_COMPRESSION=true`
- Keepalive comment `:\n\n` every 10s
- `Set-Cookie: watch=<instanceID>; Secure; HttpOnly; Path=/`
- `Content-Type: text/event-stream`, `Cache-Control: no-store, no-transform`

**Decision:** replicate framing and lifecycle types. Tests do not require exact ADDED ordering inside a packet, only type presence and object shape.

### `/multicloud` prefix

HTTP `requestHandler` strips `/multicloud` before `find-my-way`. WebSocket `upgrade` only matches `/multicloud/proxy/search` and `/multicloud/managedclusterproxy` — a bare `/proxy/search` upgrade is ignored and the socket hangs.

**Decision:** replicate HTTP stripping. WS tests use the `/multicloud` path the plugin actually opens.

### Development `admin-token` cache

`getToken()` in `NODE_ENV=development` reads `admin-token` from `node-localstorage` under `./certs` when the request has no cookie and no `Authorization`. `getAuthenticatedToken` writes that key after a successful `GET /api`. Local `npm run plugins` therefore treats a no-token request as kubeadmin after the first login.

**Decision:** do not replicate in Go (dev-only). Negative catalog cases send `Authorization: Bearer acm-42590-invalid-token` (`auth: invalid`) so they 401 in both development and production. Missing-token 401 is production-only.

### CORS only in non-production

`cors.ts` reflects `Origin`, `Access-Control-Allow-Credentials: true`, and answers OPTIONS with 200.

**Decision:** replicate for standalone/dev. Production plugin traffic is same-origin through Console.

### find-my-way maxParamLength 500

Long Kubernetes names need this; unmatched routes 404.

**Decision:** replicate.

## Fix later (do not block migration)

- DELETED without access check (security).
- Empty error bodies (harder to debug; changing them would break clients that treat any body as JSON).
- Development `admin-token` file cache (do not port).
- Webpack devServer missing `/apiPaths`, `/cluster-version`, `/placement-debug` (plugin proxy is prefix-based so production plugins are fine).
- Dead webpack entries `/multicloud/common`, `/multicloud/console-links` (not backend routes).

## Not in Node (do not require against upstream/main)

Routes added only on the Go skeleton (for example `/events/rbac`) are out of this catalog until Node never served them.
