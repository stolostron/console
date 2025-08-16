/* Copyright Contributors to the Open Cluster Management project */
import { ProviderProps } from 'react'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { RecoilRoot } from 'recoil'
import { PluginData, PluginDataContext } from '../lib/PluginDataContext'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useDataLoader } from '../hooks/resource-management'

const queryClient = new QueryClient()

const DataLoaderWrapper = ({ children }: { children: React.ReactNode }) => {
  useDataLoader({
    eventProcessing: {
      processInterval: 500,
      onEventProcessed: (eventType, count) => {
        // Optional: Add logging or metrics here
        if (process.env.NODE_ENV === 'development') {
          console.debug(`Processed ${count} ${eventType} events`)
        }
      },
    },
    authentication: {
      enabled: process.env.MODE !== 'plugin',
      checkInterval: 30 * 1000, // 30 seconds
    },
  })

  return <>{children}</>
}

export const PluginDataContextProvider = (props: ProviderProps<PluginData>) => {
  return (
    <PluginDataContext.Provider value={props.value}>
      <RecoilRoot>
        <QueryClientProvider client={queryClient}>
          {props.value.startLoading ? <DataLoaderWrapper>{props.children}</DataLoaderWrapper> : props.children}
        </QueryClientProvider>
      </RecoilRoot>
    </PluginDataContext.Provider>
  )
}
