import {
    AcmPageHeader,
    AcmSecondaryNav,
    AcmSecondaryNavItem,
} from '@open-cluster-management/ui-components'
import { Page } from '@patternfly/react-core'
import React, { Fragment, Suspense, useEffect, useCallback, useState } from 'react'
import { Link, Redirect, Route, RouteComponentProps, Switch, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { NavigationPath } from '../../../../NavigationPath'
import { ClusterOverviewPageContent } from './ClusterOverview/ClusterOverview'
import { NodePoolsPageContent } from './ClusterNodes/ClusterNodes'
import { ClustersSettingsPageContent } from './ClusterSettings/ClusterSettings'
import { useQuery } from '../../../../lib/useQuery'
import { getSingleCluster, getCluster, Cluster } from '../../../../lib/get-cluster'
import { ClusterDeployment } from '../../../../resources/cluster-deployment'
import { ManagedClusterInfo } from '../../../../resources/managed-cluster-info'
import { CertificateSigningRequest } from '../../../../resources/certificate-signing-requests'

export const ClusterContext = React.createContext<{
    readonly cluster: Cluster | undefined
}>({
    cluster: undefined
})

export default function ClusterDetailsPage({ match }: RouteComponentProps<{ id: string }>) {
    const location = useLocation()
    const { t } = useTranslation(['cluster'])
    const queryCluster = () => getSingleCluster(match.params.id, match.params.id)
    const { data, startPolling } = useQuery(useCallback(queryCluster, [match.params.id]))
    const [cluster, setCluster] = useState<Cluster | undefined>(undefined)

    useEffect(startPolling, [startPolling])
    useEffect(() => {
        const items = data?.map((d) => {
            if (d.status === 'fulfilled') {
                return d.value
            } else {
                console.error(d.reason)
                return undefined
            }
        })

        let singleCluster: Cluster | undefined
        if (items) {
            singleCluster = getCluster(items[1] as ManagedClusterInfo, items[0] as ClusterDeployment, items[2] as CertificateSigningRequest[])
        }

        setCluster(singleCluster)
    }, [data])

    return (
        <Page>
            <ClusterContext.Provider value={{ cluster }}>
                <AcmPageHeader title={match.params.id} breadcrumb={[{ text: t('clusters'), to: NavigationPath.clusters }, { text: t('cluster.details'), to: '' }]} />
                <AcmSecondaryNav>
                    <AcmSecondaryNavItem
                        isActive={location.pathname === NavigationPath.clusterOverview.replace(':id', match.params.id)}
                    >
                        <Link to={NavigationPath.clusterOverview.replace(':id', match.params.id)}>Overview</Link>
                    </AcmSecondaryNavItem>
                    <AcmSecondaryNavItem
                        isActive={location.pathname === NavigationPath.clusterNodes.replace(':id', match.params.id)}
                    >
                        <Link to={NavigationPath.clusterNodes.replace(':id', match.params.id)}>Nodes</Link>
                    </AcmSecondaryNavItem>
                    <AcmSecondaryNavItem
                        isActive={location.pathname === NavigationPath.clusterSettings.replace(':id', match.params.id)}
                    >
                        <Link to={NavigationPath.clusterSettings.replace(':id', match.params.id)}>Settings</Link>
                    </AcmSecondaryNavItem>
                </AcmSecondaryNav>
                <Suspense fallback={<Fragment />}>
                    <Switch>
                        <Route exact path={NavigationPath.clusterOverview}>
                            <ClusterOverviewPageContent />
                        </Route>
                        <Route exact path={NavigationPath.clusterNodes}>
                            <NodePoolsPageContent name={match.params.id} namespace={match.params.id} />
                        </Route>
                        <Route exact path={NavigationPath.clusterSettings}>
                            <ClustersSettingsPageContent name={match.params.id} namespace={match.params.id} />
                        </Route>
                        <Route exact path={NavigationPath.clusterDetails}>
                            <Redirect to={NavigationPath.clusterOverview.replace(':id', match.params.id)} />
                        </Route>
                    </Switch>
                </Suspense>
            </ClusterContext.Provider>
        </Page>
    )
}
