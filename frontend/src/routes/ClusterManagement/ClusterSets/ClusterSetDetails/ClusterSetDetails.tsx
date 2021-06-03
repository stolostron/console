/* Copyright Contributors to the Open Cluster Management project */

import {
    AcmButton,
    AcmPage,
    AcmPageHeader,
    AcmPageProcess,
    AcmRoute,
    AcmSecondaryNav,
    AcmSecondaryNavItem,
} from '@open-cluster-management/ui-components'
import { Page } from '@patternfly/react-core'
import { createContext, Fragment, Suspense, useEffect } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Link, Redirect, Route, RouteComponentProps, Switch, useHistory, useLocation } from 'react-router-dom'
import { useRecoilState, useRecoilValue, waitForAll } from 'recoil'
import { acmRouteState, clusterPoolsState, managedClusterSetsState, managedClusterAddonsState } from '../../../../atoms'
import { ErrorPage } from '../../../../components/ErrorPage'
import { usePrevious } from '../../../../components/usePrevious'
import { Cluster } from '../../../../lib/get-cluster'
import { ResourceError } from '../../../../lib/resource-request'
import { NavigationPath } from '../../../../NavigationPath'
import { ClusterPool } from '../../../../resources/cluster-pool'
import { ManagedClusterSet, managedClusterSetLabel } from '../../../../resources/managed-cluster-set'
import { ManagedClusterAddOn } from '../../../../resources/managed-cluster-add-on'
import { ManagedClusterSetBinding } from '../../../../resources/managed-cluster-set-binding'
import { ClusterSetActionDropdown } from '../components/ClusterSetActionDropdown'
import { useClusters } from '../components/useClusters'
import { ClusterSetAccessManagement } from './ClusterSetAccessManagement/ClusterSetAccessManagement'
import { ClusterSetClusterPoolsPageContent } from './ClusterSetClusterPools/ClusterSetClusterPools'
import { ClusterSetClustersPageContent } from './ClusterSetClusters/ClusterSetClusters'
import { ClusterSetManageResourcesPage } from './ClusterSetManageResources/ClusterSetManageResources'
import { ClusterSetOverviewPageContent } from './ClusterSetOverview/ClusterSetOverview'
import { ClusterSetSubmarinerPageContent } from './ClusterSetSubmariner/ClusterSetSubmariner'
import { InstallSubmarinerFormPage } from './ClusterSetInstallSubmariner/InstallSubmarinerForm'
import { useClusterSetBindings } from '../components/ManagedClusterSetBindingModal'

export const ClusterSetContext = createContext<{
    readonly clusterSet: ManagedClusterSet | undefined
    readonly clusters: Cluster[] | undefined
    readonly clusterPools: ClusterPool[] | undefined
    readonly submarinerAddons: ManagedClusterAddOn[] | undefined
    readonly clusterSetBindings: ManagedClusterSetBinding[] | undefined
}>({
    clusterSet: undefined,
    clusters: undefined,
    clusterPools: undefined,
    submarinerAddons: undefined,
    clusterSetBindings: undefined,
})

export default function ClusterDetailsPage({ match }: RouteComponentProps<{ id: string }>) {
    const location = useLocation()
    const history = useHistory()
    const { t } = useTranslation(['cluster'])
    const [, setRoute] = useRecoilState(acmRouteState)
    useEffect(() => setRoute(AcmRoute.Clusters), [setRoute])

    const [managedClusterSets, managedClusterAddons] = useRecoilValue(
        waitForAll([managedClusterSetsState, managedClusterAddonsState])
    )

    const clusterSet = managedClusterSets.find((mcs) => mcs.metadata.name === match.params.id)
    const prevClusterSet = usePrevious(clusterSet)

    const clusters = useClusters(clusterSet)
    const [clusterPools] = useRecoilState(clusterPoolsState)
    const clusterSetClusterPools = clusterPools.filter(
        (cp) => cp.metadata.labels?.[managedClusterSetLabel] === clusterSet?.metadata.name
    )

    const submarinerAddons = managedClusterAddons.filter(
        (mca) => mca.metadata.name === 'submariner' && clusters?.find((c) => c.namespace === mca.metadata.namespace)
    )

    const clusterSetBindings = useClusterSetBindings(clusterSet)

    if (prevClusterSet?.metadata?.deletionTimestamp) {
        return (
            <AcmPageProcess
                isLoading={clusterSet !== undefined}
                loadingTitle={t('deleting.managedClusterSet.inprogress', {
                    managedClusterSetName: prevClusterSet!.metadata.name,
                })}
                loadingMessage={
                    <Trans
                        i18nKey="cluster:deleting.managedClusterSet.inprogress.message"
                        components={{ bold: <strong /> }}
                        values={{ managedClusterSetName: prevClusterSet!.metadata.name }}
                    />
                }
                successTitle={t('deleting.managedClusterSet.success', {
                    managedClusterSetName: prevClusterSet!.metadata.name,
                })}
                successMessage={
                    <Trans
                        i18nKey="cluster:deleting.managedClusterSet.success.message"
                        components={{ bold: <strong /> }}
                        values={{ managedClusterSetName: prevClusterSet!.metadata.name }}
                    />
                }
                loadingPrimaryAction={
                    <AcmButton role="link" onClick={() => history.push(NavigationPath.clusterSets)}>
                        {t('button.backToClusterSets')}
                    </AcmButton>
                }
                primaryAction={
                    <AcmButton role="link" onClick={() => history.push(NavigationPath.clusterSets)}>
                        {t('button.backToClusterSets')}
                    </AcmButton>
                }
            />
        )
    }

    if (clusterSet === undefined) {
        return (
            <Page>
                <ErrorPage
                    error={new ResourceError('Not found', 404)}
                    actions={
                        <AcmButton role="link" onClick={() => history.push(NavigationPath.clusterSets)}>
                            {t('button.backToClusterSets')}
                        </AcmButton>
                    }
                />
            </Page>
        )
    }

    return (
        <ClusterSetContext.Provider
            value={{
                clusterSet,
                clusters,
                clusterPools: clusterSetClusterPools,
                submarinerAddons,
                clusterSetBindings,
            }}
        >
            <Suspense fallback={<Fragment />}>
                <Switch>
                    <Route exact path={NavigationPath.clusterSetDetails.replace(':id', match.params.id)}>
                        <Redirect to={NavigationPath.clusterSetOverview.replace(':id', match.params.id)} />
                    </Route>
                    <Route exact path={NavigationPath.clusterSetManage.replace(':id', match.params.id)}>
                        <ClusterSetManageResourcesPage />
                    </Route>
                    <Route exact path={NavigationPath.clusterSetSubmarinerInstall.replace(':id', match.params.id)}>
                        <InstallSubmarinerFormPage />
                    </Route>
                    <AcmPage
                        hasDrawer
                        header={
                            <AcmPageHeader
                                breadcrumb={[
                                    { text: t('clusterSets'), to: NavigationPath.clusterSets },
                                    { text: match.params.id, to: '' },
                                ]}
                                title={match.params.id}
                                actions={<ClusterSetActionDropdown managedClusterSet={clusterSet} isKebab={false} />}
                                navigation={
                                    <AcmSecondaryNav>
                                        <AcmSecondaryNavItem
                                            isActive={
                                                location.pathname ===
                                                NavigationPath.clusterSetOverview.replace(':id', match.params.id)
                                            }
                                        >
                                            <Link
                                                to={NavigationPath.clusterSetOverview.replace(':id', match.params.id)}
                                            >
                                                {t('tab.overview')}
                                            </Link>
                                        </AcmSecondaryNavItem>
                                        <AcmSecondaryNavItem
                                            isActive={
                                                location.pathname ===
                                                NavigationPath.clusterSetSubmariner.replace(':id', match.params.id)
                                            }
                                        >
                                            <Link
                                                to={NavigationPath.clusterSetSubmariner.replace(':id', match.params.id)}
                                            >
                                                {t('tab.submariner')}
                                            </Link>
                                        </AcmSecondaryNavItem>
                                        <AcmSecondaryNavItem
                                            isActive={
                                                location.pathname ===
                                                NavigationPath.clusterSetClusters.replace(':id', match.params.id)
                                            }
                                        >
                                            <Link
                                                to={NavigationPath.clusterSetClusters.replace(':id', match.params.id)}
                                            >
                                                {t('tab.clusters')}
                                            </Link>
                                        </AcmSecondaryNavItem>
                                        <AcmSecondaryNavItem
                                            isActive={
                                                location.pathname ===
                                                NavigationPath.clusterSetClusterPools.replace(':id', match.params.id)
                                            }
                                        >
                                            <Link
                                                to={NavigationPath.clusterSetClusterPools.replace(
                                                    ':id',
                                                    match.params.id
                                                )}
                                            >
                                                {t('tab.clusterPools')}
                                            </Link>
                                        </AcmSecondaryNavItem>
                                        <AcmSecondaryNavItem
                                            isActive={
                                                location.pathname ===
                                                NavigationPath.clusterSetAccess.replace(':id', match.params.id)
                                            }
                                        >
                                            <Link to={NavigationPath.clusterSetAccess.replace(':id', match.params.id)}>
                                                {t('tab.access')}
                                            </Link>
                                        </AcmSecondaryNavItem>
                                    </AcmSecondaryNav>
                                }
                            />
                        }
                    >
                        <Route exact path={NavigationPath.clusterSetOverview}>
                            <ClusterSetOverviewPageContent />
                        </Route>
                        <Route exact path={NavigationPath.clusterSetSubmariner}>
                            <ClusterSetSubmarinerPageContent />
                        </Route>
                        <Route exact path={NavigationPath.clusterSetClusters}>
                            <ClusterSetClustersPageContent />
                        </Route>
                        <Route exact path={NavigationPath.clusterSetClusterPools}>
                            <ClusterSetClusterPoolsPageContent />
                        </Route>
                        <Route exact path={NavigationPath.clusterSetAccess}>
                            <ClusterSetAccessManagement />
                        </Route>
                    </AcmPage>
                </Switch>
            </Suspense>
        </ClusterSetContext.Provider>
    )
}
