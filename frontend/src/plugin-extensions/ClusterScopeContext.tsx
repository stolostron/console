/* Copyright Contributors to the Open Cluster Management project */

import { createContext, PropsWithChildren, useMemo } from 'react'

export type ClusterScope = {
  cluster?: string
  localHubOverride?: boolean
}

export const ClusterScopeContext = createContext<ClusterScope>({ cluster: 'local-cluster' })

export const ClusterScope = ({ children, cluster, localHubOverride }: PropsWithChildren<ClusterScope>) => {
  const value = useMemo(() => ({ cluster, localHubOverride }), [cluster, localHubOverride])
  return <ClusterScopeContext.Provider value={value}>{children}</ClusterScopeContext.Provider>
}
