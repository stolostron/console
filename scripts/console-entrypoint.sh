#!/bin/sh
# Copyright Contributors to the Open Cluster Management project
# Public listener is Go; Node sidecar handles unmigrated routes.
set -eu
NODE_BACKEND_PORT="${NODE_BACKEND_PORT:-4001}"
export NODE_BACKEND_URL="${NODE_BACKEND_URL:-https://127.0.0.1:${NODE_BACKEND_PORT}}"
export PUBLIC_FOLDER="${PUBLIC_FOLDER:-/app/public}"
export CERTS_DIR="${CERTS_DIR:-/app/certs}"
export CONFIG_DIR="${CONFIG_DIR:-/app/config}"
PORT="${NODE_BACKEND_PORT}" node /app/backend.mjs &
exec /app/console
