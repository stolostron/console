#!/usr/bin/env bash

echo > ./.env

CLUSTER_API_URL=`oc get infrastructure cluster -o jsonpath={.status.apiServerURL}`
echo CLUSTER_API_URL=$CLUSTER_API_URL >> ./.env

OAUTH2_CLIENT_ID=multicloudingress
echo OAUTH2_CLIENT_ID=$OAUTH2_CLIENT_ID >> ./.env

OAUTH2_CLIENT_SECRET=multicloudingresssecret
echo OAUTH2_CLIENT_SECRET=$OAUTH2_CLIENT_SECRET >> ./.env

OAUTH2_REDIRECT_URL=http://localhost:4000/cluster-management/login/callback
echo OAUTH2_REDIRECT_URL=$OAUTH2_REDIRECT_URL >> ./.env

NODE_TLS_REJECT_UNAUTHORIZED=0
echo NODE_TLS_REJECT_UNAUTHORIZED=$NODE_TLS_REJECT_UNAUTHORIZED >> ./.env

BACKEND_URL=http://localhost:4000
echo BACKEND_URL=$BACKEND_URL >> ./.env

FRONTEND_URL=http://localhost:3000
echo FRONTEND_URL=$FRONTEND_URL >> ./.env

REDIRECT_URIS=$(oc get OAuthClient $OAUTH2_CLIENT_ID -o json | jq -c "[.redirectURIs[], \"$OAUTH2_REDIRECT_URL\"] | unique")
oc patch OAuthClient multicloudingress --type json -p "[{\"op\": \"add\", \"path\": \"/redirectURIs\", \"value\": ${REDIRECT_URIS}}]"