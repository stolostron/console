#!/usr/bin/env bash
# Copyright Contributors to the Open Cluster Management project

set -euo pipefail

########################################
# Config
########################################

WORKDIR="/tmp/rhacm-import"
HUB_CLUSTER_NAME="${HUB_CLUSTER_NAME:-weekly}"
MANAGED_CLUSTER_NAME="${MANAGED_CLUSTER_NAME:-weekly-managed}"
CLUSTERPOOL_NAME="${CLUSTERPOOL_NAME:-cs-aws-420}" # should be alternated via cronjob args
CLUSTERPOOL_TARGET_NAMESPACE="${CLUSTERPOOL_TARGET_NAMESPACE:-console-squad}"
CLUSTERCLAIM_NAME="${CLUSTERCLAIM_NAME:-$MANAGED_CLUSTER_NAME}"
CLUSTERCLAIM_LIFETIME="${CLUSTERCLAIM_LIFETIME:-164h}"

HUB_KUBECONFIG="${WORKDIR}/hub-kubeconfig"
MANAGED_KUBECONFIG="${WORKDIR}/managed-kubeconfig"

mkdir -p "${WORKDIR}"

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
  rm -rf "${WORKDIR:-}"
}

trap cleanup EXIT

########################################
# Display Variables
########################################

log "Starting RHACM managed cluster import workflow"
log "HUB_CLUSTER_NAME=${HUB_CLUSTER_NAME}"
log "MANAGED_CLUSTER_NAME=${MANAGED_CLUSTER_NAME}"
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
# Helper Functions
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
  local SECRET_NAME
  SECRET_NAME=$(oc get secrets -n "${NAMESPACE}" \
    --no-headers \
    -o custom-columns="NAME:.metadata.name" | \
    grep '\-admin-kubeconfig$' | \
    head -n 1 || true)
  if [[ -z "${SECRET_NAME}" ]]; then
    fail "No admin kubeconfig secret found in namespace ${NAMESPACE}"
  fi
  echo "${SECRET_NAME}"
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
  log "Patching managed cluster pull-secret with hub cluster dockerconfigjson"

  local HUB_DOCKERCONFIGJSON

  HUB_DOCKERCONFIGJSON=$(
    oc --kubeconfig="${HUB_KUBECONFIG}" \
      get secret pull-secret \
      -n openshift-config \
      -o jsonpath='{.data.\.dockerconfigjson}'
  )

  oc --kubeconfig="${MANAGED_KUBECONFIG}" \
    patch secret pull-secret \
    -n openshift-config \
    --type='merge' \
    -p "{\"data\":{\".dockerconfigjson\":\"${HUB_DOCKERCONFIGJSON}\"}}"
}

copy_image_digest_mirror_set() {
  log "Syncing ImageDigestMirrorSet spec"

  local IDMS_NAME="image-mirror-custom"
  # Get the spec from hub cluster
  local SPEC
  SPEC=$(
    oc --kubeconfig="${HUB_KUBECONFIG}" \
      get imagedigestmirrorset "${IDMS_NAME}" \
      -o json | jq -c '.spec'
  )

  if [[ -z "${SPEC}" || "${SPEC}" == "null" ]]; then
    log "Failed to retrieve ImageDigestMirrorSet spec from hub cluster"
    return 1
  fi

  # Check if the resource exists on the managed cluster
  if oc --kubeconfig="${MANAGED_KUBECONFIG}" \
      get imagedigestmirrorset "${IDMS_NAME}" >/dev/null 2>&1; then

    log "Patching existing ImageDigestMirrorSet ${IDMS_NAME}"
    oc --kubeconfig="${MANAGED_KUBECONFIG}" \
      patch imagedigestmirrorset "${IDMS_NAME}" \
      --type merge \
      -p "{\"spec\":${SPEC}}"

  else
    log "Creating ImageDigestMirrorSet ${IDMS_NAME}"

    cat <<EOF | oc --kubeconfig="${MANAGED_KUBECONFIG}" apply -f -
apiVersion: config.openshift.io/v1
kind: ImageDigestMirrorSet
metadata:
  name: ${IDMS_NAME}
spec: ${SPEC}
EOF

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

  if oc --kubeconfig="${MANAGED_KUBECONFIG}" \
    api-resources | grep -q '^klusterlets'; then

    oc --kubeconfig="${MANAGED_KUBECONFIG}" \
      delete klusterlet klusterlet \
      --ignore-not-found=true
  fi

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

  log "ClusterClaim ${CLUSTERCLAIM_NAME} already exists. Exiting."
  exit 0
fi

INIT_POOL_SIZE=$(
  oc get clusterpool.hive \
    -n "${CLUSTERPOOL_TARGET_NAMESPACE}" \
    "${CLUSTERPOOL_NAME}" \
    -o jsonpath='{.spec.size}'
)

if (( INIT_POOL_SIZE < 1 )); then
  log "ClusterPool ${CLUSTERPOOL_NAME} does not meet the minimum of 1. Increasing the size of the pool."

  oc scale clusterpool.hive "${CLUSTERPOOL_NAME}" \
    -n "${CLUSTERPOOL_TARGET_NAMESPACE}" \
    --replicas="1"
fi

# ClusterPools are scaled down daily via separate cleanup automation.

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
    cluster.open-cluster-management.io/clusterset: ${CLUSTERPOOL_TARGET_NAMESPACE}
spec:
  clusterPoolName: ${CLUSTERPOOL_NAME}
  lifetime: ${CLUSTERCLAIM_LIFETIME}
  subjects:
    - kind: ServiceAccount
      name: kevinfcormier
      namespace: ${CLUSTERPOOL_TARGET_NAMESPACE}
    - apiGroup: rbac.authorization.k8s.io
      kind: Group
      name: console
    - apiGroup: rbac.authorization.k8s.io
      kind: Group
      name: system:serviceaccounts:${CLUSTERPOOL_TARGET_NAMESPACE}
EOF

########################################
# Wait For ClusterClaim Fulfillment
########################################

log "Polling for ClusterClaim fulfillment (60min)"

MANAGED_NAMESPACE=""

for i in {1..120}; do
  log "ClusterClaim check ${i}/120"

  MANAGED_NAMESPACE=$(get_cluster_namespace "${CLUSTERCLAIM_NAME}")

  if [[ -n "${MANAGED_NAMESPACE}" ]]; then
    break
  fi

  sleep 30
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

[[ -s "${IMPORT_YAML}" ]] \
  || fail "Import manifest is empty"

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