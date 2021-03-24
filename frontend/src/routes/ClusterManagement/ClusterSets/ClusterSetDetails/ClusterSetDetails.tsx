/* Copyright Contributors to the Open Cluster Management project */

import {
    AcmButton,
    AcmPage,
    AcmPageHeader,
    AcmRoute,
    AcmSecondaryNav,
    AcmSecondaryNavItem,
    AcmPageProcess,
} from '@open-cluster-management/ui-components'
import { createContext, Fragment, Suspense, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Redirect, Route, RouteComponentProps, Switch, useHistory, useLocation } from 'react-router-dom'
import { useRecoilState, useRecoilValue, waitForAll } from 'recoil'
import {
    acmRouteState,
    certificateSigningRequestsState,
    clusterDeploymentsState,
    managedClusterAddonsState,
    managedClusterInfosState,
    managedClustersState,
    managedClusterSetsState,
} from '../../../../atoms'
import { ErrorPage } from '../../../../components/ErrorPage'
import { Cluster, mapClusters } from '../../../../lib/get-cluster'
import { ResourceError } from '../../../../lib/resource-request'
import { NavigationPath } from '../../../../NavigationPath'
import { ClusterSetOverviewPageContent } from './ClusterSetOverview/ClusterSetOverview'
import { usePrevious } from '../../../../components/usePrevious'
import { ManagedClusterSet, managedClusterSetLabel } from '../../../../resources/managed-cluster-set'

export const ClusterSetContext = createContext<{
    readonly clusterSet: ManagedClusterSet | undefined
    readonly clusters: Cluster[] | undefined
}>({
    clusterSet: undefined,
    clusters: undefined,
})

export default function ClusterDetailsPage({ match }: RouteComponentProps<{ id: string }>) {
    const location = useLocation()
    const history = useHistory()
    const { t } = useTranslation(['cluster'])
    const [, setRoute] = useRecoilState(acmRouteState)
    useEffect(() => setRoute(AcmRoute.Clusters), [setRoute])

    const [
        managedClusterSets,
        managedClusters,
        clusterDeployments,
        managedClusterInfos,
        certificateSigningRequests,
        managedClusterAddons,
    ] = useRecoilValue(
        waitForAll([
            managedClusterSetsState,
            managedClustersState,
            clusterDeploymentsState,
            managedClusterInfosState,
            certificateSigningRequestsState,
            managedClusterAddonsState,
        ])
    )

    const clusterSet = managedClusterSets.find((mcs) => mcs.metadata.name === match.params.id)
    const clusterSetManagedClusters = managedClusters.filter(
        (mc) => mc.metadata.labels?.[managedClusterSetLabel] === match.params.id
    )
    const clusterNames = clusterSetManagedClusters.map((mc) => mc.metadata.name)
    const clusterSetClusterDeployments = clusterDeployments.filter((cd) => clusterNames.includes(cd.metadata.namespace))
    const clusterSetManagedClusterInfos = managedClusterInfos.filter((mci) =>
        clusterNames.includes(mci.metadata.namespace)
    )
    const clusterSetManagedClusterAddons = managedClusterAddons.filter((mca) =>
        clusterNames.includes(mca.metadata.namespace)
    )

    const clusters = mapClusters(
        clusterSetClusterDeployments,
        clusterSetManagedClusterInfos,
        certificateSigningRequests,
        clusterSetManagedClusters,
        clusterSetManagedClusterAddons
    )
    const prevClusterSet = usePrevious(clusterSet)

    if (prevClusterSet?.metadata?.deletionTimestamp) {
        return (
            <AcmPageProcess
                isLoading={clusterSet !== undefined}
                loadingTitle={t('deleting.managedClusterSet.inprogress', {
                    managedClusterSetName: prevClusterSet!.metadata.name,
                })}
                loadingMessage={t('deleting.managedClusterSet.inprogress.message', {
                    managedClusterSetName: prevClusterSet!.metadata.name,
                })}
                successTitle={t('deleting.managedClusterSet.success', {
                    managedClusterSetName: prevClusterSet!.metadata.name,
                })}
                successMessage={t('deleting.managedClusterSet.success.message', {
                    managedClusterSetName: prevClusterSet!.metadata.name,
                })}
                loadingPrimaryAction={
                    <AcmButton role="link" onClick={() => history.push(NavigationPath.clusterSets)}>
                        {t('button.backToClusters')}
                    </AcmButton>
                }
                primaryAction={
                    <AcmButton role="link" onClick={() => history.push(NavigationPath.clusterSets)}>
                        {t('button.backToClusters')}
                    </AcmButton>
                }
            />
        )
    }

    if (clusterSet === undefined) {
        return (
            <AcmPage>
                <ErrorPage
                    error={new ResourceError('Not found', 404)}
                    actions={
                        <AcmButton role="link" onClick={() => history.push(NavigationPath.clusterSets)}>
                            {t('button.backToClusters')}
                        </AcmButton>
                    }
                />
            </AcmPage>
        )
    }

    return (
        <AcmPage hasDrawer>
            <ClusterSetContext.Provider
                value={{
                    clusterSet,
                    clusters,
                }}
            >
                <AcmPageHeader
                    breadcrumb={[
                        { text: t('clusterSets'), to: NavigationPath.clusterSets },
                        { text: match.params.id, to: '' },
                    ]}
                    title={match.params.id}
                    navigation={
                        <AcmSecondaryNav>
                            <AcmSecondaryNavItem
                                isActive={
                                    location.pathname ===
                                    NavigationPath.clusterSetOverview.replace(':id', match.params.id)
                                }
                            >
                                <Link to={NavigationPath.clusterSetOverview.replace(':id', match.params.id)}>
                                    {t('tab.overview')}
                                </Link>
                            </AcmSecondaryNavItem>
                        </AcmSecondaryNav>
                    }
                />

                <Suspense fallback={<Fragment />}>
                    <Switch>
                        <Route exact path={NavigationPath.clusterSetOverview}>
                            <ClusterSetOverviewPageContent />
                        </Route>
                        <Route exact path={NavigationPath.clusterSetDetails}>
                            <Redirect to={NavigationPath.clusterSetOverview.replace(':id', match.params.id)} />
                        </Route>
                    </Switch>
                </Suspense>
            </ClusterSetContext.Provider>
        </AcmPage>
    )
}
