/* Copyright Contributors to the Open Cluster Management project */
import { SetFeatureFlag } from '@openshift-console/dynamic-plugin-sdk'

import { MultiClusterHubComponent } from '../../resources/multi-cluster-hub-component'
import { getBackendUrl, getRequest } from '../../resources/utils'
import { FEATURE_FLAGS } from './consts'

const useFeatureFlags = (setFeatureFlag: SetFeatureFlag) => {
  const multiClusterHubComponentsRequest = getRequest<MultiClusterHubComponent[] | undefined>(
    getBackendUrl() + '/multiclusterhub/components'
  )

  multiClusterHubComponentsRequest.promise.then((response) =>
    Object.entries(FEATURE_FLAGS).forEach(([featureFlag, componentName]) =>
      setFeatureFlag(featureFlag, response?.find((e) => e.name === componentName)?.enabled || false)
    )
  )
}

export default useFeatureFlags
