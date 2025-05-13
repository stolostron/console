/* Copyright Contributors to the Open Cluster Management project */
import { CodeRef, Extension, ExtensionDeclaration } from '@openshift-console/dynamic-plugin-sdk/lib/types'
import { FleetK8sResourceCommon, FleetResourceLinkProps, FleetWatchK8sResource } from '../../types'
import { WatchK8sResult } from '@openshift-console/dynamic-plugin-sdk'

const MULTICLUSTER_SDK_TYPE = 'acm.multicluster-sdk'

export type MulticlusterSDKProvider = {
  // Utilities
  fetchHubClusterName: () => Promise<string>
  getFleetK8sAPIPath: (cluster?: string) => string

  // Dynamic Plugin SDK equivalents
  FleetResourceLink: React.FC<FleetResourceLinkProps>
  useFleetK8sWatchResource: <R extends FleetK8sResourceCommon | FleetK8sResourceCommon[]>(
    hubClusterName: string,
    initResource: FleetWatchK8sResource | null
  ) => WatchK8sResult<R>

}

export type MulticlusterSDKExtensionProperties = {
  version: string
  sdkProvider: CodeRef<MulticlusterSDKProvider>
}

export type MulticlusterSDKExtension = ExtensionDeclaration<
  typeof MULTICLUSTER_SDK_TYPE,
  MulticlusterSDKExtensionProperties
>

// Type guards
export const isMulticlusterSDK = (e: Extension): e is MulticlusterSDKExtension => {
  return e.type === MULTICLUSTER_SDK_TYPE
}
