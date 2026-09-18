#!/usr/bin/env bash
# Copyright Contributors to the Open Cluster Management project

set -euo pipefail

readonly AIR_VERSION=v1.67.4
readonly ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if ! command -v go >/dev/null 2>&1; then
	echo "Go is not installed; the console backend requires Go 1.26+" >&2
	exit 1
fi

export PATH="$(go env GOPATH)/bin:${PATH}"

if ! command -v air >/dev/null 2>&1; then
	go install "github.com/air-verse/air@${AIR_VERSION}"
fi

cd "${ROOT_DIR}/backend"
exec air "$@"
