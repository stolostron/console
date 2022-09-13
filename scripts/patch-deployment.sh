#!/usr/bin/env bash
# Copyright Contributors to the Open Cluster Management project
set -e # Exit immediately if a command returns a non-zero status.

if [ $# -eq 0 ]; then
    echo "No arguments supplied";
    exit 1
fi

VERSION=$1
IMAGE=${2:-quay.io/stolostron/console}

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd $DIR

# default to MCE since it does not need any calculation
NS='multicluster-engine'
DEPLOYMENT='console-mce-console'

if [[ "$IMAGE" != *"console-mce" ]]; then
    # if its not MCE than its ACM
    NS='open-cluster-management'
    DEPLOYMENT=`oc get deployment -n $NS --selector=app=console-chart-v2,component=console -o="jsonpath={.items[0].metadata.name}"`
fi

kubectl scale deployment.v1.apps/$DEPLOYMENT -n $NS --replicas=0

PATCH='[{"op":"replace","path":"/spec/template/spec/containers/0/imagePullPolicy","value":"Always"}]'
oc patch deployment $DEPLOYMENT -n $NS --type='json' -p $PATCH

PATCH='[{"op":"replace","path":"/spec/template/spec/containers/0/image","value":"'${IMAGE}':'$1'"}]'
oc patch deployment $DEPLOYMENT -n $NS --type='json' -p $PATCH

kubectl scale deployment.v1.apps/$DEPLOYMENT -n $NS --replicas=1

oc get deployment $DEPLOYMENT -n $NS -o="jsonpath={.spec.template.spec.containers[0].image}"
