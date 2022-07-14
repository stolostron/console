# Copyright Contributors to the Open Cluster Management project


#!/usr/bin/env bash

echo > ./backend/.env

echo PORT=4000 >> ./backend/.env
echo NODE_ENV=development >> ./backend/.env

CLUSTER_API_URL=`oc get infrastructure cluster -o jsonpath={.status.apiServerURL}`
echo CLUSTER_API_URL=$CLUSTER_API_URL >> ./backend/.env

OAUTH2_CLIENT_ID=multicloudingress
echo OAUTH2_CLIENT_ID=$OAUTH2_CLIENT_ID >> ./backend/.env

OAUTH2_CLIENT_SECRET=multicloudingresssecret
echo OAUTH2_CLIENT_SECRET=$OAUTH2_CLIENT_SECRET >> ./backend/.env

OAUTH2_REDIRECT_URL=https://localhost:3000/multicloud/login/callback
echo OAUTH2_REDIRECT_URL=$OAUTH2_REDIRECT_URL >> ./backend/.env

BACKEND_URL=https://localhost:4000
echo BACKEND_URL=$BACKEND_URL >> ./backend/.env

FRONTEND_URL=https://localhost:3000
echo FRONTEND_URL=$FRONTEND_URL >> ./backend/.env

INSTALLATION_NAMESPACE=`oc get multiclusterhub -A -o jsonpath='{.items[0].metadata.namespace}'`

SA=$(oc get serviceaccounts -n $INSTALLATION_NAMESPACE --selector=app=console-chart,component=serviceaccount -o jsonpath='{.items[0].metadata.name}')
SA_SECRET=$(oc get secrets -n $INSTALLATION_NAMESPACE -o json | jq -r "[.items[] | select(.metadata.annotations[\"kubernetes.io/service-account.name\"] == \"$SA\" and .type == \"kubernetes.io/service-account-token\")][0].metadata.name")
SA_TOKEN=`oc get secret -n $INSTALLATION_NAMESPACE ${SA_SECRET} -o="jsonpath={.data.token}"`

echo ${SA_TOKEN} > /tmp/tmp_SA_TOKEN
SA_TOKEN=`cat /tmp/tmp_SA_TOKEN | base64 -d -`
rm /tmp/tmp_SA_TOKEN
echo TOKEN=$SA_TOKEN >> ./backend/.env

REDIRECT_URIS=$(oc get OAuthClient $OAUTH2_CLIENT_ID -o json | jq -c "[.redirectURIs[], \"$OAUTH2_REDIRECT_URL\"] | unique")
oc patch OAuthClient multicloudingress --type json -p "[{\"op\": \"add\", \"path\": \"/redirectURIs\", \"value\": ${REDIRECT_URIS}}]"

# Create route to the search-api service on the target cluster.
oc get route search-api -n $INSTALLATION_NAMESPACE &>/dev/null || oc create route passthrough search-api --service=search-search-api --insecure-policy=Redirect -n $INSTALLATION_NAMESPACE
SEARCH_API_URL=https://$(oc get route search-api -n $INSTALLATION_NAMESPACE |grep search-api | awk '{print $2}')
echo SEARCH_API_URL=$SEARCH_API_URL >> ./backend/.env
