# Copyright Contributors to the Open Cluster Management project


#!/usr/bin/env bash

echo > ./backend/.env

echo PORT=4000 >> ./backend/.env
echo NODE_ENV=development >> ./backend/.env

CLUSTER_API_URL=`oc get infrastructure cluster -o jsonpath={.status.apiServerURL}`
echo CLUSTER_API_URL=$CLUSTER_API_URL >> ./backend/.env

OAUTH2_CLIENT_ID=console-dev
echo OAUTH2_CLIENT_ID=$OAUTH2_CLIENT_ID >> ./backend/.env

OAUTH2_CLIENT_SECRET=console-dev-secret
echo OAUTH2_CLIENT_SECRET=$OAUTH2_CLIENT_SECRET >> ./backend/.env

OAUTH2_REDIRECT_URL=https://localhost:3000/multicloud/login/callback
echo OAUTH2_REDIRECT_URL=$OAUTH2_REDIRECT_URL >> ./backend/.env

BACKEND_URL=https://localhost:4000
echo BACKEND_URL=$BACKEND_URL >> ./backend/.env

FRONTEND_URL=https://localhost:3000
echo FRONTEND_URL=$FRONTEND_URL >> ./backend/.env

INSTALLATION_NAMESPACE=`oc get multiclusterhub -A -o jsonpath='{.items[0].metadata.namespace}' || true`
INSTALLATION_NAMESPACE_MCE=`oc get multiclusterengine -A -o jsonpath='{.items[0].spec.targetNamespace}'`

SA=$(oc get serviceaccounts -n $INSTALLATION_NAMESPACE_MCE console-mce -o jsonpath='{.metadata.name}')
SA_SECRET=$(oc get secrets -n $INSTALLATION_NAMESPACE_MCE -o json | jq -r "[.items[] | select(.metadata.annotations[\"kubernetes.io/service-account.name\"] == \"$SA\" and .type == \"kubernetes.io/service-account-token\")][0].metadata.name")
SA_TOKEN=`oc get secret -n $INSTALLATION_NAMESPACE_MCE ${SA_SECRET} -o="jsonpath={.data.token}" | base64 -d`

echo TOKEN=$SA_TOKEN >> ./backend/.env

oc apply -f - << EOF
apiVersion: oauth.openshift.io/v1
grantMethod: auto
kind: OAuthClient
metadata:
  name: console-dev
redirectURIs:
- $OAUTH2_REDIRECT_URL
secret: console-dev-secret
EOF

# Create route to the search-api service on the target cluster.
if [[ -n "$INSTALLATION_NAMESPACE" ]]; then
  oc get route search-api -n $INSTALLATION_NAMESPACE &>/dev/null || oc create route passthrough search-api --service=search-search-api --insecure-policy=Redirect -n $INSTALLATION_NAMESPACE
  SEARCH_API_URL=https://$(oc get route search-api -n $INSTALLATION_NAMESPACE |grep search-api | awk '{print $2}')
  echo SEARCH_API_URL=$SEARCH_API_URL >> ./backend/.env
fi
