/* Copyright Contributors to the Open Cluster Management project */
import { ProviderProps } from 'react'
import { LoadData } from './LoadData'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { RecoilRoot } from 'recoil'
import { PluginData, PluginDataContext } from '../lib/PluginDataContext'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LoadStatusProvider } from './LoadStatusProvider'

const queryClient = new QueryClient()

export const PluginDataContextProvider = (props: ProviderProps<PluginData>) => {
  return (
    <PluginDataContext.Provider value={props.value}>
      <LoadStatusProvider>
        <RecoilRoot>
          <QueryClientProvider client={queryClient}>
            {props.value.startLoading ? <LoadData>{props.children}</LoadData> : props.children}
          </QueryClientProvider>
        </RecoilRoot>
      </LoadStatusProvider>
    </PluginDataContext.Provider>
  )
}
