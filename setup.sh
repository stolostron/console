# Copyright Contributors to the Open Cluster Management project


#!/usr/bin/env bash

echo > ./backend/.env

CLUSTER_API_URL=`oc get infrastructure cluster -o jsonpath={.status.apiServerURL}`
echo CLUSTER_API_URL=$CLUSTER_API_URL >> ./backend/.env

OAUTH2_CLIENT_ID=multicloudingress
echo OAUTH2_CLIENT_ID=$OAUTH2_CLIENT_ID >> ./backend/.env

OAUTH2_CLIENT_SECRET=multicloudingresssecret
echo OAUTH2_CLIENT_SECRET=$OAUTH2_CLIENT_SECRET >> ./backend/.env

OAUTH2_REDIRECT_URL=https://localhost:4000/login/callback
echo OAUTH2_REDIRECT_URL=$OAUTH2_REDIRECT_URL >> ./backend/.env

BACKEND_URL=https://localhost:4000
echo BACKEND_URL=$BACKEND_URL >> ./backend/.env

FRONTEND_URL=https://localhost:3000
echo FRONTEND_URL=$FRONTEND_URL >> ./backend/.env

SA_SECRET=`oc get pods -n open-cluster-management --selector=app=console-chart-v2,component=console -o="jsonpath={.items[0].spec.volumes[2].secret.secretName}"`
SA_TOKEN=`oc get secret -n open-cluster-management ${SA_SECRET} -o="jsonpath={.data.token}"`

echo ${SA_TOKEN} > /tmp/tmp_SA_TOKEN
SA_TOKEN=`cat /tmp/tmp_SA_TOKEN | base64 -d -`
rm /tmp/tmp_SA_TOKEN
echo TOKEN=$SA_TOKEN >> ./backend/.env

REDIRECT_URIS=$(oc get OAuthClient $OAUTH2_CLIENT_ID -o json | jq -c "[.redirectURIs[], \"$OAUTH2_REDIRECT_URL\"] | unique")
oc patch OAuthClient multicloudingress --type json -p "[{\"op\": \"add\", \"path\": \"/redirectURIs\", \"value\": ${REDIRECT_URIS}}]"

# Create route to the search-api service on the target cluster.
oc create route passthrough search-api --service=search-search-api --insecure-policy=Redirect -n open-cluster-management
SEARCH_API_URL=https://$(oc get route search-api -n open-cluster-management |grep search-api | awk '{print $2}')
echo SEARCH_API_URL=$SEARCH_API_URL >> ./backend/.env
