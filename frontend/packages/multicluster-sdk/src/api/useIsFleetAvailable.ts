import { useFlag } from '@openshift-console/dynamic-plugin-sdk'
import { UseIsFleetAvailable } from '../types'
import { REQUIRED_PROVIDER_FLAG } from './constants'

/* Copyright Contributors to the Open Cluster Management project */
export const useIsFleetAvailable: UseIsFleetAvailable = () => {
  return !!useFlag(REQUIRED_PROVIDER_FLAG)
}
