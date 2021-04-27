#!/usr/bin/env bash
# Copyright Contributors to the Open Cluster Management project

IMAGE=${2:-quay.io/open-cluster-management/console}

DEPLOYMENT=`oc get deployment -n open-cluster-management --selector=app=console-chart-v2,component=console -o="jsonpath={.items[0].metadata.name}"`

kubectl scale deployment.v1.apps/$DEPLOYMENT -n open-cluster-management --replicas=0

PATCH='[{"op":"replace","path":"/spec/template/spec/containers/0/image","value":"'${IMAGE}':'$1'"}]'
oc patch deployment $DEPLOYMENT -n open-cluster-management --type='json' -p $PATCH

kubectl scale deployment.v1.apps/$DEPLOYMENT -n open-cluster-management --replicas=1

oc get deployment $DEPLOYMENT -n open-cluster-management -o="jsonpath={.spec.template.spec.containers[0].image}"
