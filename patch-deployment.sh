# Copyright Contributors to the Open Cluster Management project

#!/usr/bin/env bash
DEPLOYMENT=`oc get deployment -n open-cluster-management --selector=app=console-chart-v2,component=console -o="jsonpath={.items[0].metadata.name}"`
PATCH='[{"op":"replace","path":"/spec/template/spec/containers/0/image","value":"quay.io/open-cluster-management/console:'$1'"}]'
oc patch deployment $DEPLOYMENT -n open-cluster-management --type='json' -p $PATCH
oc get deployment $DEPLOYMENT -n open-cluster-management -o="jsonpath={.spec.template.spec.containers[0].image}"
