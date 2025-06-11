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
PR_NUMBER=""
COMMIT_HASH=""
DRY_RUN=false
WAIT_FOR_ROLLOUT=true
DEFAULT_VERSION="2.14.0"  # same default version for both ACM and MCE
ACM_WAIT_TIMEOUT=900  # 15 minutes for ACM
MCE_WAIT_TIMEOUT=300   # 5 minutes for MCE

# wait for deployment function
wait_for_deployment() {
  local namespace=$1
  local label=$2
  local timeout=$3
  local new_image=$4  # Add image parameter
  local interval=10
  local elapsed=0
  
  echo -e "${YELLOW}Waiting for deployment with label $label in namespace $namespace to roll out with image $new_image (timeout: $(($timeout/60)) minutes)...${NC}"

  while [ $elapsed -lt $timeout ]; do
    # checks if 'ANY' pod with the right label has the new image
    if oc get pods -n $namespace -l $label -o jsonpath='{.items[*].spec.containers[*].image}' | grep -q "$new_image"; then
      # if it is found, check if ALL containers in ALL pods with that label are 'ready'
      if [[ ! "$(oc get pods -n $namespace -l $label -o jsonpath='{.items[*].status.containerStatuses[*].ready}')" =~ false ]]; then
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
    --pr)
      PR_NUMBER="$2"
      shift 2
      ;;
    --commit)
      COMMIT_HASH="$2"
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
    --acm-timeout)
      ACM_WAIT_TIMEOUT="$2"
      shift 2
      ;;
    --mce-timeout)
      MCE_WAIT_TIMEOUT="$2"
      shift 2
      ;;
    --help|-h)
      echo -e "${BOLD}Usage:${NC}"
      echo "  $0 [options]"
      echo ""
      echo -e "${BOLD}Description:${NC}"
      echo "  Updates the ACM and MCE console image tags"
      echo ""
      echo -e "${BOLD}Options:${NC}"
      echo "  --acm-tag TAG       New tag for ACM console image (e.g. $DEFAULT_VERSION-PR4556-88f21f18d47c...)"
      echo "  --mce-tag TAG       New tag for MCE console image (e.g. $DEFAULT_VERSION-PR4556-88f21f18d47c...)"
      echo "  --pr NUMBER         PR number to construct tags (if --acm-tag or --mce-tag not provided)"
      echo "  --commit HASH       Commit hash to construct tags (if --acm-tag or --mce-tag not provided)"
      echo "  --acm-namespace|-an Set ACM namespace (default: $ACM_NAMESPACE)"
      echo "  --mce-namespace|-mn Set MCE namespace (default: $MCE_NAMESPACE)"
      echo "  --acm-base IMAGE    Override base image for ACM (default: registry path from current image)"
      echo "                      Example: $DEFAULT_ACM_BASE"
      echo "  --mce-base IMAGE    Override base image for MCE (default: registry path from current image)"
      echo "                      Example: $DEFAULT_MCE_BASE (NOT the same as ACM)"
      echo "  --dry-run           Show what would be changed without making changes"
      echo "  --no-wait           Don't wait for deployments to update"
      echo "  --help|-h           Show this help message"
      echo ""
      echo -e "${BOLD}Examples:${NC}"
      echo "  $0 --acm-tag $DEFAULT_VERSION-PR4556-88f21f18d47c... --mce-tag $DEFAULT_VERSION-PR4556-88f21f18d47c..."
      echo "  $0 --pr 4556 --commit 88f21f18d47c..."
      echo "  $0 --pr 4556 --commit 88f21f18d47c... --acm-base $DEFAULT_ACM_BASE --mce-base $DEFAULT_MCE_BASE"
      exit 0
      ;;
    *)
      echo -e "${RED}Error: Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

# if the PR number and commit hash are provided but no tags, construct the tags
if [[ -n "$PR_NUMBER" && -n "$COMMIT_HASH" ]]; then
  if [[ -z "$ACM_TAG" ]]; then
    # get ACM version first
    ACM_VERSION=$(oc get csv -n $ACM_NAMESPACE | grep advanced-cluster-management | awk '{print $2}' | sed 's/.*v//')
    if [[ -z "$ACM_VERSION" ]]; then
      ACM_VERSION="$DEFAULT_VERSION" # Default if we can't detect
    fi
    ACM_TAG="${ACM_VERSION}-PR${PR_NUMBER}-${COMMIT_HASH}"
    echo -e "Constructed ACM tag: ${YELLOW}$ACM_TAG${NC}"
  fi
  
  if [[ -z "$MCE_TAG" ]]; then
    #tries to get MCE version first
    MCE_VERSION=$(oc get csv -n $MCE_NAMESPACE | grep multicluster-engine | awk '{print $2}' | sed 's/.*v//')
    if [[ -z "$MCE_VERSION" ]]; then
      MCE_VERSION="$DEFAULT_VERSION" # Use same default version as ACM
    fi
    MCE_TAG="${MCE_VERSION}-PR${PR_NUMBER}-${COMMIT_HASH}"
    echo -e "Constructed MCE tag: ${YELLOW}$MCE_TAG${NC}"
  fi
fi

#validates input parameters
if [[ -z "$ACM_TAG" && -z "$MCE_TAG" ]]; then
  echo -e "${RED}Error: At least one tag must be provided${NC}"
  echo "Use --acm-tag, --mce-tag, or --pr + --commit options"
  exit 1
fi

echo -e "${BOLD}Preparing to update console images:${NC}"
[[ -n "$ACM_TAG" ]] && echo -e "ACM Console tag: ${GREEN}$ACM_TAG${NC}"
[[ -n "$ACM_TAG" ]] && echo -e "ACM Namespace: ${GREEN}$ACM_NAMESPACE${NC}"
[[ -n "$MCE_TAG" ]] && echo -e "MCE Console tag: ${GREEN}$MCE_TAG${NC}"
[[ -n "$MCE_TAG" ]] && echo -e "MCE Namespace: ${GREEN}$MCE_NAMESPACE${NC}"

if [[ "$DRY_RUN" == "true" ]]; then
  echo -e "${YELLOW}DRY RUN MODE: No changes will be applied${NC}"
fi

#update ACM Operator if tag provided
if [[ -n "$ACM_TAG" ]]; then
  echo -e "\n${BOLD}Updating Advanced Cluster Management operator...${NC}"

  #finding the ACM CSV
  ACM_CSV=$(oc get csv -n $ACM_NAMESPACE | grep advanced-cluster-management | awk '{print $1}')
  
  if [[ -z "$ACM_CSV" ]]; then
    echo -e "${RED}Error: Advanced Cluster Management CSV not found in namespace $ACM_NAMESPACE${NC}"
  else
    echo -e "Found ACM CSV: ${GREEN}$ACM_CSV${NC}"
    
    #getting current image value
    CURRENT_ACM_ENV=$(oc get csv $ACM_CSV -n $ACM_NAMESPACE -o jsonpath='{.spec.install.spec.deployments[0].spec.template.spec.containers[0].env[?(@.name=="OPERAND_IMAGE_CONSOLE")].value}')
    
    if [[ -z "$CURRENT_ACM_ENV" ]]; then
      echo -e "${RED}Error: Could not find OPERAND_IMAGE_CONSOLE environment variable in ACM operator${NC}"
    else
      #extracts base image without tag
      if [[ -n "$ACM_BASE_OVERRIDE" ]]; then
        ACM_BASE_IMAGE="$ACM_BASE_OVERRIDE"
      elif [[ -n "$CURRENT_ACM_ENV" ]]; then
        ACM_BASE_IMAGE=$(echo "$CURRENT_ACM_ENV" | sed -E 's/(@sha256:|:).*//')
      else
        ACM_BASE_IMAGE="$DEFAULT_ACM_BASE"
      fi
      NEW_ACM_IMAGE="${ACM_BASE_IMAGE}:${ACM_TAG}"
      
      echo -e "Current image: ${YELLOW}$CURRENT_ACM_ENV${NC}"
      echo -e "New image: ${GREEN}$NEW_ACM_IMAGE${NC}"
      
      if [[ "$DRY_RUN" != "true" ]]; then
        echo -e "Patching ACM operator..."
        
        #find the environment variable index
        ACM_ENV_INDEX=$(oc get csv $ACM_CSV -n $ACM_NAMESPACE -o json | jq '.spec.install.spec.deployments[0].spec.template.spec.containers[0].env | map(.name == "OPERAND_IMAGE_CONSOLE") | index(true)')
        
        if [[ -z "$ACM_ENV_INDEX" || "$ACM_ENV_INDEX" == "null" ]]; then
          echo -e "${RED}Error: Could not find index of OPERAND_IMAGE_CONSOLE environment variable${NC}"
        else
          #apply the patch using JSON patch
          oc patch csv $ACM_CSV -n $ACM_NAMESPACE --type=json -p "[{\"op\":\"replace\",\"path\":\"/spec/install/spec/deployments/0/spec/template/spec/containers/0/env/$ACM_ENV_INDEX/value\",\"value\":\"$NEW_ACM_IMAGE\"}]"
          
          if [[ $? -eq 0 ]]; then
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

# updates MCE Operator if tag provided
if [[ -n "$MCE_TAG" ]]; then
  echo -e "\n${BOLD}Updating MultiClusterEngine operator...${NC}"

  #find the MCE CSV
  MCE_CSV=$(oc get csv -n $MCE_NAMESPACE | grep multicluster-engine | awk '{print $1}')
  
  if [[ -z "$MCE_CSV" ]]; then
    echo -e "${RED}Error: MultiClusterEngine CSV not found in namespace $MCE_NAMESPACE${NC}"
  else
    echo -e "Found MCE CSV: ${GREEN}$MCE_CSV${NC}"
    
    # gets current image value
    CURRENT_MCE_ENV=$(oc get csv $MCE_CSV -n $MCE_NAMESPACE -o jsonpath='{.spec.install.spec.deployments[0].spec.template.spec.containers[0].env[?(@.name=="OPERAND_IMAGE_CONSOLE_MCE")].value}')
    
    if [[ -z "$CURRENT_MCE_ENV" ]]; then
      echo -e "${RED}Error: Could not find OPERAND_IMAGE_CONSOLE_MCE environment variable in MCE operator${NC}"
    else
      # extracts base image without tag
      if [[ -n "$MCE_BASE_OVERRIDE" ]]; then
        MCE_BASE_IMAGE="$MCE_BASE_OVERRIDE"
      elif [[ -n "$CURRENT_MCE_ENV" ]]; then
        MCE_BASE_IMAGE=$(echo "$CURRENT_MCE_ENV" | sed -E 's/(@sha256:|:).*//')
      else
        MCE_BASE_IMAGE="$DEFAULT_MCE_BASE"  
      fi
      NEW_MCE_IMAGE="${MCE_BASE_IMAGE}:${MCE_TAG}"
      
      echo -e "Current image: ${YELLOW}$CURRENT_MCE_ENV${NC}"
      echo -e "New image: ${GREEN}$NEW_MCE_IMAGE${NC}"
      
      if [[ "$DRY_RUN" != "true" ]]; then
        echo -e "Patching MCE operator..."
        
        # finds the environment variable index
        MCE_ENV_INDEX=$(oc get csv $MCE_CSV -n $MCE_NAMESPACE -o json | jq '.spec.install.spec.deployments[0].spec.template.spec.containers[0].env | map(.name == "OPERAND_IMAGE_CONSOLE_MCE") | index(true)')
        
        if [[ -z "$MCE_ENV_INDEX" || "$MCE_ENV_INDEX" == "null" ]]; then
          echo -e "${RED}Error: Could not find index of OPERAND_IMAGE_CONSOLE_MCE environment variable${NC}"
        else
          # apply the patch using JSON patch
          oc patch csv $MCE_CSV -n $MCE_NAMESPACE --type=json -p "[{\"op\":\"replace\",\"path\":\"/spec/install/spec/deployments/0/spec/template/spec/containers/0/env/$MCE_ENV_INDEX/value\",\"value\":\"$NEW_MCE_IMAGE\"}]"
          
          if [[ $? -eq 0 ]]; then
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
    [[ -n "$ACM_TAG" ]] && wait_for_deployment "$ACM_NAMESPACE" "component=console" "$ACM_WAIT_TIMEOUT" "$NEW_ACM_IMAGE"
    [[ -n "$MCE_TAG" ]] && wait_for_deployment "$MCE_NAMESPACE" "app=console-mce" "$MCE_WAIT_TIMEOUT" "$NEW_MCE_IMAGE"
  else
    echo -e "You can monitor the deployment status with:"
    [[ -n "$ACM_TAG" ]] && echo -e "  ${YELLOW}oc get pods -n $ACM_NAMESPACE -l component=console${NC}"
    [[ -n "$MCE_TAG" ]] && echo -e "  ${YELLOW}oc get pods -n $MCE_NAMESPACE | grep -E 'console-mce'${NC}"
  fi
fi