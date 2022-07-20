#!/usr/bin/env bash

if [ $# -eq 0 ]; then 
  echo "USAGE ./generate-mocks.sh KIND"; 
  exit 1
fi

foo="$(tr '[:lower:]' '[:upper:]' <<< ${1:0:1})${1:1}"

echo -n 'export const ' > mock-$1.ts
echo -n mock"${foo}" >> mock-$1.ts
echo -n ' = ' >> mock-$1.ts
oc get $1 -o json | \
 jq '.items' | \
 jq 'del(.[].metadata.managedFields)' | \
 jq 'del(.[].metadata.creationTimestamp)' | \
 jq 'del(.[].metadata.finalizers)' | \
 jq 'del(.[].metadata.resourceVersion)' | \
 jq 'del(.[].metadata.uid)' | \
 jq 'del(.[].spec.managedClusterClientConfigs)' | \
 jq 'del(.[].metadata.generation)' >> mock-$1.ts