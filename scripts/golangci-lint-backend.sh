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

run_lint() {
	go run "github.com/golangci/golangci-lint/v2/cmd/golangci-lint@${GOLANGCI_LINT_VERSION}" run "$@"
}

# golangci-lint rejects named files from more than one directory. When callers
# (e.g. lint-staged) pass a file list, group by directory and run once each.
fix_flag=()
paths=()
for arg in "$@"; do
	case "$arg" in
	--fix)
		fix_flag=(--fix)
		;;
	*)
		paths+=("$arg")
		;;
	esac
done

if ((${#paths[@]} == 0)); then
	run_lint "${fix_flag[@]}"
	exit 0
fi

has_go_file=false
for path in "${paths[@]}"; do
	if [[ "$path" == *.go ]]; then
		has_go_file=true
		break
	fi
done

if [[ "$has_go_file" == false ]]; then
	run_lint "${fix_flag[@]}" "${paths[@]}"
	exit 0
fi

declare -A by_dir=()
for path in "${paths[@]}"; do
	rel="${path#backend/}"
	rel="${rel#./}"
	dir="$(dirname "$rel")"
	by_dir["$dir"]+="${rel}"$'\n'
done

for dir in "${!by_dir[@]}"; do
	mapfile -t files < <(printf '%s' "${by_dir[$dir]}" | sed '/^$/d' | sort -u)
	if ((${#files[@]} == 0)); then
		continue
	fi
	run_lint "${fix_flag[@]}" "${files[@]}"
done
