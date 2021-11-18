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
import {
    acmRouteState,
    clusterPoolsState,
    managedClusterAddonsState,
    managedClusterSetsState,
} from '../../../../../atoms'
import { ErrorPage } from '../../../../../components/ErrorPage'
import { usePrevious } from '../../../../../components/usePrevious'
import { NavigationPath } from '../../../../../NavigationPath'
import {
    Cluster,
    ClusterPool,
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

export default function ClusterSetDetailsPage({ match }: RouteComponentProps<{ id: string }>) {
    const location = useLocation()
    const history = useHistory()
    const { t } = useTranslation()
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
                // TODO - Handle interpolation
                loadingTitle={t('{{managedClusterSetName}} is being deleted.', {
                    managedClusterSetName: prevClusterSet!.metadata.name,
                })}
                loadingMessage={
                    <Trans
                        i18nKey="It might take a few minutes for the delete process to complete. Select <bold>Back to cluster sets</bold> or wait here."
                        components={{ bold: <strong /> }}
                        values={{ managedClusterSetName: prevClusterSet!.metadata.name }}
                    />
                }
                // TODO - Handle interpolation
                successTitle={t('{{managedClusterSetName}} was successfully deleted.', {
                    managedClusterSetName: prevClusterSet!.metadata.name,
                })}
                successMessage={
                    <Trans
                        // TODO - Handle interpolation
                        i18nKey="{{managedClusterSetName}} was successfully deleted. Select <bold>Back to cluster sets</bold> to go back to your cluster set list."
                        components={{ bold: <strong /> }}
                        values={{ managedClusterSetName: prevClusterSet!.metadata.name }}
                    />
                }
                loadingPrimaryAction={
                    <AcmButton role="link" onClick={() => history.push(NavigationPath.clusterSets)}>
                        {t('Back to cluster sets')}
                    </AcmButton>
                }
                primaryAction={
                    <AcmButton role="link" onClick={() => history.push(NavigationPath.clusterSets)}>
                        {t('Back to cluster sets')}
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
                            {t('Back to cluster sets')}
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
                                    { text: t('Cluster sets'), to: NavigationPath.clusterSets },
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
                                                {t('Overview')}
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
                                                {t('Submariner add-ons')}
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
                                                {t('Managed clusters')}
                                            </Link>
                                        </AcmSecondaryNavItem>
                                        <AcmSecondaryNavItem
                                            isActive={
                                                location.pathname ===
                                                NavigationPath.clusterSetClusterPools.replace(':id', match.params.id)
                                            }
                                        >
                                            <Link
                                                to={NavigationPath.clusterSetClusterPools.replace(':id', match.params.id )}
                                            >
                                                {t('Cluster pools')}
                                                
                                            </Link>
                                        </AcmSecondaryNavItem>
                                        <AcmSecondaryNavItem
                                            isActive={
                                                location.pathname ===
                                                NavigationPath.clusterSetAccess.replace(':id', match.params.id)
                                            }
                                        >
                                            <Link to={NavigationPath.clusterSetAccess.replace(':id', match.params.id)}>
                                                {t('Access management')}
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
