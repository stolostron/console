#!/bin/bash

set -ex

export PORT=4000
export NODE_ENV=development

source .env

ts-node-dev --no-notify --no-deps --respawn --transpile-only src/lib/main.ts | pino-zen -i time
