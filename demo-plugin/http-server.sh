#!/usr/bin/env bash

set -u

PUBLIC_PATH="$1"
HTTPS_ARGS="${@:2}"
shift
SERVER_OPTS="$@"
http-server $PUBLIC_PATH -p 9001 $HTTPS_ARGS
