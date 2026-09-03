#!/usr/bin/env bash
# Copyright Contributors to the Open Cluster Management project

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ROOT_DIR}/backend/.env"

if ! command -v oc >/dev/null 2>&1; then
	echo "warning: oc not found; skipping hub alignment check" >&2
	exit 0
fi

OC_SERVER="$(oc whoami --show-server 2>/dev/null || true)"
if [[ -z "$OC_SERVER" ]]; then
	echo "warning: not logged in to a cluster (oc whoami); skipping hub alignment check" >&2
	exit 0
fi

if [[ ! -f "$ENV_FILE" ]]; then
	echo "error: ${ENV_FILE} not found. Run: npm run setup" >&2
	exit 1
fi

CLUSTER_API_URL="$(grep -E '^CLUSTER_API_URL=' "$ENV_FILE" | cut -d= -f2- || true)"
if [[ -z "$CLUSTER_API_URL" ]]; then
	echo "error: CLUSTER_API_URL missing from ${ENV_FILE}. Run: npm run setup:hub" >&2
	exit 1
fi

OC_SERVER="${OC_SERVER%/}"
CLUSTER_API_URL="${CLUSTER_API_URL%/}"

if [[ "$OC_SERVER" != "$CLUSTER_API_URL" ]]; then
	cat >&2 <<EOF
error: backend hub mismatch

  oc context:    ${OC_SERVER}
  backend/.env:  ${CLUSTER_API_URL}

The OpenShift Console on :9000 forwards your oc login token to the backend with authorize=true.
When CLUSTER_API_URL points at a different hub, authenticated routes (for example
GET /multiclusterhub/components) return 401, the frontend calls logout, and the browser
lands on /dashboards.

Fix: oc login to the hub cluster, then run: npm run setup:hub
EOF
	exit 1
fi

CERT_DIR="${ROOT_DIR}/backend/certs"
if [[ ! -f "${CERT_DIR}/tls.crt" || ! -f "${CERT_DIR}/tls.key" ]]; then
	cat >&2 <<EOF
error: backend TLS certs missing (${CERT_DIR}/tls.{crt,key})

The OpenShift Console plugin proxy expects https://localhost:4000. Without certs the Go
listener serves plain HTTP and the console logs:
  http: proxy error: tls: first record does not look like a TLS handshake

Fix: npm run generate-certs
Then restart npm run plugins (Go and the Node sidecar read certs only at startup).
EOF
	exit 1
fi
