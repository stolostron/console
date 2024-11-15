# Copyright Contributors to the Open Cluster Management project


#!/usr/bin/env bash

SAFE_USERNAME=$(echo "$USER" | tr '[:upper:]' '[:lower:]' | tr -cd "[:alnum:]-_")
OAUTH_CLIENT_NAME="console-dev-${SAFE_USERNAME}"
