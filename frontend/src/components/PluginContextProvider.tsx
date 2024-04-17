/* Copyright Contributors to the Open Cluster Management project */
import { isHrefNavItem, useResolvedExtensions, UseK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk'
import { AcmTablePaginationContextProvider, AcmToastGroup, AcmToastProvider } from '../ui-components'
import { ReactNode, useMemo, useEffect, useState } from 'react'
import { PluginContext } from '../lib/PluginContext'
import { useAcmExtension } from '../plugin-extensions/handler'
import { LoadingPage } from './LoadingPage'

import { isSharedContext, SharedContext } from '../lib/SharedContext'
import { PluginData } from '../lib/PluginDataContext'
import { Extension } from '@openshift-console/dynamic-plugin-sdk/lib/types'

const isPluginDataContext = (e: Extension): e is SharedContext<PluginData> =>
  isSharedContext(e) && e.properties.id === 'mce-data-context'

export function PluginContextProvider(props: { children?: ReactNode }) {
  const [ocpApi, setOcpApi] = useState<{ useK8sWatchResource: UseK8sWatchResource }>({
    useK8sWatchResource: () => [[] as any, false, undefined],
  })
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

  useEffect(() => {
    const loadOCPAPI = async () => {
      try {
        const api = await import('@openshift-console/dynamic-plugin-sdk')
        setOcpApi({
          useK8sWatchResource: api.useK8sWatchResource,
        })
      } catch (err) {
        console.error('Failed to load OCP API', err)
      }
    }
    loadOCPAPI()
  }, [])

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
        ocpApi,
      }}
    >
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
