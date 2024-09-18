#!/usr/bin/env bash

set -euo pipefail

mkdir -p ocp-console
oc process -f ocp-console-oauth-client.yaml | oc apply -f -

oc get oauthclient console-oauth-client -o jsonpath='{.secret}' > ocp-console/console-client-secret

INSTALLATION_NAMESPACE_MCE=`oc get multiclusterengine -A -o jsonpath='{.items[0].spec.targetNamespace}'`
oc get secrets -n $INSTALLATION_NAMESPACE_MCE --field-selector type=kubernetes.io/service-account-token -o json | \
    jq '.items[0].data."ca.crt"' -r | python -m base64 -d > ocp-console/ca.crt

CONSOLE_VERSION=${CONSOLE_VERSION:=4.15}
CONSOLE_PORT=${CONSOLE_PORT:=9000}
CONSOLE_IMAGE="quay.io/openshift/origin-console:${CONSOLE_VERSION}"

echo "Starting local OpenShift console..."


BRIDGE_BASE_ADDRESS="http://localhost:${CONSOLE_PORT}"
BRIDGE_USER_AUTH="openshift"
BRIDGE_K8S_MODE="off-cluster"
BRIDGE_K8S_AUTH="bearer-token"
BRIDGE_CA_FILE="/tmp/ca.crt"
BRIDGE_USER_AUTH_OIDC_CLIENT_ID="console-oauth-client"
BRIDGE_USER_AUTH_OIDC_CLIENT_SECRET_FILE="/tmp/console-client-secret"
BRIDGE_USER_AUTH_OIDC_CA_FILE="/tmp/ca.crt"
BRIDGE_K8S_MODE_OFF_CLUSTER_SKIP_VERIFY_TLS=true
BRIDGE_K8S_MODE_OFF_CLUSTER_ENDPOINT=$(oc whoami --show-server)
# The monitoring operator is not always installed (e.g. for local OpenShift). Tolerate missing config maps.
set +e
BRIDGE_K8S_MODE_OFF_CLUSTER_THANOS=$(oc -n openshift-config-managed get configmap monitoring-shared-config -o jsonpath='{.data.thanosPublicURL}' 2>/dev/null)
BRIDGE_K8S_MODE_OFF_CLUSTER_ALERTMANAGER=$(oc -n openshift-config-managed get configmap monitoring-shared-config -o jsonpath='{.data.alertmanagerPublicURL}' 2>/dev/null)
set -e
if [ "$CONSOLE_VERSION" "<" "4.16" ]; then
    BRIDGE_K8S_AUTH_BEARER_TOKEN=$(oc whoami --show-token 2>/dev/null)
fi
BRIDGE_USER_SETTINGS_LOCATION="localstorage"

# Don't fail if the cluster doesn't have gitops.
set +e
GITOPS_HOSTNAME=$(oc -n openshift-gitops get route cluster -o jsonpath='{.spec.host}' 2>/dev/null)
set -e
if [ -n "$GITOPS_HOSTNAME" ]; then
    BRIDGE_K8S_MODE_OFF_CLUSTER_GITOPS="https://$GITOPS_HOSTNAME"
fi

echo "API Server: $BRIDGE_K8S_MODE_OFF_CLUSTER_ENDPOINT"
echo "Console Image: $CONSOLE_IMAGE"
echo "Console URL: http://localhost:${CONSOLE_PORT}"

# Prefer podman if installed. Otherwise, fall back to docker.
if [ -x "$(command -v podman)" ]; then
    if [ "$(uname -s)" = "Linux" ]; then
        # Use host networking on Linux since host.containers.internal is unreachable in some environments.
        BRIDGE_PLUGINS="mce=http://localhost:3001,acm=http://localhost:3002"

        podman run \
          -v $PWD/ocp-console/console-client-secret:/tmp/console-client-secret:Z \
          -v $PWD/ocp-console/ca.crt:/tmp/ca.crt:Z \
          --pull always \
          --rm --network=host \
          --env BRIDGE_PLUGIN_PROXY='{"services": [{"consoleAPIPath": "/api/proxy/plugin/mce/console/", "endpoint":"https://localhost:4000","authorize":true}, {"consoleAPIPath": "/api/proxy/plugin/acm/console/", "endpoint":"https://localhost:4000","authorize":true}]}' \
          --env-file <(set | grep BRIDGE) \
          $CONSOLE_IMAGE
    else
        BRIDGE_PLUGINS="mce=http://host.containers.internal:3001,acm=http://host.containers.internal:3002"

        podman run \
          -v $PWD/ocp-console/console-client-secret:/tmp/console-client-secret \
          -v $PWD/ocp-console/ca.crt:/tmp/ca.crt \
          --pull always --rm -p "$CONSOLE_PORT":9000 \
          --env-file <(set | grep BRIDGE) \
          --env BRIDGE_PLUGIN_PROXY='{"services": [{"consoleAPIPath": "/api/proxy/plugin/mce/console/", "endpoint":"https://host.containers.internal:4000","authorize":true}, {"consoleAPIPath": "/api/proxy/plugin/acm/console/", "endpoint":"https://host.containers.internal:4000","authorize":true}]}' \
          --arch amd64 \
          $CONSOLE_IMAGE
    fi
else
    BRIDGE_PLUGINS="mce=http://host.docker.internal:3001,acm=http://host.docker.internal:3002"

    docker run \
      -v $PWD/ocp-console/console-client-secret:/tmp/console-client-secret \
      -v $PWD/ocp-console/ca.crt:/tmp/ca.crt \
      --pull always --rm -p "$CONSOLE_PORT":9000 \
      --env-file <(set | grep BRIDGE) \
      --env BRIDGE_PLUGIN_PROXY='{"services": [{"consoleAPIPath": "/api/proxy/plugin/mce/console/", "endpoint":"https://host.docker.internal:4000","authorize":true}, {"consoleAPIPath": "/api/proxy/plugin/acm/console/", "endpoint":"https://host.docker.internal:4000","authorize":true}]}' \
      --platform linux/amd64 \
      $CONSOLE_IMAGE
fi
