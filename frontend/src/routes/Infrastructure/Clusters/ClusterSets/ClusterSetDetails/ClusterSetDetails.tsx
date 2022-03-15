/* Copyright Contributors to the Open Cluster Management project */

import {
    AcmButton,
    AcmPage,
    AcmPageHeader,
    AcmPageProcess,
    AcmRoute,
    AcmSecondaryNav,
    AcmSecondaryNavItem,
} from '@stolostron/ui-components'
import { Page } from '@patternfly/react-core'
import { createContext, Fragment, Suspense, useContext, useEffect } from 'react'
import { Trans, useTranslation } from '../../../../../lib/acm-i18next'
import { Link, Redirect, Route, RouteComponentProps, Switch, useHistory, useLocation } from 'react-router-dom'
import { useRecoilState, useRecoilValue, waitForAll } from 'recoil'
import {
    acmRouteState,
    clusterPoolsState,
    clusterDeploymentsState,
    managedClusterAddonsState,
    managedClusterSetsState,
} from '../../../../../atoms'
import { ErrorPage } from '../../../../../components/ErrorPage'
import { usePrevious } from '../../../../../components/usePrevious'
import { NavigationPath } from '../../../../../NavigationPath'
import {
    Cluster,
    ClusterPool,
    ClusterDeployment,
    ManagedClusterAddOn,
    ManagedClusterSet,
    ManagedClusterSetBinding,
    managedClusterSetLabel,
    ResourceError,
} from '../../../../../resources'
import { ClusterSetActionDropdown } from '../components/ClusterSetActionDropdown'
import { useClusterSetBindings } from '../components/ManagedClusterSetBindingModal'
import { useClusters } from '../components/useClusters'
import { ClusterSetAccessManagement } from './ClusterSetAccessManagement/ClusterSetAccessManagement'
import { ClusterSetClusterPoolsPageContent } from './ClusterSetClusterPools/ClusterSetClusterPools'
import { ClusterSetClustersPageContent } from './ClusterSetClusters/ClusterSetClusters'
import { InstallSubmarinerFormPage } from './ClusterSetInstallSubmariner/InstallSubmarinerForm'
import { ClusterSetManageResourcesPage } from './ClusterSetManageResources/ClusterSetManageResources'
import { ClusterSetOverviewPageContent } from './ClusterSetOverview/ClusterSetOverview'
import { ClusterSetSubmarinerPageContent } from './ClusterSetSubmariner/ClusterSetSubmariner'
import { PluginContext } from '../../../../../lib/PluginContext'

export const ClusterSetContext = createContext<{
    readonly clusterSet: ManagedClusterSet | undefined
    readonly clusters: Cluster[] | undefined
    readonly clusterPools: ClusterPool[] | undefined
    readonly submarinerAddons: ManagedClusterAddOn[] | undefined
    readonly clusterSetBindings: ManagedClusterSetBinding[] | undefined
    readonly clusterDeployments: ClusterDeployment[] | undefined
}>({
    clusterSet: undefined,
    clusters: undefined,
    clusterPools: undefined,
    submarinerAddons: undefined,
    clusterSetBindings: undefined,
    clusterDeployments: undefined,
})

export default function ClusterSetDetailsPage({ match }: RouteComponentProps<{ id: string }>) {
    const location = useLocation()
    const history = useHistory()
    const { t } = useTranslation()
    const { isSubmarinerAvailable } = useContext(PluginContext)
    const [, setRoute] = useRecoilState(acmRouteState)
    useEffect(() => setRoute(AcmRoute.Clusters), [setRoute])

    const [managedClusterSets, managedClusterAddons] = useRecoilValue(
        waitForAll([managedClusterSetsState, managedClusterAddonsState])
    )

    const [clusterDeployments] = useRecoilState(clusterDeploymentsState)

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
                        i18nKey="deleting.managedClusterSet.inprogress.message"
                        components={{ bold: <strong /> }}
                        values={{ managedClusterSetName: prevClusterSet!.metadata.name }}
                    />
                }
                successTitle={t('deleting.managedClusterSet.success', {
                    managedClusterSetName: prevClusterSet!.metadata.name,
                })}
                successMessage={
                    <Trans
                        i18nKey="deleting.managedClusterSet.success.message"
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
                clusterDeployments,
            }}
        >
            <Suspense fallback={<Fragment />}>
                <Switch>
                    <Route exact path={NavigationPath.clusterSetManage}>
                        <ClusterSetManageResourcesPage />
                    </Route>
                    {isSubmarinerAvailable && (
                        <Route exact path={NavigationPath.clusterSetSubmarinerInstall}>
                            <InstallSubmarinerFormPage />
                        </Route>
                    )}
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
                                        {isSubmarinerAvailable && (
                                            <AcmSecondaryNavItem
                                                isActive={
                                                    location.pathname ===
                                                    NavigationPath.clusterSetSubmariner.replace(':id', match.params.id)
                                                }
                                            >
                                                <Link
                                                    to={NavigationPath.clusterSetSubmariner.replace(
                                                        ':id',
                                                        match.params.id
                                                    )}
                                                >
                                                    {t('tab.submariner')}
                                                </Link>
                                            </AcmSecondaryNavItem>
                                        )}
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
                        <Switch>
                            <Route exact path={NavigationPath.clusterSetOverview}>
                                <ClusterSetOverviewPageContent />
                            </Route>
                            {isSubmarinerAvailable && (
                                <Route exact path={NavigationPath.clusterSetSubmariner}>
                                    <ClusterSetSubmarinerPageContent />
                                </Route>
                            )}
                            <Route exact path={NavigationPath.clusterSetClusters}>
                                <ClusterSetClustersPageContent />
                            </Route>
                            <Route exact path={NavigationPath.clusterSetClusterPools}>
                                <ClusterSetClusterPoolsPageContent />
                            </Route>
                            <Route exact path={NavigationPath.clusterSetAccess}>
                                <ClusterSetAccessManagement />
                            </Route>
                            <Route path="*">
                                <Redirect to={NavigationPath.clusterSetOverview.replace(':id', match.params.id)} />
                            </Route>
                        </Switch>
                    </AcmPage>
                </Switch>
            </Suspense>
        </ClusterSetContext.Provider>
    )
}
