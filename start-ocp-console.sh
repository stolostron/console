#!/usr/bin/env bash

set -euo pipefail

source ./port-defaults.sh
source ./oauth-client-name.sh
source ./backend/.env

CONSOLE_VERSION=${CONSOLE_VERSION:=4.20}
KUBEVIRT_PORT=${KUBEVIRT_PORT:=""}
ODF_PORT=${ODF_PORT:=""}
GITOPS_PORT=${GITOPS_PORT:=""}
CONSOLE_IMAGE="quay.io/openshift/origin-console:${CONSOLE_VERSION}"

mkdir -p ocp-console
oc extract secret/off-cluster-token -n openshift-console --to ocp-console --confirm

if [ -n "${OIDC_ISSUER_URL:-}" ]; then
    BRIDGE_USER_AUTH="oidc"
    BRIDGE_USER_AUTH_OIDC_ISSUER_URL="$OIDC_ISSUER_URL"
    BRIDGE_USER_AUTH_OIDC_CLIENT_ID="$OAUTH2_CLIENT_ID"
    BRIDGE_USER_AUTH_OIDC_CLIENT_SECRET="$OAUTH2_CLIENT_SECRET"
    # AES requires exactly 16, 24, or 32 bytes; HMAC accepts 32 or 64 bytes
    openssl rand 32 > ocp-console/cookie-encryption-key
    openssl rand 64 > ocp-console/cookie-authentication-key
    BRIDGE_COOKIE_ENCRYPTION_KEY_FILE="/tmp/cookie-encryption-key"
    BRIDGE_COOKIE_AUTHENTICATION_KEY_FILE="/tmp/cookie-authentication-key"
else
    oc get oauthclient "$OAUTH_CLIENT_NAME" -o jsonpath='{.secret}' > ocp-console/console-client-secret
    BRIDGE_USER_AUTH="openshift"
    BRIDGE_USER_AUTH_OIDC_CLIENT_ID="$OAUTH_CLIENT_NAME"
    BRIDGE_USER_AUTH_OIDC_CLIENT_SECRET_FILE="/tmp/console-client-secret"
fi

BRIDGE_USER_AUTH_OIDC_CA_FILE="/tmp/ca.crt"

echo "Starting local OpenShift console ($BRIDGE_USER_AUTH auth)..."

BRIDGE_BASE_ADDRESS="http://localhost:${CONSOLE_PORT}"
BRIDGE_BRANDING="openshift"
BRIDGE_K8S_MODE="off-cluster"
BRIDGE_CA_FILE="/tmp/ca.crt"
BRIDGE_K8S_MODE_OFF_CLUSTER_SERVICE_ACCOUNT_BEARER_TOKEN_FILE="/tmp/token"
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

function getBridgePlugins {
    local host=$1
    local plugins=""
    if [ -n "$KUBEVIRT_PORT" ]; then
        plugins="${plugins},kubevirt-plugin=http://${host}:${KUBEVIRT_PORT}"
    fi

    if [ -n "$ODF_PORT" ]; then
        plugins="${plugins},odf-multicluster-console=http://${host}:${ODF_PORT}"
    fi

    if [ -n "$GITOPS_PORT" ]; then
        plugins="${plugins},gitops-plugin=http://${host}:${GITOPS_PORT}"
    fi

    echo "mce=http://${host}:${MCE_PORT},acm=http://${host}:${ACM_PORT}${plugins}"
}

function getBridgePluginProxy {
    local host=$1
    local endpoint="https://${host}:${BACKEND_PORT}"
    echo "{\"services\": [{\"consoleAPIPath\": \"/api/proxy/plugin/mce/console/\", \"endpoint\":\"${endpoint}\",\"authorize\":true}, {\"consoleAPIPath\": \"/api/proxy/plugin/acm/console/\", \"endpoint\":\"${endpoint}\",\"authorize\":true}]}"
}

# Prefer podman if installed. Otherwise, fall back to docker.
if [ -x "$(command -v podman)" ]; then
    if [ "$(uname -s)" = "Linux" ]; then
        # Use host networking on Linux since host.containers.internal is unreachable in some environments.
        HOST="localhost"
        podman run \
            -v $PWD/ocp-console:/tmp:Z \
            --pull always --rm -p "$CONSOLE_PORT":9000 \
            --rm --network=host \
            --env-file <(set | grep BRIDGE) \
            --env BRIDGE_PLUGINS="$(getBridgePlugins $HOST)" \
            --env BRIDGE_PLUGIN_PROXY="$(getBridgePluginProxy $HOST)" \
            $CONSOLE_IMAGE
    else
        HOST="host.containers.internal"
        podman run \
            -v $PWD/ocp-console:/tmp \
            --pull always --rm -p "$CONSOLE_PORT":9000 \
            --env-file <(set | grep BRIDGE) \
            --env BRIDGE_PLUGINS="$(getBridgePlugins $HOST)" \
            --env BRIDGE_PLUGIN_PROXY="$(getBridgePluginProxy $HOST)" \
            --arch amd64 \
            $CONSOLE_IMAGE
    fi
else
    HOST="host.docker.internal"
    docker run \
        -v $PWD/ocp-console:/tmp \
        --pull always --rm -p "$CONSOLE_PORT":9000 \
        --env-file <(set | grep BRIDGE) \
        --env BRIDGE_PLUGINS="$(getBridgePlugins $HOST)" \
        --env BRIDGE_PLUGIN_PROXY="$(getBridgePluginProxy $HOST)" \
        --platform linux/amd64 \
        $CONSOLE_IMAGE
fi
