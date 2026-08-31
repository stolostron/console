# Copyright Contributors to the Open Cluster Management project

# Console backend (Go)

This directory is the ACM/MCE console backend. During the Node-to-Go migration it fronts a Node sidecar (`../backend-node`) and reverse-proxies unmigrated routes.

## Local development

From the repo root:

```sh
npm ci               # required once; runs go mod download when Go is installed
npm run setup        # writes backend/.env from the current oc context
npm run generate-certs
npm start            # or npm run plugins
```

After `oc login` to a new hub:

```sh
npm run setup:hub
# restart npm start / npm run plugins
```

See [AGENTS.md](AGENTS.md) for layout, architecture, and commands.

Go listens on `BACKEND_PORT` (default 4000). The Node sidecar listens on `NODE_BACKEND_PORT` (default 4001).
