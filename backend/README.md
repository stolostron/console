# Copyright Contributors to the Open Cluster Management project

# Console backend (Go)

This directory is the ACM/MCE console backend. During the Node-to-Go migration it fronts a Node sidecar (`../backend-node`) and reverse-proxies unmigrated routes.

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

Go listens on `BACKEND_PORT` (default 4000). The Node sidecar listens on `NODE_BACKEND_PORT` (default 4001).
