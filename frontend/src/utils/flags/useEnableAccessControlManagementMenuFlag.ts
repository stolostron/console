/* Copyright Contributors to the Open Cluster Management project */
import { SetFeatureFlag } from '@openshift-console/dynamic-plugin-sdk'

import { MultiClusterHubComponent } from '../../resources/multi-cluster-hub-component'
import { getBackendUrl, getRequest } from '../../resources/utils'
import { ACCESS_CONTROL_MANAGEMENT_COMPONENT_NAME, ACCESS_CONTROL_MANAGEMENT_FLAG } from './consts'

const useEnableAccessControlManagementMenuFlag = (setFeatureFlag: SetFeatureFlag) => {
  const multiClusterHubComponentsRequest = getRequest<MultiClusterHubComponent[] | undefined>(
    getBackendUrl() + '/multiclusterhub/components'
  )

  multiClusterHubComponentsRequest.promise.then((response) => {
    const accessControlManagementComponent = response?.find((e) => e.name === ACCESS_CONTROL_MANAGEMENT_COMPONENT_NAME)
    setFeatureFlag(ACCESS_CONTROL_MANAGEMENT_FLAG, accessControlManagementComponent?.enabled || false)
  })
}

export { useEnableAccessControlManagementMenuFlag }
