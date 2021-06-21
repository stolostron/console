#!/usr/bin/env bash

# Copyright Contributors to the Open Cluster Management project

set -x # Print statements as they are being executed.
set -e # Exit immediately if a command returns a non-zero status.

# Get current script directory and make sure where we are executing
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd $SCRIPT_DIR/..

# Console
rm -rf node_modules
rm -f package-lock.json
npx npm-check-updates --target minor --doctor --upgrade
npm dedup
npm audit fix

# Frontend
pushd frontend
rm -rf node_modules
rm -f package-lock.json
npx npm-check-updates \
    --reject handlebars-loader,monaco-editor,monaco-editor-webpack-plugin,react-monaco-editor,typescript \
    --target minor --doctor --upgrade
npm dedup
npm audit fix
popd

# Backend
pushd backend
rm -rf node_modules
rm -f package-lock.json
npx npm-check-updates --target minor --doctor --upgrade
npm dedup
npm audit fix
popd
