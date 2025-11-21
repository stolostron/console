/* Copyright Contributors to the Open Cluster Management project */
import { ProviderProps } from 'react'
import { LoadData } from './LoadData'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { RecoilRoot } from 'recoil'
import { PluginData, PluginDataContext } from '../lib/PluginDataContext'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { FleetK8sWatchResourceStoreViewer } from '@stolostron/multicluster-sdk/lib/internal/components/FleetK8sWatchResourceStoreViewer'
import { Banner } from '@patternfly/react-core'

const queryClient = new QueryClient()

export const PluginDataContextProvider = (props: ProviderProps<PluginData>) => {
  return (
    <PluginDataContext.Provider value={props.value}>
      <RecoilRoot>
        <QueryClientProvider client={queryClient}>
          <Banner variant="green">
            <FleetK8sWatchResourceStoreViewer />
          </Banner>
          {props.value.startLoading ? <LoadData>{props.children}</LoadData> : props.children}
        </QueryClientProvider>
      </RecoilRoot>
    </PluginDataContext.Provider>
  )
}
