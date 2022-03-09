/* Copyright Contributors to the Open Cluster Management project */
import { useMemo, ReactNode } from 'react'
import { PluginContext } from '../lib/PluginContext'
import { useResolvedExtensions, isHrefNavItem } from '@openshift-console/dynamic-plugin-sdk'

export function PluginContextProvider(props: { children?: ReactNode }) {
    const [hrefs] = useResolvedExtensions(isHrefNavItem)
    const hrefAvailable = (id: string) =>
        hrefs.findIndex((e) => {
            return e.properties.perspective === 'acm' && e.properties.id === id
        }) >= 0

    const isOverviewAvailable = useMemo(() => hrefAvailable('acm-overview'), [hrefs])
    const isApplicationsAvailable = useMemo(() => hrefAvailable('acm-applications'), [hrefs])
    const isGovernanceAvailable = useMemo(() => hrefAvailable('acm-governance'), [hrefs])
    const isSearchAvailable = useMemo(() => hrefAvailable('acm-search'), [hrefs])
    const isACMAvailable = isOverviewAvailable
    const isSubmarinerAvailable = isOverviewAvailable

    return (
        <PluginContext.Provider
            value={{
                isACMAvailable,
                isOverviewAvailable,
                isApplicationsAvailable,
                isGovernanceAvailable,
                isSearchAvailable,
                isSubmarinerAvailable,
            }}
        >
            {props.children}
        </PluginContext.Provider>
    )
}
