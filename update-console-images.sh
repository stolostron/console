#!/bin/bash
# Copyright Contributors to the Open Cluster Management project
# script to update ACM & MCE console image tags

# text formatting
BOLD='\033[1m' # bold text
GREEN='\033[0;32m' # success messages
RED='\033[0;31m' # error messages
YELLOW='\033[0;33m' # warnings and info
NC='\033[0m' # no color

# default values
ACM_TAG=""
MCE_TAG=""
ACM_BASE_OVERRIDE=""
MCE_BASE_OVERRIDE=""
DEFAULT_ACM_BASE="quay.io/stolostron/console"
DEFAULT_MCE_BASE="quay.io/stolostron/console-mce"
ACM_NAMESPACE="open-cluster-management"
MCE_NAMESPACE="multicluster-engine"
DRY_RUN=false
WAIT_FOR_ROLLOUT=true
WAIT_TIMEOUT=900  # 15 minutes for deployment rollouts
SKIP_CONFIRMATION=false

# check if oc is available and logged in
check_dependencies() {
  if ! command -v oc &> /dev/null; then
    exit 1
  fi
  
  if ! command -v jq &> /dev/null; then
    exit 1
  fi

  # check if the user is logged in
  if ! oc whoami &> /dev/null; then
    exit 1
  fi
}

# function to show current cluster and ask for confirmation
confirm_cluster() {
  if [[ "$SKIP_CONFIRMATION" == "true" ]]; then
    return 0
  fi

  # cluster information to display to the user
  local current_context
  current_context=$(oc config current-context)
  
  # extract the last part if it contains slashes
  if [[ "$current_context" == *"/"* ]]; then
    current_context=$(echo "$current_context" | awk -F'/' '{print $NF}')
  fi
  
  local current_server
  current_server=$(oc config view --minify -o jsonpath='{.clusters[0].cluster.server}')
  local current_user
  current_user=$(oc whoami)
  
  # shows all information in a single section
  echo -e "\n${BOLD}You are about to update console images on:${NC}"
  echo -e "  Context: ${YELLOW}$current_context${NC}"
  echo -e "  Server: ${YELLOW}$current_server${NC}" 
  echo -e "  User: ${YELLOW}$current_user${NC}"
  
  read -p "Do you want to continue? (y/n): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 0
  fi
}

# wait for the deployment function
wait_for_deployment() {
  local namespace="$1"
  local label="$2"
  local timeout="$3"
  local new_image="$4"
  local interval=10
  local elapsed=0
  
  echo -e "${YELLOW}Waiting for deployment with label $label in namespace $namespace to roll out with image $new_image (timeout: $((timeout/60)) minutes)...${NC}"

  while [ $elapsed -lt "$timeout" ]; do
    # checks if 'ANY' pod with the right label has the new image
    if oc get pods -n "$namespace" -l "$label" -o jsonpath='{.items[*].spec.containers[*].image}' | grep -q "$new_image"; then
      # if it is found, check if ALL containers in ALL pods with that label are 'ready'
      if [[ ! "$(oc get pods -n "$namespace" -l "$label" -o jsonpath='{.items[*].status.containerStatuses[*].ready}')" =~ false ]]; then
        echo -e "${GREEN}✅ Deployment is ready with new image!${NC}"
        return 0
      fi
    fi
    
    echo -e "Waiting for deployment to be ready with new image... (${elapsed}s/${timeout}s)"
    sleep $interval
    elapsed=$((elapsed + interval))
  done
  
  echo -e "${RED}❌ Timed out waiting for deployment!${NC}"
  return 1
}

# function to update an operator's image
update_console_image() {
  local component="$1"      # ACM or MCE
  local namespace="$2"      # Namespace (open-cluster-management or multicluster-engine)
  local csv_pattern="$3"    # Pattern to grep (advanced-cluster-management or multicluster-engine)
  local env_var_name="$4"   # OPERAND_IMAGE_CONSOLE or OPERAND_IMAGE_CONSOLE_MCE
  local tag="$5"           # Tag to use
  local base_override="$6" # Base image override
  local default_base="$7"  # Default base image
  local pod_label="$8"     # Label for pod selection in wait_for_deployment
  
  echo -e "\n${BOLD}Updating ${component} operator...${NC}"
  
  # finding the CSV
  local csv
  csv=$(oc get csv -n "$namespace" | grep "$csv_pattern" | awk '{print $1}')
  
  if [[ -z "$csv" ]]; then
    echo -e "${RED}Error: ${component} CSV not found in namespace $namespace${NC}"
    return 1
  fi
  
  echo -e "Found ${component} CSV: ${GREEN}$csv${NC}"
  
  # getting current image value
  local current_env
  current_env=$(oc get csv "$csv" -n "$namespace" -o jsonpath="{.spec.install.spec.deployments[0].spec.template.spec.containers[0].env[?(@.name==\"$env_var_name\")].value}")
  
  if [[ -z "$current_env" ]]; then
    echo -e "${RED}Error: Could not find $env_var_name environment variable in ${component} operator${NC}"
    return 1
  fi
  
  # determine the base image to use
  local base_image
  if [[ -n "$base_override" ]]; then
    base_image="$base_override"
    echo -e "Using specified ${component} base image: ${GREEN}$base_image${NC}"
  elif [[ -n "$current_env" ]]; then
    base_image=$(echo "$current_env" | sed -E 's/(@sha256:|:).*//')
    echo -e "Using detected ${component} base image: ${YELLOW}$base_image${NC}"
  else
    base_image="$default_base"
    echo -e "Using default ${component} base image: ${YELLOW}$base_image${NC}"
  fi
  
  # constructs the new image reference
  local new_image
  if [[ "$tag" == @sha256:* ]]; then
    new_image="${base_image}${tag}"
  elif [[ "$tag" == *":"* && "$tag" == *"/"* ]]; then
    # this is already a full image reference (contains both : and /)
    new_image="$tag"
  else
    new_image="${base_image}:${tag}"
  fi
  
  echo -e "Current image: ${YELLOW}$current_env${NC}"
  echo -e "New image: ${GREEN}$new_image${NC}"
  
  if [[ "$DRY_RUN" != "true" ]]; then
    echo -e "Patching ${component} operator..."
    
    # find the environment variable index
    local env_index
    env_index=$(oc get csv "$csv" -n "$namespace" -o json | jq ".spec.install.spec.deployments[0].spec.template.spec.containers[0].env | map(.name == \"$env_var_name\") | index(true)")
    
    if [[ -z "$env_index" || "$env_index" == "null" ]]; then
      echo -e "${RED}Error: Could not find index of $env_var_name environment variable${NC}"
      return 1
    fi
    
    # apply the patch using JSON patch
    if oc patch csv "$csv" -n "$namespace" --type=json -p "[{\"op\":\"replace\",\"path\":\"/spec/install/spec/deployments/0/spec/template/spec/containers/0/env/$env_index/value\",\"value\":\"$new_image\"}]"; then
      echo -e "${GREEN}✅ SUCCESS: ${component} image updated successfully${NC}"
      if [[ "$WAIT_FOR_ROLLOUT" == "true" && "$DRY_RUN" != "true" ]]; then
        wait_for_deployment "$namespace" "$pod_label" "$WAIT_TIMEOUT" "$new_image"
      fi
      return 0
    else
      echo -e "${RED}❌ FAILED: Could not update ${component} image${NC}"
      return 1
    fi
  else
    echo -e "${YELLOW}Dry run: ${component} image would be updated${NC}"
    return 0
  fi
}

# parsing command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --acm-tag)
      ACM_TAG="$2"
      shift 2
      ;;
    --mce-tag)
      MCE_TAG="$2"
      shift 2
      ;;
    --acm-namespace|-an)
      ACM_NAMESPACE="$2"
      shift 2
      ;;
    --mce-namespace|-mn)
      MCE_NAMESPACE="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --acm-base)
      ACM_BASE_OVERRIDE="$2"
      shift 2
      ;;
    --mce-base)
      MCE_BASE_OVERRIDE="$2"
      shift 2
      ;;
    --no-wait)
      WAIT_FOR_ROLLOUT=false
      shift
      ;;
    --timeout)
      WAIT_TIMEOUT="$2"
      shift 2
      ;;
    --yes|-y)
      SKIP_CONFIRMATION=true
      shift
      ;;
    --help|-h)
      echo -e "${BOLD}Usage:${NC}"
      echo "  $0 [options]"
      echo ""
      echo -e "${BOLD}Description:${NC}"
      echo "  Updates the ACM and MCE console image tags"
      echo ""
      echo -e "${BOLD}Options:${NC}"
      echo "  --acm-tag TAG       Tag for ACM console image (e.g. 2.8.0-SNAPSHOT-2023-03-21-23-05-08)"
      echo "  --mce-tag TAG       Tag for MCE console image (e.g. 2.8.0-SNAPSHOT-2023-03-21-23-05-08)"
      echo "  --acm-namespace|-an Set ACM namespace (default: $ACM_NAMESPACE)"
      echo "  --mce-namespace|-mn Set MCE namespace (default: $MCE_NAMESPACE)"
      echo "  --acm-base IMAGE    Override base image for ACM (default: registry path from current image)"
      echo "                      Example: $DEFAULT_ACM_BASE"
      echo "  --mce-base IMAGE    Override base image for MCE (default: registry path from current image)"
      echo "                      Example: $DEFAULT_MCE_BASE (NOT the same as ACM)"
      echo "  --dry-run           Show what would be changed without making changes"
      echo "  --no-wait           Don't wait for deployments to update"
      echo "  --timeout SECONDS   Set timeout in seconds for deployment rollouts (default: $WAIT_TIMEOUT)"
      echo "  --yes|-y            Skip confirmation prompts"
      echo "  --help|-h           Show this help message"
      echo ""
      echo -e "${BOLD}Examples:${NC}"
      echo "  $0 --acm-tag 2.8.0-SNAPSHOT-2023-03-21-23-05-08"
      echo "  $0 --acm-tag 2.8.0-SNAPSHOT-2023-03-21-23-05-08 --mce-tag 2.8.0-SNAPSHOT-2023-03-21-23-05-08"
      echo "  $0 --acm-base $DEFAULT_ACM_BASE --acm-tag 2.8.0-SNAPSHOT-2023-03-21-23-05-08"
      echo "  # Rollback to a previous digest (example):"
      echo "  $0 --acm-base $DEFAULT_ACM_BASE --acm-tag '@sha256:<digest>'"
      exit 0
      ;;
    *)
      echo -e "${RED}Error: Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

# validates input parameters
if [[ -z "$ACM_TAG" && -z "$MCE_TAG" ]]; then
  echo -e "${RED}Error: At least one tag must be provided${NC}"
  echo "Use --acm-tag and/or --mce-tag options"
  exit 1
fi

echo -e "${BOLD}Preparing to update console images:${NC}"
[[ -n "$ACM_TAG" ]] && echo -e "ACM Console tag: ${GREEN}$ACM_TAG${NC}"
[[ -n "$ACM_TAG" ]] && echo -e "ACM Namespace: ${GREEN}$ACM_NAMESPACE${NC}"
[[ -n "$MCE_TAG" ]] && echo -e "MCE Console tag: ${GREEN}$MCE_TAG${NC}"
[[ -n "$MCE_TAG" ]] && echo -e "MCE Namespace: ${GREEN}$MCE_NAMESPACE${NC}"

# reminds users to verify image existence
if [[ -n "$ACM_TAG" ]]; then
  echo -e "${YELLOW}Note: Please verify that the ACM image tag exists on quay.io before proceeding${NC}"
fi
if [[ -n "$MCE_TAG" ]]; then
  echo -e "${YELLOW}Note: Please verify that the MCE image tag exists on quay.io before proceeding${NC}"
fi

if [[ "$DRY_RUN" == "true" ]]; then
  echo -e "${YELLOW}DRY RUN MODE: No changes will be applied${NC}"
else
  # check and confirm the target cluster
  check_dependencies && confirm_cluster
fi

#updates ACM Operator if tag provided
if [[ -n "$ACM_TAG" ]]; then
  update_console_image "ACM" "$ACM_NAMESPACE" "advanced-cluster-management" "OPERAND_IMAGE_CONSOLE" "$ACM_TAG" "$ACM_BASE_OVERRIDE" "$DEFAULT_ACM_BASE" "component=console"
fi

# updates the MCE Operator if tag provided
if [[ -n "$MCE_TAG" ]]; then
  update_console_image "MCE" "$MCE_NAMESPACE" "multicluster-engine" "OPERAND_IMAGE_CONSOLE_MCE" "$MCE_TAG" "$MCE_BASE_OVERRIDE" "$DEFAULT_MCE_BASE" "app=console-mce"
fi

echo -e "\n${BOLD}Process completed.${NC}"

if [[ "$DRY_RUN" != "true" && "$WAIT_FOR_ROLLOUT" != "true" ]]; then
  echo -e "You can monitor the deployment status with:"
  [[ -n "$ACM_TAG" ]] && echo -e "  ${YELLOW}oc get pods -n $ACM_NAMESPACE -l component=console${NC}"
  [[ -n "$MCE_TAG" ]] && echo -e "  ${YELLOW}oc get pods -n $MCE_NAMESPACE | grep -E 'console-mce'${NC}"
fi