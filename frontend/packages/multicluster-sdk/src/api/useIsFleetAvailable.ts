/* Copyright Contributors to the Open Cluster Management project */
import { useFlag } from '@openshift-console/dynamic-plugin-sdk'
import { UseIsFleetAvailable } from '../types'
import { REQUIRED_PROVIDER_FLAG } from './constants'

/**
 * Hook that determines if the fleet support is available.
 *
 * Checks if the feature flag with the name corresponding to the `REQUIRED_PROVIDER_FLAG` constant is enabled.
 * Red Hat Advanced Cluster Management enables this feature flag in versions that provide all of the dependencies
 * required by this version of the multicluster SDK.
 *
 * @returns `true` if a version of Red Hat Advanced Cluster Management that is compatible with the multicluster SDK is available; `false` otherwise
 */
export const useIsFleetAvailable: UseIsFleetAvailable = () => {
  return !!useFlag(REQUIRED_PROVIDER_FLAG)
}
