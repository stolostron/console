#!/usr/bin/env bash
# Copyright Contributors to the Open Cluster Management project

set -euo pipefail

readonly GOLANGCI_LINT_VERSION=v1.64.8
readonly ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if ! command -v go >/dev/null 2>&1; then
	echo "Go is not installed; skipping backend lint" >&2
	exit 0
fi

if ! command -v golangci-lint >/dev/null 2>&1; then
	go install "github.com/golangci/golangci-lint/cmd/golangci-lint@${GOLANGCI_LINT_VERSION}"
fi

export PATH="$(go env GOPATH)/bin:${PATH}"
cd "${ROOT_DIR}/backend"
golangci-lint run "$@"
