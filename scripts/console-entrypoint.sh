#!/bin/sh
# Copyright Contributors to the Open Cluster Management project
set -eu
export PUBLIC_FOLDER="${PUBLIC_FOLDER:-/app/public}"
export CERTS_DIR="${CERTS_DIR:-/app/certs}"
export CONFIG_DIR="${CONFIG_DIR:-/app/config}"
exec /app/console
