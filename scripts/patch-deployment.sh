#!/usr/bin/env bash
# Copyright Contributors to the Open Cluster Management project
set -e # Exit immediately if a command returns a non-zero status.

if [ $# -eq 0 ]; then
    echo "No arguments supplied";
    exit 1
fi

VERSION=$1
IMAGE=${2:-quay.io/open-cluster-management/console}

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd $DIR

DEPLOYMENT=`oc get deployment -n open-cluster-management --selector=app=console-chart-v2,component=console -o="jsonpath={.items[0].metadata.name}"`

kubectl scale deployment.v1.apps/$DEPLOYMENT -n open-cluster-management --replicas=0

PATCH='[{"op":"replace","path":"/spec/template/spec/containers/0/image","value":"'${IMAGE}':'$1'"}]'
oc patch deployment $DEPLOYMENT -n open-cluster-management --type='json' -p $PATCH

kubectl scale deployment.v1.apps/$DEPLOYMENT -n open-cluster-management --replicas=1

oc get deployment $DEPLOYMENT -n open-cluster-management -o="jsonpath={.spec.template.spec.containers[0].image}"