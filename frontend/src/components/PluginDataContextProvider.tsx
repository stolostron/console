/* Copyright Contributors to the Open Cluster Management project */
import { ProviderProps } from 'react'
import { LoadData } from './LoadData'
import { EventStreamIdleDebugPanel } from './EventStreamIdleDebugPanel'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { RecoilRoot } from 'recoil'
import { PluginData, PluginDataContext } from '../lib/PluginDataContext'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

export const PluginDataContextProvider = (props: ProviderProps<PluginData>) => {
  return (
    <PluginDataContext.Provider value={props.value}>
      <RecoilRoot>
        <QueryClientProvider client={queryClient}>
          {props.value.startLoading ? <LoadData>{props.children}</LoadData> : props.children}
          {process.env.DEBUG_EVENT_STREAM_IDLE === 'true' && <EventStreamIdleDebugPanel />}
        </QueryClientProvider>
      </RecoilRoot>
    </PluginDataContext.Provider>
  )
}
