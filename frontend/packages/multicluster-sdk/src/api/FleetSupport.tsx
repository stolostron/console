/* Copyright Contributors to the Open Cluster Management project */
import { useResolvedExtensions } from '@openshift-console/dynamic-plugin-sdk'
import { isMulticlusterSDK, MulticlusterSDKProvider } from '../internal'
import { FC, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react'
import { FleetSupportContext } from '../internal/context/FleetSupportContext'
import { Bullseye, Spinner } from '@patternfly/react-core'

export const useFleetValue = () => {
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

  return contextValue
}

export const FleetSupport: FC<
  PropsWithChildren<{
    value: {
      sdkProvider: MulticlusterSDKProvider
      hubClusterName: string
    }
  }>
> = ({ children, value }) => {
  return (
    <FleetSupportContext.Provider value={value || {}}>
      {value?.sdkProvider ? (
        children
      ) : (
        <Bullseye>
          <Spinner />
        </Bullseye>
      )}
    </FleetSupportContext.Provider>
  )
}

export const useIsFleetSupported = () => {
  return !!useContext(FleetSupportContext)
}
