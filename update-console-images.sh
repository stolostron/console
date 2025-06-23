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
    echo -e "${RED}Error: 'oc' command not found. Please install the OpenShift CLI.${NC}"
    exit 1
  fi
  
  if ! command -v jq &> /dev/null; then
    echo -e "${RED}Error: 'jq' command not found. Please install jq.${NC}"
    echo -e "Installation instructions:"
    echo -e "  - macOS: brew install jq"
    echo -e "  - Linux (Debian/Ubuntu): sudo apt-get install jq"
    echo -e "  - Linux (RHEL/Fedora): sudo dnf install jq"
    exit 1
  fi

  # check if the user is logged in
  if ! oc whoami &> /dev/null; then
    echo -e "${RED}Error: Not logged into OpenShift. Please login first.${NC}"
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
    echo -e "${YELLOW}Operation cancelled by user${NC}"
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
  echo -e "\n${BOLD}Updating Advanced Cluster Management operator...${NC}"

  #finding the ACM CSV
  ACM_CSV=$(oc get csv -n "$ACM_NAMESPACE" | grep advanced-cluster-management | awk '{print $1}')
  
  if [[ -z "$ACM_CSV" ]]; then
    echo -e "${RED}Error: Advanced Cluster Management CSV not found in namespace $ACM_NAMESPACE${NC}"
  else
    echo -e "Found ACM CSV: ${GREEN}$ACM_CSV${NC}"
    
    #getting current image value
    CURRENT_ACM_ENV=$(oc get csv "$ACM_CSV" -n "$ACM_NAMESPACE" -o jsonpath='{.spec.install.spec.deployments[0].spec.template.spec.containers[0].env[?(@.name=="OPERAND_IMAGE_CONSOLE")].value}')
    
    if [[ -z "$CURRENT_ACM_ENV" ]]; then
      echo -e "${RED}Error: Could not find OPERAND_IMAGE_CONSOLE environment variable in ACM operator${NC}"
    else
      #extracts base image without tag
      if [[ -n "$ACM_BASE_OVERRIDE" ]]; then
        ACM_BASE_IMAGE="$ACM_BASE_OVERRIDE"
        echo -e "Using specified ACM base image: ${GREEN}$ACM_BASE_IMAGE${NC}"
      elif [[ -n "$CURRENT_ACM_ENV" ]]; then
        ACM_BASE_IMAGE=$(echo "$CURRENT_ACM_ENV" | sed -E 's/(@sha256:|:).*//')
        echo -e "Using detected ACM base image: ${YELLOW}$ACM_BASE_IMAGE${NC}"
      else
        ACM_BASE_IMAGE="$DEFAULT_ACM_BASE"
        echo -e "Using default ACM base image: ${YELLOW}$ACM_BASE_IMAGE${NC}"
      fi
      # check to detect if the tag is already a full image reference
      if [[ "$ACM_TAG" == @sha256:* ]]; then
        NEW_ACM_IMAGE="${ACM_BASE_IMAGE}${ACM_TAG}"
      elif [[ "$ACM_TAG" == *":"* && "$ACM_TAG" == *"/"* ]]; then
      # this is already a full image reference (contains both : and /)
        NEW_ACM_IMAGE="$ACM_TAG"
      else
        NEW_ACM_IMAGE="${ACM_BASE_IMAGE}:${ACM_TAG}"
      fi
      
      echo -e "Current image: ${YELLOW}$CURRENT_ACM_ENV${NC}"
      echo -e "New image: ${GREEN}$NEW_ACM_IMAGE${NC}"
      
      if [[ "$DRY_RUN" != "true" ]]; then
        echo -e "Patching ACM operator..."
        
        #find the environment variable index
        ACM_ENV_INDEX=$(oc get csv "$ACM_CSV" -n "$ACM_NAMESPACE" -o json | jq '.spec.install.spec.deployments[0].spec.template.spec.containers[0].env | map(.name == "OPERAND_IMAGE_CONSOLE") | index(true)')
        
        if [[ -z "$ACM_ENV_INDEX" || "$ACM_ENV_INDEX" == "null" ]]; then
          echo -e "${RED}Error: Could not find index of OPERAND_IMAGE_CONSOLE environment variable${NC}"
        else
          #apply the patch using JSON patch
          if oc patch csv "$ACM_CSV" -n "$ACM_NAMESPACE" --type=json -p "[{\"op\":\"replace\",\"path\":\"/spec/install/spec/deployments/0/spec/template/spec/containers/0/env/$ACM_ENV_INDEX/value\",\"value\":\"$NEW_ACM_IMAGE\"}]"; then
            echo -e "${GREEN}✅ SUCCESS: ACM image updated successfully${NC}"
          else
            echo -e "${RED}❌ FAILED: Could not update ACM image${NC}"
          fi
        fi
      else
        echo -e "${YELLOW}Dry run: ACM image would be updated${NC}"
      fi
    fi
  fi
fi

# updates the MCE Operator if tag provided
if [[ -n "$MCE_TAG" ]]; then
  echo -e "\n${BOLD}Updating MultiClusterEngine operator...${NC}"

  #find the MCE CSV
  MCE_CSV=$(oc get csv -n "$MCE_NAMESPACE" | grep multicluster-engine | awk '{print $1}')
  
  if [[ -z "$MCE_CSV" ]]; then
    echo -e "${RED}Error: MultiClusterEngine CSV not found in namespace $MCE_NAMESPACE${NC}"
  else
    echo -e "Found MCE CSV: ${GREEN}$MCE_CSV${NC}"
    
    # gets current image value
    CURRENT_MCE_ENV=$(oc get csv "$MCE_CSV" -n "$MCE_NAMESPACE" -o jsonpath='{.spec.install.spec.deployments[0].spec.template.spec.containers[0].env[?(@.name=="OPERAND_IMAGE_CONSOLE_MCE")].value}')
    
    if [[ -z "$CURRENT_MCE_ENV" ]]; then
      echo -e "${RED}Error: Could not find OPERAND_IMAGE_CONSOLE_MCE environment variable in MCE operator${NC}"
    else
      # extracts base image without tag
      if [[ -n "$MCE_BASE_OVERRIDE" ]]; then
        MCE_BASE_IMAGE="$MCE_BASE_OVERRIDE"
        echo -e "Using specified MCE base image: ${GREEN}$MCE_BASE_IMAGE${NC}"
      elif [[ -n "$CURRENT_MCE_ENV" ]]; then
        MCE_BASE_IMAGE=$(echo "$CURRENT_MCE_ENV" | sed -E 's/(@sha256:|:).*//')
        echo -e "Using detected MCE base image: ${YELLOW}$MCE_BASE_IMAGE${NC}"
      else
        MCE_BASE_IMAGE="$DEFAULT_MCE_BASE"
        echo -e "Using default MCE base image: ${YELLOW}$MCE_BASE_IMAGE${NC}"
      fi
      # check to detect if the tag is already a full image reference
      if [[ "$MCE_TAG" == @sha256:* ]]; then
        NEW_MCE_IMAGE="${MCE_BASE_IMAGE}${MCE_TAG}"
      elif [[ "$MCE_TAG" == *":"* && "$MCE_TAG" == *"/"* ]]; then
      # this is already a full image reference (contains both : and /)
        NEW_MCE_IMAGE="$MCE_TAG"
      else
        NEW_MCE_IMAGE="${MCE_BASE_IMAGE}:${MCE_TAG}"
      fi
      
      echo -e "Current image: ${YELLOW}$CURRENT_MCE_ENV${NC}"
      echo -e "New image: ${GREEN}$NEW_MCE_IMAGE${NC}"
      
      if [[ "$DRY_RUN" != "true" ]]; then
        echo -e "Patching MCE operator..."
        
        # finds the environment variable index
        MCE_ENV_INDEX=$(oc get csv "$MCE_CSV" -n "$MCE_NAMESPACE" -o json | jq '.spec.install.spec.deployments[0].spec.template.spec.containers[0].env | map(.name == "OPERAND_IMAGE_CONSOLE_MCE") | index(true)')
        
        if [[ -z "$MCE_ENV_INDEX" || "$MCE_ENV_INDEX" == "null" ]]; then
          echo -e "${RED}Error: Could not find index of OPERAND_IMAGE_CONSOLE_MCE environment variable${NC}"
        else
          # apply the patch using JSON patch
         if oc patch csv "$MCE_CSV" -n "$MCE_NAMESPACE" --type=json -p "[{\"op\":\"replace\",\"path\":\"/spec/install/spec/deployments/0/spec/template/spec/containers/0/env/$MCE_ENV_INDEX/value\",\"value\":\"$NEW_MCE_IMAGE\"}]"; then
            echo -e "${GREEN}✅ SUCCESS: MCE image updated successfully${NC}"
          else
            echo -e "${RED}❌ FAILED: Could not update MCE image${NC}"
          fi
        fi
      else
        echo -e "${YELLOW}Dry run: MCE image would be updated${NC}"
      fi
    fi
  fi
fi

echo -e "\n${BOLD}Process completed.${NC}"

if [[ "$DRY_RUN" != "true" ]]; then
  if [[ "$WAIT_FOR_ROLLOUT" == "true" ]]; then
    echo -e "${BOLD}Waiting for deployments to roll out...${NC}"
    [[ -n "$ACM_TAG" ]] && wait_for_deployment "$ACM_NAMESPACE" "component=console" "$WAIT_TIMEOUT" "$NEW_ACM_IMAGE"
    [[ -n "$MCE_TAG" ]] && wait_for_deployment "$MCE_NAMESPACE" "app=console-mce" "$WAIT_TIMEOUT" "$NEW_MCE_IMAGE"
  else
    echo -e "You can monitor the deployment status with:"
    [[ -n "$ACM_TAG" ]] && echo -e "  ${YELLOW}oc get pods -n $ACM_NAMESPACE -l component=console${NC}"
    [[ -n "$MCE_TAG" ]] && echo -e "  ${YELLOW}oc get pods -n $MCE_NAMESPACE | grep -E 'console-mce'${NC}"
  fi
fi