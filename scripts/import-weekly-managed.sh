# Copyright Contributors to the Open Cluster Management project
#!/usr/bin/env bash
set -euo pipefail

#############################################
# Dynamic RHACM Cluster Import Script
#
# This script:
#   1. Finds cluster namespaces from ClusterClaims
#   2. Retrieves *-admin-kubeconfig secrets
#   3. Generates temporary kubeconfig files
#   4. Imports managed cluster into RHACM hub
#
# Requirements:
#   - Script runs on a cluster with access to both claims
#   - ServiceAccount must be able to:
#       get/list clusterclaims
#       get/list secrets
#       manage managedclusters
#
# ** Note: If running this script from Console repo **
#   you will need to oc login to collective cluster. The script will switch kubeconfigs automatically
#############################################

# Config
HUB_CLUSTER_NAME="${HUB_CLUSTER_NAME:-weekly}"
MANAGED_CLUSTER_NAME="${MANAGED_CLUSTER_NAME:-weekly-managed}"
CONSOLE_NAMESPACE="${CONSOLE_NAMESPACE:-console-squad}"
WORKDIR="/tmp/rhacm-import"
HUB_KUBECONFIG="${WORKDIR}/hub-kubeconfig"
MANAGED_KUBECONFIG="${WORKDIR}/managed-kubeconfig"
mkdir -p "${WORKDIR}"

# Helpers
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}
fail() {
  echo "ERROR: $*" >&2
  exit 1
}

# Get Cluster Namespace From ClusterClaim
get_cluster_namespace() {
local CLAIM_NAME="$1"
oc get -n "${CONSOLE_NAMESPACE}" clusterclaim.hive "${CLAIM_NAME}" \
  -o jsonpath='{.spec.namespace}' 2>/dev/null
}

# Find Admin Kubeconfig Secret
find_admin_kubeconfig_secret() {
  local NAMESPACE="$1"
  oc get secrets -n "${NAMESPACE}" \
    --no-headers \
    -o custom-columns="NAME:.metadata.name" | \
    grep '\-admin-kubeconfig$' | \
    head -n 1
}

# Extract Kubeconfig Secret
extract_kubeconfig() {
  local NAMESPACE="$1"
  local SECRET_NAME="$2"
  local OUTPUT_FILE="$3"

  oc get secret "${SECRET_NAME}" \
    -n "${NAMESPACE}" \
    -o jsonpath='{.data.kubeconfig}' | \
    base64 -d > "${OUTPUT_FILE}"

  [[ -s "${OUTPUT_FILE}" ]] \
    || fail "Failed to create kubeconfig: ${OUTPUT_FILE}"
}

# Discover Cluster Namespaces
log "Looking up ClusterClaim: ${HUB_CLUSTER_NAME}"
HUB_NAMESPACE=$(get_cluster_namespace "${HUB_CLUSTER_NAME}")
log "ClusterClaim namespace result: ${HUB_NAMESPACE:-<empty>}"
log "Looking up ClusterClaim: ${MANAGED_CLUSTER_NAME}"
MANAGED_NAMESPACE=$(get_cluster_namespace "${MANAGED_CLUSTER_NAME}")
log "ClusterClaim namespace result: ${MANAGED_NAMESPACE:-<empty>}"

[[ -n "${HUB_NAMESPACE}" ]] \
  || fail "Unable to find namespace for ${HUB_CLUSTER_NAME}"

[[ -n "${MANAGED_NAMESPACE}" ]] \
  || fail "Unable to find namespace for ${MANAGED_CLUSTER_NAME}"

log "Hub namespace: ${HUB_NAMESPACE}"
log "Managed namespace: ${MANAGED_NAMESPACE}"

# Find Kubeconfig Secrets
log "Finding kubeconfig secrets..."
HUB_SECRET=$(find_admin_kubeconfig_secret "${HUB_NAMESPACE}")
MANAGED_SECRET=$(find_admin_kubeconfig_secret "${MANAGED_NAMESPACE}")

[[ -n "${HUB_SECRET}" ]] \
  || fail "No admin kubeconfig secret found in ${HUB_NAMESPACE}"

[[ -n "${MANAGED_SECRET}" ]] \
  || fail "No admin kubeconfig secret found in ${MANAGED_NAMESPACE}"

log "Hub kubeconfig secret: ${HUB_SECRET}"
log "Managed kubeconfig secret: ${MANAGED_SECRET}"

# Extract Kubeconfigs
extract_kubeconfig \
  "${HUB_NAMESPACE}" \
  "${HUB_SECRET}" \
  "${HUB_KUBECONFIG}"

extract_kubeconfig \
  "${MANAGED_NAMESPACE}" \
  "${MANAGED_SECRET}" \
  "${MANAGED_KUBECONFIG}"

# Connect To Hub Cluster
log "Connecting to hub cluster..."
export KUBECONFIG="${HUB_KUBECONFIG}"
oc whoami >/dev/null \
  || fail "Failed to authenticate to hub cluster"
log "Connected to hub cluster"

# Create Namespace
log "Ensuring namespace exists..."
oc get namespace "${MANAGED_CLUSTER_NAME}" >/dev/null 2>&1 || \
  oc create namespace "${MANAGED_CLUSTER_NAME}"

# Check if ManagedCluster exists in hub
if oc get managedcluster "${MANAGED_CLUSTER_NAME}" >/dev/null 2>&1; then
  JOINED_STATUS=$(
    oc get managedcluster "${MANAGED_CLUSTER_NAME}" \
      -o jsonpath='{.status.conditions[?(@.type=="ManagedClusterJoined")].status}' \
      2>/dev/null || true
  )
  AVAILABLE_STATUS=$(
    oc get managedcluster "${MANAGED_CLUSTER_NAME}" \
      -o jsonpath='{.status.conditions[?(@.type=="ManagedClusterConditionAvailable")].status}' \
      2>/dev/null || true
  )
  if [[ "${JOINED_STATUS}" == "True" && "${AVAILABLE_STATUS}" == "True" ]]; then
    log "Cluster already imported and available"
    exit 0
  fi
fi

# Create ManagedCluster
log "Creating ManagedCluster..."
cat <<EOF | oc apply -f -
apiVersion: cluster.open-cluster-management.io/v1
kind: ManagedCluster
metadata:
  name: ${MANAGED_CLUSTER_NAME}
  labels:
    cloud: auto-detect
    vendor: auto-detect
spec:
  hubAcceptsClient: true
EOF

# Create KlusterletAddonConfig
log "Creating KlusterletAddonConfig..."
cat <<EOF | oc apply -f -
apiVersion: agent.open-cluster-management.io/v1
kind: KlusterletAddonConfig
metadata:
  name: ${MANAGED_CLUSTER_NAME}
  namespace: ${MANAGED_CLUSTER_NAME}
spec:
  clusterName: ${MANAGED_CLUSTER_NAME}
  clusterNamespace: ${MANAGED_CLUSTER_NAME}
  clusterLabels:
    name: ${MANAGED_CLUSTER_NAME}
    cloud: auto-detect
    vendor: auto-detect
  applicationManager:
    enabled: true
  policyController:
    enabled: true
  searchCollector:
    enabled: true
  certPolicyController:
    enabled: true
EOF

# Wait For Import Secret
IMPORT_SECRET="${MANAGED_CLUSTER_NAME}-import"
log "Waiting for import secret..."
for i in {1..60}; do
  if oc get secret "${IMPORT_SECRET}" \
    -n "${MANAGED_CLUSTER_NAME}" >/dev/null 2>&1; then
    break
  fi
  sleep 10
done

oc get secret "${IMPORT_SECRET}" \
  -n "${MANAGED_CLUSTER_NAME}" >/dev/null 2>&1 \
  || fail "Import secret not found"

# Extract Import YAML
IMPORT_YAML="${WORKDIR}/import.yaml"
CRDS_YAML="${WORKDIR}/crds.yaml"

log "Extracting import manifests..."
oc get secret "${IMPORT_SECRET}" \
  -n "${MANAGED_CLUSTER_NAME}" \
  -o jsonpath='{.data.import\.yaml}' | \
  base64 -d > "${IMPORT_YAML}"

if oc get secret "${IMPORT_SECRET}" \
  -n "${MANAGED_CLUSTER_NAME}" \
  -o jsonpath='{.data.crds\.yaml}' >/dev/null 2>&1; then

  oc get secret "${IMPORT_SECRET}" \
    -n "${MANAGED_CLUSTER_NAME}" \
    -o jsonpath='{.data.crds\.yaml}' | \
    base64 -d > "${CRDS_YAML}"
fi

# Connect To Managed Cluster
log "Connecting to managed cluster..."
export KUBECONFIG="${MANAGED_KUBECONFIG}"
oc cluster-info >/dev/null \
  || fail "Failed to connect to managed cluster"

# TODO: Find and delete and persisting klusterlet addons

# Apply Import Manifests
if [[ -f "${CRDS_YAML}" ]]; then
  log "Applying CRDs..."
  oc apply -f "${CRDS_YAML}"
fi

log "Applying import manifest..."
oc apply -f "${IMPORT_YAML}"

# Final Verification
sleep 15
log "Switching back to hub cluster..."
export KUBECONFIG="${HUB_KUBECONFIG}"
oc get managedcluster "${MANAGED_CLUSTER_NAME}" || true
log "Import workflow completed successfully"