/* Copyright Contributors to the Open Cluster Management project */
import { isHrefNavItem, useResolvedExtensions } from '@openshift-console/dynamic-plugin-sdk'
import { AcmTablePaginationContextProvider, AcmToastGroup, AcmToastProvider } from '../ui-components'
import { ReactNode, useCallback, useMemo } from 'react'
import { PluginContext } from '../lib/PluginContext'
import { useAcmExtension } from '../plugin-extensions/handler'

export function PluginContextProvider(props: { children?: ReactNode }) {
    const [hrefs] = useResolvedExtensions(isHrefNavItem)
    const hrefAvailable = useCallback(
        (id: string) =>
            hrefs.findIndex((e) => {
                return e.properties.perspective === 'acm' && e.properties.id === id
            }) >= 0,
        [hrefs]
    )

    const isOverviewAvailable = useMemo(() => hrefAvailable('acm-overview'), [hrefAvailable])
    const isApplicationsAvailable = useMemo(() => hrefAvailable('acm-applications'), [hrefAvailable])
    const isGovernanceAvailable = useMemo(() => hrefAvailable('acm-governance'), [hrefAvailable])
    const isSearchAvailable = useMemo(() => hrefAvailable('acm-search'), [hrefAvailable])
    const isACMAvailable = isOverviewAvailable
    const isSubmarinerAvailable = isOverviewAvailable

    // ACM Custom extensions
    const acmExtensions = useAcmExtension()

    return (
        <PluginContext.Provider
            value={{
                isACMAvailable,
                isOverviewAvailable,
                isApplicationsAvailable,
                isGovernanceAvailable,
                isSearchAvailable,
                isSubmarinerAvailable,
                acmExtensions,
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
    )
}
