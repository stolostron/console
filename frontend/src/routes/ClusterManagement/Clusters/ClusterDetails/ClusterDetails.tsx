import {
    AcmPageHeader,
    AcmSecondaryNav,
    AcmSecondaryNavItem,
    AcmSpinnerBackdrop,
    AcmPage,
    AcmButton
} from '@open-cluster-management/ui-components'
import React, { Fragment, Suspense, useEffect, useCallback, useState } from 'react'
import { Link, Redirect, Route, RouteComponentProps, Switch, useLocation, useHistory } from 'react-router-dom'
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
import { ErrorPage } from '../../../../components/ErrorPage'
import { ResourceError, ResourceErrorCode } from '../../../../lib/resource-request'

export const ClusterContext = React.createContext<{
    readonly cluster: Cluster | undefined
}>({
    cluster: undefined
})

export default function ClusterDetailsPage({ match }: RouteComponentProps<{ id: string }>) {
    const { data, startPolling, loading, error } = useQuery(useCallback(() => getSingleCluster(match.params.id, match.params.id), [match.params.id]))
    const [cluster, setCluster] = useState<Cluster | undefined>(undefined)
    const [resourceError, setResourceError] = useState<Error | undefined>(undefined)
    const location = useLocation()
    const history = useHistory()
    const { t } = useTranslation(['cluster'])

    useEffect(startPolling, [startPolling])
    useEffect(() => {
        if (error) {
            return setResourceError(error)
        }

        const results = data ?? []
        if (results.length > 0) {
            if (results[0].status === 'rejected' && results[1].status === 'rejected') {
                const cdRequest = results[0] as PromiseRejectedResult
                const mciRequest = results[1] as PromiseRejectedResult
                if (cdRequest.reason.code === mciRequest.reason.code) {
                    const resourceError: ResourceError = { code: mciRequest.reason.code as ResourceErrorCode, message: cdRequest.reason.message + '.  ' + mciRequest.reason.message as string, name: '' }
                    setResourceError(resourceError)
                } else {
                    const resourceError: ResourceError = { code: mciRequest.reason.code as ResourceErrorCode, message: mciRequest.reason.message as string, name: '' }
                    setResourceError(resourceError)
                }
            }

            const items = results.map((d) => {
                if (d.status === 'fulfilled') {
                    return d.value
                } else {
                    return undefined
                }
            })
    
            const singleCluster = getCluster(items[1] as ManagedClusterInfo, items[0] as ClusterDeployment, items[2] as CertificateSigningRequest[])
            setCluster(singleCluster)
        }
    }, [data, error])

    if (loading) {
        return <AcmSpinnerBackdrop />
    }

    if (resourceError) {
        return <AcmPage><ErrorPage error={resourceError} actions={<AcmButton role="link" onClick={() => history.push(NavigationPath.clusters)}>{t('button.backToClusters')}</AcmButton>} /></AcmPage>
    }

    return (
        <AcmPage>
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
        </AcmPage>
    )
}
