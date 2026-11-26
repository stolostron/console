#!/usr/bin/env bash

set -euo pipefail

GATEKEEPER_VERSION="${GATEKEEPER_VERSION:-3.23.1}"
GATEKEEPER_NAMESPACE="${GATEKEEPER_NAMESPACE:-gatekeeper-system}"
GATEKEEPER_MANIFEST_URL="${GATEKEEPER_MANIFEST_URL:-https://raw.githubusercontent.com/open-policy-agent/gatekeeper/v${GATEKEEPER_VERSION}/deploy/gatekeeper.yaml}"
KUBECTL="${KUBECTL:-oc}"
OPENSHIFT_RELAX_POD_SECURITY="${OPENSHIFT_RELAX_POD_SECURITY:-true}"
GATEKEEPER_POLICY_BACKUP="${GATEKEEPER_POLICY_BACKUP:-gatekeeper-policy-backup-$(date +%Y%m%d%H%M%S).yaml}"

usage() {
  cat <<EOF
Usage: $0 [--dry-run|--uninstall]

Environment variables:
  GATEKEEPER_VERSION    Gatekeeper release version (default: ${GATEKEEPER_VERSION})
  GATEKEEPER_NAMESPACE  Installation namespace (default: ${GATEKEEPER_NAMESPACE})
  KUBECTL               Kubernetes CLI (default: ${KUBECTL})
  OPENSHIFT_RELAX_POD_SECURITY
                        Label gatekeeper-system as Pod Security privileged on OpenShift
                        (default: ${OPENSHIFT_RELAX_POD_SECURITY})
  GATEKEEPER_POLICY_BACKUP
                        Policy backup path during uninstall (default: ${GATEKEEPER_POLICY_BACKUP})
EOF
}

dry_run=false
uninstall=false
case "${1:-}" in
  "") ;;
  --dry-run) dry_run=true ;;
  --uninstall) uninstall=true ;;
  --help|-h) usage; exit 0 ;;
  *) usage >&2; exit 2 ;;
esac

command -v "${KUBECTL}" >/dev/null || {
  echo "Required command not found: ${KUBECTL}" >&2
  exit 1
}

if [[ "${GATEKEEPER_NAMESPACE}" != "gatekeeper-system" ]]; then
  echo "Unsupported GATEKEEPER_NAMESPACE: ${GATEKEEPER_NAMESPACE}; the upstream manifest uses gatekeeper-system" >&2
  exit 2
fi

if [[ "${dry_run}" == true ]]; then
  "${KUBECTL}" apply --dry-run=client -f "${GATEKEEPER_MANIFEST_URL}"
  exit 0
fi

if [[ "${uninstall}" == true ]]; then
  echo "Uninstalling Gatekeeper v${GATEKEEPER_VERSION} from ${GATEKEEPER_NAMESPACE}"

  echo "Backing up Gatekeeper policies to ${GATEKEEPER_POLICY_BACKUP}"
  backup_tmp="${GATEKEEPER_POLICY_BACKUP}.tmp.$$"
  trap 'rm -f "${backup_tmp}"' EXIT
  : > "${backup_tmp}"

  constraint_templates_yaml="$(${KUBECTL} get constrainttemplates -o yaml)" || {
    echo "Unable to export Gatekeeper ConstraintTemplates; aborting uninstall." >&2
    exit 1
  }
  printf '%s\n---\n' "${constraint_templates_yaml}" >> "${backup_tmp}"

  constraint_resources="$(${KUBECTL} api-resources --api-group=constraints.gatekeeper.sh --verbs=list -o name)" || {
    echo "Unable to discover Gatekeeper constraint resources; aborting uninstall." >&2
    exit 1
  }
  while IFS= read -r resource; do
    [[ -z "${resource}" ]] && continue
    resource_yaml="$(${KUBECTL} get "${resource}" -A -o yaml)" || {
      echo "Unable to export Gatekeeper resource ${resource}; aborting uninstall." >&2
      exit 1
    }
    printf '%s\n---\n' "${resource_yaml}" >> "${backup_tmp}"
  done <<< "${constraint_resources}"
  mv "${backup_tmp}" "${GATEKEEPER_POLICY_BACKUP}"
  trap - EXIT

  "${KUBECTL}" delete -f "${GATEKEEPER_MANIFEST_URL}" --ignore-not-found

  if [[ "${KUBECTL}" == "oc" || "${KUBECTL}" == */oc ]]; then
    "${KUBECTL}" adm policy remove-scc-from-user anyuid -z gatekeeper-admin \
      --namespace "${GATEKEEPER_NAMESPACE}" >/dev/null 2>&1 || true
    "${KUBECTL}" label namespace "${GATEKEEPER_NAMESPACE}" \
      pod-security.kubernetes.io/enforce- >/dev/null 2>&1 || true
  fi
  echo "Gatekeeper uninstalled."
  exit 0
fi

echo "Installing Gatekeeper v${GATEKEEPER_VERSION} into ${GATEKEEPER_NAMESPACE}"
"${KUBECTL}" apply -f "${GATEKEEPER_MANIFEST_URL}"

# Gatekeeper's upstream manifest specifies UID 1000 and a RuntimeDefault
# seccompProfile. OpenShift requires anyuid for the UID and rejects the
# seccompProfile with this SCC configuration. These adjustments follow
# Gatekeeper's OpenShift guidance.
if [[ "${KUBECTL}" == "oc" || "${KUBECTL}" == */oc ]]; then
  if [[ "${OPENSHIFT_RELAX_POD_SECURITY}" == true ]]; then
    "${KUBECTL}" label namespace "${GATEKEEPER_NAMESPACE}" \
      pod-security.kubernetes.io/enforce=privileged --overwrite >/dev/null
  fi
  "${KUBECTL}" adm policy add-scc-to-user anyuid -z gatekeeper-admin \
    --namespace "${GATEKEEPER_NAMESPACE}" >/dev/null
  for deployment in gatekeeper-controller-manager gatekeeper-audit; do
    "${KUBECTL}" patch deployment "${deployment}" --namespace "${GATEKEEPER_NAMESPACE}" \
      --type=strategic \
      --patch='{"spec":{"template":{"metadata":{"annotations":{"container.seccomp.security.alpha.kubernetes.io/manager":null}},"spec":{"containers":[{"name":"manager","securityContext":{"seccompProfile":null}}]}}}}' \
      >/dev/null
    "${KUBECTL}" rollout restart deployment "${deployment}" \
      --namespace "${GATEKEEPER_NAMESPACE}" >/dev/null
  done
fi

"${KUBECTL}" rollout status deployment/gatekeeper-controller-manager \
  --namespace "${GATEKEEPER_NAMESPACE}" --timeout=5m
"${KUBECTL}" rollout status deployment/gatekeeper-audit \
  --namespace "${GATEKEEPER_NAMESPACE}" --timeout=5m

echo "Gatekeeper v${GATEKEEPER_VERSION} is ready."
"${KUBECTL}" get pods --namespace "${GATEKEEPER_NAMESPACE}"
