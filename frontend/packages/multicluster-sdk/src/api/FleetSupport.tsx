/* Copyright Contributors to the Open Cluster Management project */
import { useResolvedExtensions } from '@openshift-console/dynamic-plugin-sdk'
import { isMulticlusterSDK } from '../internal'
import { FC, PropsWithChildren, ReactNode, useContext, useEffect, useMemo, useState } from 'react'
import { FleetSupportContext } from '../internal/context/FleetSupportContext'

export const FleetSupport: FC<PropsWithChildren<{ loading: ReactNode }>> = ({ children, loading }) => {
  const [multiclusterSDKs, extensionsResolved] = useResolvedExtensions(isMulticlusterSDK)
  const [hubClusterName, setHubClusterName] = useState<string>()

  const sdkProvider = useMemo(() => {
    // TODO: Choose best compatible version
    return extensionsResolved && multiclusterSDKs.length ? multiclusterSDKs[0].properties.sdkProvider : undefined
  }, [extensionsResolved, multiclusterSDKs])

  useEffect(() => {
    async function resolveHubClusterName() {
      if (sdkProvider && !hubClusterName) {
        setHubClusterName(await sdkProvider.fetchHubClusterName())
      }
    }
    resolveHubClusterName()
  }, [sdkProvider, hubClusterName])

  const ready = (extensionsResolved && !sdkProvider) || hubClusterName
  const contextValue = useMemo(
    () => (sdkProvider && hubClusterName ? { sdkProvider, hubClusterName } : undefined),
    [ready, sdkProvider, hubClusterName]
  )

  return ready ? <FleetSupportContext.Provider value={contextValue}>{children}</FleetSupportContext.Provider> : loading
}

export const useIsFleetSupported = () => {
  return !!useContext(FleetSupportContext)
}
