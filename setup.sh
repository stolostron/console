# Copyright Contributors to the Open Cluster Management project


#!/usr/bin/env bash

source ./port-defaults.sh
source ./oauth-client-name.sh

echo > ./backend/.env

echo PORT="${BACKEND_PORT}" >> ./backend/.env
echo NODE_ENV=development >> ./backend/.env

CLUSTER_API_URL=`oc get infrastructure cluster -o jsonpath={.status.apiServerURL}`
echo CLUSTER_API_URL=$CLUSTER_API_URL >> ./backend/.env

echo OAUTH2_CLIENT_ID=$OAUTH_CLIENT_NAME >> ./backend/.env

OAUTH2_REDIRECT_URL=https://localhost:${FRONTEND_PORT}/multicloud/login/callback
echo OAUTH2_REDIRECT_URL=$OAUTH2_REDIRECT_URL >> ./backend/.env

FRONTEND_URL=https://localhost:${FRONTEND_PORT}
echo FRONTEND_URL=$FRONTEND_URL >> ./backend/.env

INSTALLATION_NAMESPACE=`oc get multiclusterhub -A -o jsonpath='{.items[0].metadata.namespace}' || true`
INSTALLATION_NAMESPACE_MCE=`oc get multiclusterengine -A -o jsonpath='{.items[0].spec.targetNamespace}'`

SA=$(oc get serviceaccounts -n $INSTALLATION_NAMESPACE_MCE console-mce -o jsonpath='{.metadata.name}')
SA_SECRET=$(oc get secrets -n $INSTALLATION_NAMESPACE_MCE -o json | jq -r "[.items[] | select(.metadata.annotations[\"kubernetes.io/service-account.name\"] == \"$SA\" and .type == \"kubernetes.io/service-account-token\")][0].metadata.name // \"\"")
if [[ -z "$SA_SECRET" ]]; then
  oc apply -f - << EOF
apiVersion: v1
kind: Secret
metadata:
  name: console-mce-token
  namespace: $INSTALLATION_NAMESPACE_MCE
  annotations:
    kubernetes.io/service-account.name: $SA 
type: kubernetes.io/service-account-token 
EOF
  SA_SECRET="console-mce-token"
fi

SA_TOKEN=`oc get secret -n $INSTALLATION_NAMESPACE_MCE ${SA_SECRET} -o="jsonpath={.data.token}" | base64 -d`
CA_CERT=`oc get secret -n $INSTALLATION_NAMESPACE_MCE ${SA_SECRET} -o="jsonpath={.data.ca\.crt}"`
SERVICE_CA_CERT=`oc get secret -n $INSTALLATION_NAMESPACE_MCE ${SA_SECRET} -o="jsonpath={.data.service-ca\.crt}"`

echo TOKEN=$SA_TOKEN >> ./backend/.env
echo CA_CERT=$CA_CERT >> ./backend/.env
echo SERVICE_CA_CERT=$SERVICE_CA_CERT >> ./backend/.env

# Create or update OAuthClient
REDIRECT_URL=http://localhost:${CONSOLE_PORT}/auth/callback
REDIRECT_URL_STANDALONE=$OAUTH2_REDIRECT_URL

if ! oc get OAuthClient $OAUTH_CLIENT_NAME &> /dev/null; then
  oc process -f -  << EOF | oc apply -f -
apiVersion: template.openshift.io/v1
kind: Template
metadata:
  name: console-oauth-client
parameters:
  - name: OAUTH_SECRET
    generate: expression
    from: "[a-zA-Z0-9]{40}"
objects:
  - apiVersion: oauth.openshift.io/v1
    kind: OAuthClient
    metadata:
      name: ${OAUTH_CLIENT_NAME}
    grantMethod: auto
    secret: \${OAUTH_SECRET}
    redirectURIs:
    - ${REDIRECT_URL}
    - ${REDIRECT_URL_STANDALONE}
EOF
else
  REDIRECT_URIS=$(oc get OAuthClient $OAUTH_CLIENT_NAME -o json | jq -c "[.redirectURIs[], \"$REDIRECT_URL\", \"$REDIRECT_URL_STANDALONE\"] | unique")
  oc patch OAuthClient $OAUTH_CLIENT_NAME --type json -p "[{\"op\": \"add\", \"path\": \"/redirectURIs\", \"value\": ${REDIRECT_URIS}}]"
fi

printf "OAUTH2_CLIENT_SECRET=" >> ./backend/.env
oc get OAuthClient $OAUTH_CLIENT_NAME -o jsonpath='{.secret}{"\n"}' >> ./backend/.env

# Create route to the search-api service on the target cluster.
if [[ -n "$INSTALLATION_NAMESPACE" ]]; then
  oc apply -f - << EOF
apiVersion: route.openshift.io/v1
kind: Route
metadata:
  name: search-api
  namespace: $INSTALLATION_NAMESPACE
spec:
  to:
    kind: Service
    name: search-search-api
  tls:
    termination: reencrypt
    insecureEdgeTerminationPolicy: Redirect
EOF
  SEARCH_API_URL=https://$(oc get route search-api -n $INSTALLATION_NAMESPACE -o="jsonpath={.status.ingress[0].host}")
  echo SEARCH_API_URL=$SEARCH_API_URL >> ./backend/.env
fi

CLUSTER_PROXY_ADDON_USER_HOST=$(oc get route cluster-proxy-addon-user -n $INSTALLATION_NAMESPACE_MCE -o="jsonpath={.status.ingress[0].host}")
echo CLUSTER_PROXY_ADDON_USER_HOST=$CLUSTER_PROXY_ADDON_USER_HOST >> ./backend/.env
CLUSTER_PROXY_ADDON_USER_ROUTE=https://$CLUSTER_PROXY_ADDON_USER_HOST
echo CLUSTER_PROXY_ADDON_USER_ROUTE=$CLUSTER_PROXY_ADDON_USER_ROUTE >> ./backend/.env
