#!/usr/bin/env bash
# Copyright Contributors to the Open Cluster Management project

set -euo pipefail

########################################
# Helpers
########################################

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

fail() {
  echo "ERROR: $*" >&2
  exit 1
}

cleanup() {
  rm -rf "${WORKDIR}"
}

trap cleanup EXIT

########################################
# Config
########################################

WORKDIR="/tmp/rhacm-import"
HUB_CLUSTER_NAME="${HUB_CLUSTER_NAME:-weekly}"
MANAGED_CLUSTER_NAME="${MANAGED_CLUSTER_NAME:-weekly-managed}"
CONSOLE_NAMESPACE="${CONSOLE_NAMESPACE:-console-squad}"
CLUSTERPOOL_NAME="${CLUSTERPOOL_NAME:-cs-aws-422}"
CLUSTERPOOL_TARGET_NAMESPACE="${CLUSTERPOOL_TARGET_NAMESPACE:-$CONSOLE_NAMESPACE}"
CLUSTERCLAIM_NAME="${CLUSTERCLAIM_NAME:-$MANAGED_CLUSTER_NAME}"
CLUSTERCLAIM_LIFETIME="${CLUSTERCLAIM_LIFETIME:-164h}"
HUB_KUBECONFIG="${WORKDIR}/hub-kubeconfig"
MANAGED_KUBECONFIG="${WORKDIR}/managed-kubeconfig"
mkdir -p "${WORKDIR}"

########################################
# Display Variables
########################################

log "Starting RHACM managed cluster import workflow"
log "HUB_CLUSTER_NAME=${HUB_CLUSTER_NAME}"
log "MANAGED_CLUSTER_NAME=${MANAGED_CLUSTER_NAME}"
log "CONSOLE_NAMESPACE=${CONSOLE_NAMESPACE}"
log "CLUSTERPOOL_NAME=${CLUSTERPOOL_NAME}"
log "CLUSTERPOOL_TARGET_NAMESPACE=${CLUSTERPOOL_TARGET_NAMESPACE}"
log "CLUSTERCLAIM_NAME=${CLUSTERCLAIM_NAME}"
log "CLUSTERCLAIM_LIFETIME=${CLUSTERCLAIM_LIFETIME}"

########################################
# Verify Dependencies
########################################

command -v oc >/dev/null 2>&1 \
  || fail "oc CLI not installed"

########################################
# Helpers
########################################

get_cluster_namespace() {
  local CLAIM_NAME="$1"

  oc get clusterclaim.hive "${CLAIM_NAME}" \
    -n "${CLUSTERPOOL_TARGET_NAMESPACE}" \
    -o jsonpath='{.spec.namespace}' \
    2>/dev/null || true
}

find_admin_kubeconfig_secret() {
  local NAMESPACE="$1"

  oc get secrets \
    -n "${NAMESPACE}" \
    --no-headers \
    -o custom-columns="NAME:.metadata.name" | \
    grep '\-admin-kubeconfig$' | \
    head -n 1
}

extract_kubeconfig() {
  local NAMESPACE="$1"
  local SECRET_NAME="$2"
  local OUTPUT_FILE="$3"

  oc get secret "${SECRET_NAME}" \
    -n "${NAMESPACE}" \
    -o jsonpath='{.data.kubeconfig}' | \
    base64 -d > "${OUTPUT_FILE}"

  [[ -s "${OUTPUT_FILE}" ]] \
    || fail "Failed to create kubeconfig ${OUTPUT_FILE}"
}

copy_pull_secret() {
  log "Copying pull-secret to managed cluster"

  oc --kubeconfig="${HUB_KUBECONFIG}" \
    get secret pull-secret \
    -n openshift-config \
    -o yaml > "${WORKDIR}/pull-secret.yaml"

  oc --kubeconfig="${MANAGED_KUBECONFIG}" \
    apply -f "${WORKDIR}/pull-secret.yaml"
}

copy_image_digest_mirror_set() {
  log "Copying ImageDigestMirrorSets"

  oc --kubeconfig="${HUB_KUBECONFIG}" \
    get imagedigestmirrorsets.config.openshift.io \
    -o yaml > "${WORKDIR}/idms.yaml" || true

  if [[ -s "${WORKDIR}/idms.yaml" ]]; then
    oc --kubeconfig="${MANAGED_KUBECONFIG}" \
      apply -f "${WORKDIR}/idms.yaml" || true
  fi
}

cleanup_old_klusterlet() {
  log "Cleaning old klusterlet resources"

  oc --kubeconfig="${MANAGED_KUBECONFIG}" \
    delete namespace open-cluster-management-agent \
    --ignore-not-found=true

  oc --kubeconfig="${MANAGED_KUBECONFIG}" \
    delete namespace open-cluster-management-agent-addon \
    --ignore-not-found=true

  oc --kubeconfig="${MANAGED_KUBECONFIG}" \
    delete klusterlet klusterlet \
    --ignore-not-found=true || true

  sleep 20
}

########################################
# Verify Hub Access
########################################

log "Verifying hub cluster access"

oc whoami >/dev/null 2>&1 \
  || fail "Not logged into hub cluster"

########################################
# Create ClusterClaim
########################################

if oc get clusterclaim.hive "${CLUSTERCLAIM_NAME}" \
  -n "${CLUSTERPOOL_TARGET_NAMESPACE}" >/dev/null 2>&1; then

  log "ClusterClaim already exists"
else
  log "Creating ClusterClaim ${CLUSTERCLAIM_NAME}"

  cat <<EOF | oc apply -f -
apiVersion: hive.openshift.io/v1
kind: ClusterClaim
metadata:
  name: ${CLUSTERCLAIM_NAME}
  namespace: ${CLUSTERPOOL_TARGET_NAMESPACE}
  annotations:
    cluster.open-cluster-management.io/createmanagedcluster: 'false'
  labels:
    cluster.open-cluster-management.io/clusterset: console-squad
spec:
  clusterPoolName: ${CLUSTERPOOL_NAME}
  lifetime: ${CLUSTERCLAIM_LIFETIME}
EOF
fi

########################################
# Wait For ClusterClaim Fulfillment
########################################

log "Waiting for ClusterClaim fulfillment"

MANAGED_NAMESPACE=""

for i in {1..90}; do
  MANAGED_NAMESPACE=$(get_cluster_namespace "${CLUSTERCLAIM_NAME}")

  if [[ -n "${MANAGED_NAMESPACE}" ]]; then
    break
  fi

  sleep 20
done

[[ -n "${MANAGED_NAMESPACE}" ]] \
  || fail "ClusterClaim was not fulfilled"

log "Managed cluster namespace: ${MANAGED_NAMESPACE}"

########################################
# Discover Hub Namespace
########################################

log "Looking up hub cluster namespace"

HUB_NAMESPACE=$(get_cluster_namespace "${HUB_CLUSTER_NAME}")

[[ -n "${HUB_NAMESPACE}" ]] \
  || fail "Unable to find namespace for ${HUB_CLUSTER_NAME}"

log "Hub namespace: ${HUB_NAMESPACE}"

########################################
# Find Kubeconfig Secrets
########################################

log "Finding admin kubeconfig secrets"

HUB_SECRET=$(find_admin_kubeconfig_secret "${HUB_NAMESPACE}")

MANAGED_SECRET=$(find_admin_kubeconfig_secret "${MANAGED_NAMESPACE}")

[[ -n "${HUB_SECRET}" ]] \
  || fail "Hub kubeconfig secret not found"

[[ -n "${MANAGED_SECRET}" ]] \
  || fail "Managed kubeconfig secret not found"

log "Hub kubeconfig secret: ${HUB_SECRET}"
log "Managed kubeconfig secret: ${MANAGED_SECRET}"

########################################
# Extract Kubeconfigs
########################################

log "Extracting kubeconfigs"

extract_kubeconfig \
  "${HUB_NAMESPACE}" \
  "${HUB_SECRET}" \
  "${HUB_KUBECONFIG}"

extract_kubeconfig \
  "${MANAGED_NAMESPACE}" \
  "${MANAGED_SECRET}" \
  "${MANAGED_KUBECONFIG}"

########################################
# Verify Cluster Connectivity
########################################

log "Verifying hub connectivity"

oc --kubeconfig="${HUB_KUBECONFIG}" \
  whoami >/dev/null \
  || fail "Failed to connect to hub cluster"

log "Verifying managed cluster connectivity"

oc --kubeconfig="${MANAGED_KUBECONFIG}" \
  cluster-info >/dev/null \
  || fail "Failed to connect to managed cluster"

########################################
# Copy Pull Secret
########################################

copy_pull_secret

########################################
# Copy ImageDigestMirrorSets
########################################

copy_image_digest_mirror_set

########################################
# Cleanup Old Klusterlet
########################################

cleanup_old_klusterlet

########################################
# Ensure Namespace Exists On Hub
########################################

log "Ensuring managed cluster namespace exists on hub"

oc --kubeconfig="${HUB_KUBECONFIG}" \
  get namespace "${MANAGED_CLUSTER_NAME}" >/dev/null 2>&1 || \
  oc --kubeconfig="${HUB_KUBECONFIG}" \
    create namespace "${MANAGED_CLUSTER_NAME}"

########################################
# Check Existing ManagedCluster
########################################

if oc --kubeconfig="${HUB_KUBECONFIG}" \
  get managedcluster "${MANAGED_CLUSTER_NAME}" >/dev/null 2>&1; then

  JOINED_STATUS=$(
    oc --kubeconfig="${HUB_KUBECONFIG}" \
      get managedcluster "${MANAGED_CLUSTER_NAME}" \
      -o jsonpath='{.status.conditions[?(@.type=="ManagedClusterJoined")].status}' \
      2>/dev/null || true
  )

  AVAILABLE_STATUS=$(
    oc --kubeconfig="${HUB_KUBECONFIG}" \
      get managedcluster "${MANAGED_CLUSTER_NAME}" \
      -o jsonpath='{.status.conditions[?(@.type=="ManagedClusterConditionAvailable")].status}' \
      2>/dev/null || true
  )

  if [[ "${JOINED_STATUS}" == "True" && "${AVAILABLE_STATUS}" == "True" ]]; then
    log "Managed cluster already imported and available"
    exit 0
  fi
fi

########################################
# Create ManagedCluster
########################################

log "Creating ManagedCluster"

cat <<EOF | oc --kubeconfig="${HUB_KUBECONFIG}" apply -f -
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

########################################
# Create KlusterletAddonConfig
########################################

log "Creating KlusterletAddonConfig"

cat <<EOF | oc --kubeconfig="${HUB_KUBECONFIG}" apply -f -
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

########################################
# Wait For Import Secret
########################################

IMPORT_SECRET="${MANAGED_CLUSTER_NAME}-import"

log "Waiting for import secret"

for i in {1..90}; do
  if oc --kubeconfig="${HUB_KUBECONFIG}" \
    get secret "${IMPORT_SECRET}" \
    -n "${MANAGED_CLUSTER_NAME}" >/dev/null 2>&1; then
    break
  fi

  sleep 10
done

oc --kubeconfig="${HUB_KUBECONFIG}" \
  get secret "${IMPORT_SECRET}" \
  -n "${MANAGED_CLUSTER_NAME}" >/dev/null 2>&1 \
  || fail "Import secret not found"

########################################
# Extract Import YAML
########################################

IMPORT_YAML="${WORKDIR}/import.yaml"
CRDS_YAML="${WORKDIR}/crds.yaml"

log "Extracting import manifests"

oc --kubeconfig="${HUB_KUBECONFIG}" \
  get secret "${IMPORT_SECRET}" \
  -n "${MANAGED_CLUSTER_NAME}" \
  -o jsonpath='{.data.import\.yaml}' | \
  base64 -d > "${IMPORT_YAML}"

CRDS_DATA=$(
  oc --kubeconfig="${HUB_KUBECONFIG}" \
    get secret "${IMPORT_SECRET}" \
    -n "${MANAGED_CLUSTER_NAME}" \
    -o jsonpath='{.data.crds\.yaml}' \
    2>/dev/null || true
)

if [[ -n "${CRDS_DATA}" ]]; then
  echo "${CRDS_DATA}" | base64 -d > "${CRDS_YAML}"
fi

########################################
# Apply Import Manifests
########################################

if [[ -f "${CRDS_YAML}" ]]; then
  log "Applying CRDs"

  oc --kubeconfig="${MANAGED_KUBECONFIG}" \
    apply -f "${CRDS_YAML}"
fi

log "Applying import manifest"

oc --kubeconfig="${MANAGED_KUBECONFIG}" \
  apply -f "${IMPORT_YAML}"

########################################
# Wait For ManagedCluster Join
########################################

log "Waiting for managed cluster to become available"

for i in {1..60}; do

  JOINED=$(
    oc --kubeconfig="${HUB_KUBECONFIG}" \
      get managedcluster "${MANAGED_CLUSTER_NAME}" \
      -o jsonpath='{.status.conditions[?(@.type=="ManagedClusterJoined")].status}' \
      2>/dev/null || true
  )

  AVAILABLE=$(
    oc --kubeconfig="${HUB_KUBECONFIG}" \
      get managedcluster "${MANAGED_CLUSTER_NAME}" \
      -o jsonpath='{.status.conditions[?(@.type=="ManagedClusterConditionAvailable")].status}' \
      2>/dev/null || true
  )

  log "ManagedCluster Joined=${JOINED} Available=${AVAILABLE}"

  if [[ "${JOINED}" == "True" && "${AVAILABLE}" == "True" ]]; then
    log "Managed cluster successfully imported"
    exit 0
  fi

  sleep 20
done

fail "Managed cluster failed to become available"