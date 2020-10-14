#!/bin/bash

# This script is designed to run in prow-ci

# copy all files to a temp folder to fix permission issues
TMP_FOLDER_NAME=/tmp/unit-test-$RANDOM
mkdir $TMP_FOLDER_NAME
cp -r ./* $TMP_FOLDER_NAME/ 
pushd $TMP_FOLDER_NAME
npm ci
npm run generate
npm test