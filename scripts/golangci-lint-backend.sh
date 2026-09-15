#!/usr/bin/env bash
# Copyright Contributors to the Open Cluster Management project

set -euo pipefail

readonly GOLANGCI_LINT_VERSION=v2.9.0
readonly ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if ! command -v go >/dev/null 2>&1; then
	echo "Go is not installed; skipping backend lint" >&2
	exit 0
fi

cd "${ROOT_DIR}/backend"
# Build with the active Go toolchain so analysis matches go.mod (avoids a stale
# pre-installed golangci-lint binary compiled with an older Go release).
go run "github.com/golangci/golangci-lint/v2/cmd/golangci-lint@${GOLANGCI_LINT_VERSION}" run "$@"
