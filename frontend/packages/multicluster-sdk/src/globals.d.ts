/* Copyright Contributors to the Open Cluster Management project */

import type { K8sResourceCommon as OriginalK8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk'

declare global {
  type K8sResourceCommon = OriginalK8sResourceCommon & {
    cluster?: string
  }
}

export {}
