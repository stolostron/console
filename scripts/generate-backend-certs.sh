#!/usr/bin/env bash
# Copyright Contributors to the Open Cluster Management project

set -euo pipefail

readonly ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
readonly CERT_DIR="${ROOT_DIR}/backend/certs"

if [[ "${1:-}" == "--if-missing" && -f "${CERT_DIR}/tls.crt" && -f "${CERT_DIR}/tls.key" ]]; then
	exit 0
fi

if ! command -v openssl >/dev/null 2>&1; then
	echo "openssl is required to generate backend/certs/; install openssl and retry" >&2
	exit 1
fi

mkdir -p "${CERT_DIR}"
openssl req -subj '/C=US' -new -newkey rsa:2048 -sha256 -days 365 -nodes -x509 \
	-keyout "${CERT_DIR}/tls.key" -out "${CERT_DIR}/tls.crt"
