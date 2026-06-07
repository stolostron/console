#!/usr/bin/env bash
# Copyright Contributors to the Open Cluster Management project
# Idempotent script for installing Ansible Automation Platform (AAP) on OpenShift
# Safe to run repeatedly - checks for existing installation before proceeding

set -e

# Configuration variables
AAP_NAMESPACE=${AAP_NAMESPACE:-"ansible-automation-platform"}
PLATFORM_NAME=${PLATFORM_NAME:-"aap-platform"}
OPERATOR_CHANNEL=${OPERATOR_CHANNEL:-""}
OPERATOR_SOURCE=${OPERATOR_SOURCE:-"redhat-operators"}
RH_OFFLINE_TOKEN=${RH_OFFLINE_TOKEN:-""}
AAP_MODE=${AAP_MODE:-"platform"}  # "platform" (AnsibleAutomationPlatform) or "controller" (AutomationController)
# Optional platform-mode components (ignored in controller mode):
#   Hub  = private repo for Ansible collections and execution environments
#   EDA  = event-driven automation (trigger playbooks from webhooks, alerts, etc.)
# Both require significant extra cluster resources; only enable if needed.
ENABLE_HUB=${ENABLE_HUB:-"false"}
ENABLE_EDA=${ENABLE_EDA:-"false"}

# Validate AAP_MODE
case "$AAP_MODE" in
    platform|controller) ;;
    *)
        echo "ERROR: Invalid AAP_MODE: $AAP_MODE. Expected 'platform' or 'controller'."
        exit 1
        ;;
esac

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check prerequisites
for cmd in oc curl jq base64; do
    if ! command -v "$cmd" &> /dev/null; then
        log_error "$cmd not found. Please install $cmd."
        exit 1
    fi
done

# Curl options: TLS verification enabled by default; set CURL_INSECURE=true to
# skip verification (e.g., for self-signed certs on internal AAP routes).
CURL_OPTS=(-s)
if [ "${CURL_INSECURE:-false}" = "true" ]; then
    CURL_OPTS+=(-k)
    log_warn "CURL_INSECURE=true: TLS certificate verification is disabled"
fi

if ! oc whoami &> /dev/null; then
    log_error "Not logged into an OpenShift cluster. Please run 'oc login' first."
    exit 1
fi

# --- Idempotency check ---
check_aap_status() {
    if ! oc get namespace "$AAP_NAMESPACE" &> /dev/null; then
        echo "not_installed"; return
    fi
    if [ "$AAP_MODE" = "controller" ]; then
        if ! oc get automationcontroller "$PLATFORM_NAME" -n "$AAP_NAMESPACE" &> /dev/null; then
            echo "namespace_only"; return
        fi
        CR_STATUS=$(oc get automationcontroller "$PLATFORM_NAME" -n "$AAP_NAMESPACE" \
            -o jsonpath='{.status.conditions[?(@.type=="Running")].status}' 2>/dev/null || echo "Unknown")
        PODS_RUNNING=$(oc get pods -n "$AAP_NAMESPACE" -l app.kubernetes.io/managed-by=automationcontroller-operator \
            --no-headers 2>/dev/null | awk '$3=="Running"{c++} END{print c+0}')
    else
        if ! oc get ansibleautomationplatform "$PLATFORM_NAME" -n "$AAP_NAMESPACE" &> /dev/null; then
            echo "namespace_only"; return
        fi
        CR_STATUS=$(oc get ansibleautomationplatform "$PLATFORM_NAME" -n "$AAP_NAMESPACE" \
            -o jsonpath='{.status.conditions[?(@.type=="Running")].status}' 2>/dev/null || echo "Unknown")
        PODS_RUNNING=$(oc get pods -n "$AAP_NAMESPACE" -l app.kubernetes.io/name=aap-platform,app.kubernetes.io/component=gateway \
            --no-headers 2>/dev/null | awk '$3=="Running"{c++} END{print c+0}')
    fi
    if [ "$CR_STATUS" = "True" ] || [ "$PODS_RUNNING" -gt "0" ]; then
        echo "healthy"
    else
        echo "unhealthy"
    fi
}

AAP_STATUS=$(check_aap_status)
log_info "Current AAP status: $AAP_STATUS"

case "$AAP_STATUS" in
    "healthy")
        ROUTE_URL=$(oc get route "${PLATFORM_NAME}" -n "$AAP_NAMESPACE" -o jsonpath='{.spec.host}' 2>/dev/null || echo "N/A")
        log_info "AAP is already installed and healthy at https://${ROUTE_URL}"
        exit 0
        ;;
    "not_installed")
        log_info "AAP is not installed. Starting installation..."
        ;;
    "namespace_only")
        log_info "Namespace exists but AnsibleAutomationPlatform not found. Continuing installation..."
        ;;
    "unhealthy")
        log_warn "AAP is installed but not healthy. Attempting repair..."
        ;;
    *)
        log_error "Unknown AAP status: $AAP_STATUS"
        exit 1
        ;;
esac

# --- Installation ---
log_info "Starting AAP installation on OpenShift cluster: $(oc whoami --show-server)"

# Create namespace
log_info "Creating namespace: $AAP_NAMESPACE"
oc create namespace "$AAP_NAMESPACE" --dry-run=client -o yaml | oc apply -f -

# Auto-detect operator channel if not set or if the requested channel is unavailable
OC_PKG_STDERR=$(mktemp)
AVAILABLE_CHANNELS=$(oc get packagemanifest ansible-automation-platform-operator \
    -n openshift-marketplace -o jsonpath='{range .status.channels[*]}{.name}{"\n"}{end}' 2>"$OC_PKG_STDERR")

if [ -z "$AVAILABLE_CHANNELS" ]; then
    OC_ERR=$(cat "$OC_PKG_STDERR")
    rm -f "$OC_PKG_STDERR"
    log_error "AAP operator not found in OperatorHub catalog (oc get packagemanifest failed: ${OC_ERR:-no output})"
    exit 1
fi
rm -f "$OC_PKG_STDERR"

if [ -n "$OPERATOR_CHANNEL" ] && ! echo "$AVAILABLE_CHANNELS" | grep -qx "$OPERATOR_CHANNEL"; then
    log_warn "Requested channel '$OPERATOR_CHANNEL' not available — will auto-select the latest stable-* channel"
    OPERATOR_CHANNEL=""
fi

if [ -z "$OPERATOR_CHANNEL" ]; then
    log_info "Detecting available AAP operator channels..."
    OPERATOR_CHANNEL=$(echo "$AVAILABLE_CHANNELS" | grep '^stable-' | grep -v 'cluster-scoped' \
        | sort -t. -k2 -n | tail -1)

    if [ -z "$OPERATOR_CHANNEL" ]; then
        OPERATOR_CHANNEL=$(echo "$AVAILABLE_CHANNELS" | sort -t. -k2 -n | tail -1)
    fi

    log_info "Auto-detected operator channel: $OPERATOR_CHANNEL"
fi

# Install AAP Operator
log_info "Installing AAP Operator via OperatorHub"
cat <<EOF | oc apply -f -
apiVersion: operators.coreos.com/v1
kind: OperatorGroup
metadata:
  name: ansible-automation-platform-operator-group
  namespace: $AAP_NAMESPACE
spec:
  targetNamespaces:
  - $AAP_NAMESPACE
---
apiVersion: operators.coreos.com/v1alpha1
kind: Subscription
metadata:
  name: ansible-automation-platform-operator
  namespace: $AAP_NAMESPACE
spec:
  channel: $OPERATOR_CHANNEL
  installPlanApproval: Automatic
  name: ansible-automation-platform-operator
  source: $OPERATOR_SOURCE
  sourceNamespace: openshift-marketplace
EOF

# Wait for operator to be ready
log_info "Waiting for AAP Operator to be ready..."
TIMEOUT=300
ELAPSED=0
INTERVAL=10

while [ $ELAPSED -lt $TIMEOUT ]; do
    CSV_CHECK=$(oc get csv -n "$AAP_NAMESPACE" -o jsonpath='{.items[*].status.phase}' 2>/dev/null \
        | tr ' ' '\n' | grep -c "Succeeded" || true)
    CSV_CHECK=${CSV_CHECK:-0}
    if [ "$CSV_CHECK" -gt "0" ]; then
        log_info "AAP Operator is ready"
        break
    fi
    sleep $INTERVAL
    ELAPSED=$((ELAPSED + INTERVAL))
    log_info "Waiting... ($ELAPSED/$TIMEOUT seconds)"
done

if [ $ELAPSED -ge $TIMEOUT ]; then
    log_warn "Timeout waiting for AAP Operator CSV, checking if operator is already installed..."
    OPERATOR_PODS=$(oc get pods -n "$AAP_NAMESPACE" -l app.kubernetes.io/component=operator --no-headers 2>/dev/null | wc -l)
    if [ "$OPERATOR_PODS" -gt "0" ]; then
        log_info "Operator pods found, continuing with installation..."
    else
        log_error "AAP Operator is not ready"
        exit 1
    fi
fi

CSV_VERSION=$(oc get csv -n "$AAP_NAMESPACE" -o jsonpath='{.items[*].metadata.name}' 2>/dev/null | grep -o 'aap-operator[^ ]*' | head -1 || echo "unknown")
log_info "AAP Operator CSV: $CSV_VERSION"

# Create CR based on mode
if [ "$AAP_MODE" = "controller" ]; then
    log_info "Creating AutomationController (legacy mode): $PLATFORM_NAME"
    cat <<EOF | oc apply -f -
apiVersion: automationcontroller.ansible.com/v1beta1
kind: AutomationController
metadata:
  name: $PLATFORM_NAME
  namespace: $AAP_NAMESPACE
spec:
  replicas: 1
EOF
else
    log_info "Creating AnsibleAutomationPlatform (platform mode): $PLATFORM_NAME"

    PLATFORM_SPEC="apiVersion: aap.ansible.com/v1alpha1
kind: AnsibleAutomationPlatform
metadata:
  name: $PLATFORM_NAME
  namespace: $AAP_NAMESPACE
spec:
  controller:
    replicas: 1"

    if [ "$ENABLE_HUB" = "true" ]; then
        PLATFORM_SPEC="$PLATFORM_SPEC
  hub:
    replicas: 1"
    fi

    if [ "$ENABLE_EDA" = "true" ]; then
        PLATFORM_SPEC="$PLATFORM_SPEC
  eda:
    replicas: 1"
    fi

    echo "$PLATFORM_SPEC" | oc apply -f -
fi

# Wait for deployment to be ready (secret + route must exist before proceeding)
log_info "Waiting for AAP deployment to be ready (mode: $AAP_MODE)..."
log_info "This may take several minutes as components are deployed..."
TIMEOUT=900
ELAPSED=0
INTERVAL=15

while [ $ELAPSED -lt $TIMEOUT ]; do
    ADMIN_SECRET=$(oc get secret "${PLATFORM_NAME}-admin-password" -n "$AAP_NAMESPACE" \
        -o jsonpath='{.data.password}' 2>/dev/null || true)
    ROUTE_HOST=$(oc get route "${PLATFORM_NAME}" -n "$AAP_NAMESPACE" \
        -o jsonpath='{.spec.host}' 2>/dev/null || true)

    if [ -n "$ADMIN_SECRET" ] && [ -n "$ROUTE_HOST" ]; then
        log_info "AAP deployment is ready (secret + route available)"
        break
    fi

    sleep $INTERVAL
    ELAPSED=$((ELAPSED + INTERVAL))
    HAS_SECRET="no"; [ -n "$ADMIN_SECRET" ] && HAS_SECRET="yes"
    HAS_ROUTE="no"; [ -n "$ROUTE_HOST" ] && HAS_ROUTE="yes"
    log_info "Waiting... (${ELAPSED}/${TIMEOUT}s) secret=${HAS_SECRET} route=${HAS_ROUTE}"
done

if [ $ELAPSED -ge $TIMEOUT ]; then
    if [ -z "$ADMIN_SECRET" ]; then
        log_error "Timeout: admin password secret not found"
        exit 1
    fi
    if [ -z "$ROUTE_HOST" ]; then
        log_warn "Timeout: route not found, continuing without URL"
    fi
fi

ADMIN_PASSWORD=$(echo "$ADMIN_SECRET" | base64 -d)
ROUTE_URL="$ROUTE_HOST"

if [ -z "$ADMIN_PASSWORD" ]; then
    log_error "Failed to decode admin password"
    exit 1
fi

# --- Determine API base URL ---
AAP_URL="https://${ROUTE_URL}"
if [ "$AAP_MODE" = "controller" ]; then
    API_BASE="${AAP_URL}/api/v2"
    API_PING_PATH="/api/v2/ping/"
else
    API_BASE="${AAP_URL}/api/controller/v2"
    API_PING_PATH="/api/controller/v2/config/"
fi

if [ -z "$ROUTE_URL" ]; then
    log_warn "Route is unavailable; skipping automated subscription setup"
elif [ -n "$RH_OFFLINE_TOKEN" ]; then
    log_info "Configuring subscription using offline token..."

    RHSM_API="https://api.access.redhat.com/management/v1"
    ALLOCATION_NAME="AAP-Automation-$(date +%Y%m%d)"
    MANIFEST_FILE=$(mktemp /tmp/manifest-XXXXXX.zip)
    trap 'rm -f "$MANIFEST_FILE"' EXIT

    # Wait for API readiness before attempting subscription upload
    log_info "Waiting for AAP API to accept requests..."
    API_TIMEOUT=600
    API_ELAPSED=0
    while [ $API_ELAPSED -lt $API_TIMEOUT ]; do
        API_STATUS=$(curl "${CURL_OPTS[@]}" -o /dev/null -w "%{http_code}" \
            -u "admin:${ADMIN_PASSWORD}" "${AAP_URL}${API_PING_PATH}" 2>/dev/null)
        if [ "$API_STATUS" = "200" ]; then
            log_info "AAP API is ready"
            break
        fi
        sleep 15
        API_ELAPSED=$((API_ELAPSED + 15))
        log_info "Waiting for API... (${API_ELAPSED}/${API_TIMEOUT}s) - HTTP ${API_STATUS}"
    done

    if [ "$API_STATUS" != "200" ]; then
        log_warn "AAP API not responding (HTTP ${API_STATUS}) - skipping subscription setup"
    else
        # Exchange offline token for access token
        log_info "Obtaining access token from Red Hat SSO..."
        ACCESS_TOKEN=$(curl "${CURL_OPTS[@]}" -X POST \
            "https://sso.redhat.com/auth/realms/redhat-external/protocol/openid-connect/token" \
            -d "grant_type=refresh_token" \
            -d "client_id=rhsm-api" \
            -d "refresh_token=${RH_OFFLINE_TOKEN}" | jq -r '.access_token')

        if [ -z "$ACCESS_TOKEN" ] || [ "$ACCESS_TOKEN" = "null" ]; then
            log_warn "Failed to obtain access token - skipping subscription setup"
        else
            # Check for existing allocation: first by name, then reuse any with entitlements
            ALLOCATIONS_RESPONSE=$(curl "${CURL_OPTS[@]}" -H "Authorization: Bearer ${ACCESS_TOKEN}" \
                "${RHSM_API}/allocations")
            ALLOCATION_UUID=$(echo "$ALLOCATIONS_RESPONSE" | jq -r --arg name "$ALLOCATION_NAME" \
                '[.body[] | select(.name == $name)][0].uuid // empty')

            if [ -z "$ALLOCATION_UUID" ]; then
                log_info "No allocation named '$ALLOCATION_NAME', checking for any existing allocation with entitlements..."
                ALLOCATION_UUID=$(echo "$ALLOCATIONS_RESPONSE" | jq -r \
                    '[.body[] | select(.entitlementQuantity > 0)][0].uuid // empty')
                if [ -n "$ALLOCATION_UUID" ]; then
                    REUSED_NAME=$(echo "$ALLOCATIONS_RESPONSE" | jq -r --arg uuid "$ALLOCATION_UUID" \
                        '[.body[] | select(.uuid == $uuid)][0].name')
                    log_info "Reusing existing allocation: $REUSED_NAME ($ALLOCATION_UUID)"
                fi
            fi

            if [ -z "$ALLOCATION_UUID" ]; then
                log_info "Creating new subscription allocation: $ALLOCATION_NAME"
                ALLOCATION_UUID=$(curl "${CURL_OPTS[@]}" -X POST \
                    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
                    -H "Content-Type: application/json" \
                    -d "{\"name\":\"${ALLOCATION_NAME}\",\"type\":\"SAM\",\"version\":\"1.4\"}" \
                    "${RHSM_API}/allocations" | jq -r '.body.uuid // empty')

                if [ -n "$ALLOCATION_UUID" ]; then
                    POOL_ID=$(curl "${CURL_OPTS[@]}" -H "Authorization: Bearer ${ACCESS_TOKEN}" \
                        "${RHSM_API}/allocations/${ALLOCATION_UUID}/subscriptions/available" | \
                        jq -r '[.body[] | select(.product_name | contains("Ansible"))][0].pool_id // empty')

                    if [ -n "$POOL_ID" ]; then
                        ATTACH_RESPONSE=$(curl "${CURL_OPTS[@]}" -X POST \
                            -H "Authorization: Bearer ${ACCESS_TOKEN}" \
                            -H "Content-Type: application/json" \
                            -d "{\"pool_id\":\"${POOL_ID}\",\"quantity\":1}" \
                            "${RHSM_API}/allocations/${ALLOCATION_UUID}/subscriptions" \
                            -w "\nHTTP_CODE:%{http_code}")
                        ATTACH_HTTP=$(echo "$ATTACH_RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
                        if [ "$ATTACH_HTTP" = "200" ] || [ "$ATTACH_HTTP" = "201" ]; then
                            log_info "Subscription attached"
                        else
                            log_warn "Subscription attach returned HTTP $ATTACH_HTTP"
                        fi
                    else
                        log_warn "No AAP subscription pool found"
                    fi
                else
                    log_warn "Failed to create allocation - skipping subscription setup"
                fi
            fi

            if [ -n "$ALLOCATION_UUID" ]; then
                log_info "Downloading subscription manifest..."
                # RHSM export is async with multi-hop: /export -> /exportJob/{id} -> /export/{id}
                EXPORT_RESPONSE=$(curl "${CURL_OPTS[@]}" -H "Authorization: Bearer ${ACCESS_TOKEN}" \
                    "${RHSM_API}/allocations/${ALLOCATION_UUID}/export")
                EXPORT_HREF=$(echo "$EXPORT_RESPONSE" | jq -r '.body.href // empty' 2>/dev/null)

                if [ -n "$EXPORT_HREF" ]; then
                    log_info "Export job started, following async chain..."
                    EXPORT_ATTEMPTS=0
                    while [ $EXPORT_ATTEMPTS -lt 10 ]; do
                        sleep 3
                        HOP_RESPONSE=$(curl "${CURL_OPTS[@]}" -H "Authorization: Bearer ${ACCESS_TOKEN}" \
                            "$EXPORT_HREF" -o "${MANIFEST_FILE}" -w "\nHTTP_CODE:%{http_code}")
                        HOP_HTTP=$(echo "$HOP_RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)

                        if file "$MANIFEST_FILE" 2>/dev/null | grep -q "Zip archive"; then
                            log_info "Manifest downloaded ($(wc -c < "$MANIFEST_FILE" | tr -d ' ') bytes)"
                            break
                        fi

                        NEXT_HREF=$(jq -r '.body.href // empty' "$MANIFEST_FILE" 2>/dev/null)
                        if [ -n "$NEXT_HREF" ]; then
                            EXPORT_HREF="$NEXT_HREF"
                            log_info "Following export redirect..."
                        fi
                        EXPORT_ATTEMPTS=$((EXPORT_ATTEMPTS + 1))
                    done

                    if ! file "$MANIFEST_FILE" 2>/dev/null | grep -q "Zip archive"; then
                        log_warn "Export did not produce a valid ZIP after $EXPORT_ATTEMPTS attempts"
                        rm -f "$MANIFEST_FILE"
                    fi
                else
                    DOWNLOAD_HTTP=$(curl "${CURL_OPTS[@]}" -H "Authorization: Bearer ${ACCESS_TOKEN}" \
                        "${RHSM_API}/allocations/${ALLOCATION_UUID}/export" \
                        -o "${MANIFEST_FILE}" -w "%{http_code}")
                    if [ "$DOWNLOAD_HTTP" != "200" ]; then
                        log_warn "Manifest download returned HTTP $DOWNLOAD_HTTP"
                        rm -f "$MANIFEST_FILE"
                    fi
                fi

                if [ -f "$MANIFEST_FILE" ] && [ -s "$MANIFEST_FILE" ]; then
                    log_info "Uploading manifest to AAP..."
                    MANIFEST_B64=$(base64 < "${MANIFEST_FILE}")
                    UPLOAD_RESPONSE=$(curl "${CURL_OPTS[@]}" -X POST \
                        -u "admin:${ADMIN_PASSWORD}" \
                        -H "Content-Type: application/json" \
                        -d "{\"manifest\":\"${MANIFEST_B64}\",\"eula_accepted\":true}" \
                        "${API_BASE}/config/" \
                        -w "\nHTTP_CODE:%{http_code}")

                    HTTP_CODE=$(echo "$UPLOAD_RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
                    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
                        log_info "Subscription manifest uploaded successfully"
                    else
                        log_warn "Manifest upload returned HTTP $HTTP_CODE (AAP 2.5 with SCA may not require it)"
                    fi
                else
                    log_warn "Failed to download manifest"
                fi
            fi
        fi
    fi
else
    log_info "No RH_OFFLINE_TOKEN set - skipping automated subscription setup"
fi

# --- OAuth token generation ---
OAUTH_TOKEN=""
if [ -n "$ROUTE_URL" ] && [ -n "$ADMIN_PASSWORD" ]; then
    log_info "Waiting for AAP API before generating token..."
    API_TIMEOUT=600
    API_ELAPSED=0
    API_STATUS=""
    while [ $API_ELAPSED -lt $API_TIMEOUT ]; do
        API_STATUS=$(curl "${CURL_OPTS[@]}" -o /dev/null -w "%{http_code}" \
            -u "admin:${ADMIN_PASSWORD}" "${AAP_URL}${API_PING_PATH}" 2>/dev/null)
        if [ "$API_STATUS" = "200" ]; then break; fi
        sleep 15
        API_ELAPSED=$((API_ELAPSED + 15))
        log_info "Waiting for API... (${API_ELAPSED}/${API_TIMEOUT}s) - HTTP ${API_STATUS}"
    done

    if [ "$API_STATUS" = "200" ]; then
        log_info "Generating OAuth2 token for external integrations..."
        TOKEN_RESPONSE=$(curl "${CURL_OPTS[@]}" -X POST \
            -u "admin:${ADMIN_PASSWORD}" \
            -H "Content-Type: application/json" \
            -d '{"scope":"write"}' \
            "${AAP_URL}/api/gateway/v1/tokens/" 2>/dev/null)
        OAUTH_TOKEN=$(echo "$TOKEN_RESPONSE" | jq -r '.token // empty' 2>/dev/null)

        if [ -z "$OAUTH_TOKEN" ]; then
            log_info "Gateway token endpoint unavailable, trying controller endpoint..."
            TOKEN_RESPONSE=$(curl "${CURL_OPTS[@]}" -X POST \
                -u "admin:${ADMIN_PASSWORD}" \
                -H "Content-Type: application/json" \
                -d '{"scope":"write"}' \
                "${API_BASE}/tokens/" 2>/dev/null)
            OAUTH_TOKEN=$(echo "$TOKEN_RESPONSE" | jq -r '.token // empty' 2>/dev/null)
        fi
    else
        log_warn "AAP API not ready (HTTP ${API_STATUS}) - skipping token generation"
    fi

    if [ -n "$OAUTH_TOKEN" ]; then
        log_info "OAuth token generated successfully"
        oc create secret generic "${PLATFORM_NAME}-oauth-token" \
            -n "$AAP_NAMESPACE" \
            --from-literal=token="$OAUTH_TOKEN" \
            --from-literal=host="$ROUTE_URL" \
            --dry-run=client -o yaml | oc apply -f -
        log_info "Token stored in secret: ${PLATFORM_NAME}-oauth-token"

        # Create ACM Ansible credential so AAP is usable from ACM immediately
        ACM_CREDENTIAL_NAME="aap-shared-credential"
        log_info "Creating ACM Ansible credential: ${ACM_CREDENTIAL_NAME}"
        cat <<CREDENTIAL_EOF | oc apply -f -
apiVersion: v1
kind: Secret
type: Opaque
metadata:
  name: ${ACM_CREDENTIAL_NAME}
  namespace: ${AAP_NAMESPACE}
  labels:
    cluster.open-cluster-management.io/type: "ans"
    cluster.open-cluster-management.io/credentials: ""
stringData:
  host: "${AAP_URL}"
  token: "${OAUTH_TOKEN}"
CREDENTIAL_EOF
        log_info "ACM credential created in namespace: ${AAP_NAMESPACE}"
    else
        log_warn "Failed to generate OAuth token"
    fi
fi

# --- Summary ---
echo ""
log_info "=================================================="
log_info "AAP Installation Complete!"
log_info "=================================================="
echo ""
log_info "Namespace:        $AAP_NAMESPACE"
log_info "Mode:             $AAP_MODE"
log_info "Platform Name:    $PLATFORM_NAME"
log_info "URL:              https://${ROUTE_URL}"
log_info "Username:         admin"
log_info "Password:         (retrieve via command below)"
if [ -n "$OAUTH_TOKEN" ]; then
    log_info "OAuth Secret:     ${PLATFORM_NAME}-oauth-token"
    log_info "ACM Credential:   ${ACM_CREDENTIAL_NAME} (namespace: ${AAP_NAMESPACE})"
fi
echo ""
log_info "Deployed Components:"
if [ "$AAP_MODE" = "controller" ]; then
    log_info "  - Controller (Standalone)"
else
    log_info "  - Gateway (UI)"
    log_info "  - Controller (Automation Engine)"
    if [ "$ENABLE_HUB" = "true" ]; then
        log_info "  - Automation Hub (Content Management)"
    fi
    if [ "$ENABLE_EDA" = "true" ]; then
        log_info "  - Event-Driven Ansible"
    fi
fi
echo ""
log_info "To retrieve the password later, run:"
log_info "  oc get secret ${PLATFORM_NAME}-admin-password -n $AAP_NAMESPACE -o jsonpath='{.data.password}' | base64 -d"
if [ -n "$OAUTH_TOKEN" ]; then
    log_info "To retrieve the OAuth token, run:"
    log_info "  oc get secret ${PLATFORM_NAME}-oauth-token -n $AAP_NAMESPACE -o jsonpath='{.data.token}' | base64 -d"
    log_info "To retrieve the ACM credential secret, run:"
    log_info "  oc get secret ${ACM_CREDENTIAL_NAME} -n $AAP_NAMESPACE -o yaml"
fi
