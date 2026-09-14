# Copyright Contributors to the Open Cluster Management project

# Console backend (Go)

This directory is the ACM/MCE console backend. It is the only backend process: TLS, health probes, hub watches, and every public HTTP route.

## Local development

From the repo root:

```sh
npm ci               # required once; runs go mod download when Go is installed
npm run setup        # writes backend/.env and backend/certs/ from the current oc context
npm start            # or npm run plugins
```

After `oc login` to a new hub:

```sh
rm -rf backend/.env backend/certs/ && npm run setup && npm run ci:backend
```

See [AGENTS.md](AGENTS.md) for layout, architecture, and commands.

Go listens on `BACKEND_PORT` (default 4000).
