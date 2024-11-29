/* Copyright Contributors to the Open Cluster Management project */
import {
  isHrefNavItem,
  Timestamp,
  useK8sWatchResource,
  useResolvedExtensions,
} from '@openshift-console/dynamic-plugin-sdk'
import { AcmTablePaginationContextProvider, AcmToastGroup, AcmToastProvider } from '../ui-components'
import { ReactNode, useMemo } from 'react'
import { PluginContext } from '../lib/PluginContext'
import { useAcmExtension } from '../plugin-extensions/handler'
import { LoadingPage } from './LoadingPage'

import { isSharedContext, SharedContext } from '../lib/SharedContext'
import { PluginData } from '../lib/PluginDataContext'
import { Extension } from '@openshift-console/dynamic-plugin-sdk/lib/types'
import { AcmFeedbackModal } from './AcmFeedbackModal'

const isPluginDataContext = (e: Extension): e is SharedContext<PluginData> =>
  isSharedContext(e) && e.properties.id === 'mce-data-context'

export function PluginContextProvider(props: { children?: ReactNode }) {
  const [hrefs] = useResolvedExtensions(isHrefNavItem)

  const [pluginDataContexts, extensionsReady] = useResolvedExtensions(isPluginDataContext)
  const pluginDataContext = extensionsReady && pluginDataContexts.length && pluginDataContexts[0]

  const [isOverviewAvailable, isApplicationsAvailable, isGovernanceAvailable, isSearchAvailable] = useMemo(() => {
    const hrefAvailable = (id: string) =>
      hrefs?.some((e) => e.properties.perspective === 'acm' && e.properties.id === id)

    return [
      hrefAvailable('acm-overview'),
      hrefAvailable('acm-applications'),
      hrefAvailable('acm-governance'),
      hrefAvailable('acm-search'),
    ]
  }, [hrefs])

  const isACMAvailable = isOverviewAvailable
  const isSubmarinerAvailable = isOverviewAvailable

  // ACM Custom extensions
  const acmExtensions = useAcmExtension()

  return pluginDataContext ? (
    <PluginContext.Provider
      value={{
        isACMAvailable,
        isOverviewAvailable,
        isApplicationsAvailable,
        isGovernanceAvailable,
        isSearchAvailable,
        isSubmarinerAvailable,
        dataContext: pluginDataContext.properties.context,
        acmExtensions,
        ocpApi: { Timestamp, useK8sWatchResource },
      }}
    >
      <AcmFeedbackModal />
      <div style={{ position: 'relative', height: '100%', width: '100%' }}>
        <div style={{ position: 'absolute', height: '100%', width: '100%' }}>
          <AcmToastProvider>
            <AcmToastGroup />
            <AcmTablePaginationContextProvider localStorageKey="clusters">
              {props.children}
            </AcmTablePaginationContextProvider>
          </AcmToastProvider>
        </div>
      </div>
    </PluginContext.Provider>
  ) : (
    <LoadingPage />
  )
}
