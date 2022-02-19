#!/usr/bin/env bash
# Copyright Contributors to the Open Cluster Management project

if [[ ! $PLUGIN ]]
then
  echo 'error: $PLUGIN not set'
  exit 1
elif [[ ! -d plugins/${PLUGIN} ]]
then
  echo "error: unknown plugin \"$PLUGIN\""
  exit 1
fi
exit 0
