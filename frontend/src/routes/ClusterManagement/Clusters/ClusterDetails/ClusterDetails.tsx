/* Copyright Contributors to the Open Cluster Management project */

import {
    AcmActionGroup,
    AcmButton,
    AcmLaunchLink,
    AcmPage,
    AcmPageHeader,
    AcmRoute,
    AcmSecondaryNav,
    AcmSecondaryNavItem,
} from '@open-cluster-management/ui-components'
import { createContext, Fragment, Suspense, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Redirect, Route, RouteComponentProps, Switch, useHistory, useLocation } from 'react-router-dom'
import { useRecoilState, useRecoilValue, waitForAll } from 'recoil'
import {
    acmRouteState,
    certificateSigningRequestsState,
    clusterDeploymentsState,
    clusterManagementAddonsState,
    managedClusterAddonsState,
    managedClusterInfosState,
    managedClustersState,
    clusterClaimsState,
} from '../../../../atoms'
import { ErrorPage } from '../../../../components/ErrorPage'
import { Addon, mapAddons } from '../../../../lib/get-addons'
import { Cluster, ClusterStatus, getCluster } from '../../../../lib/get-cluster'
import { canUser } from '../../../../lib/rbac-util'
import { ResourceError } from '../../../../lib/resource-request'
import { NavigationPath } from '../../../../NavigationPath'
import { SecretDefinition } from '../../../../resources/secret'
import { ClusterActionDropdown } from '../components/ClusterActionDropdown'
import { ClusterDestroy } from '../components/ClusterDestroy'
import { DownloadConfigurationDropdown } from '../components/DownloadConfigurationDropdown'
import { NodePoolsPageContent } from './ClusterNodes/ClusterNodes'
import { MachinePoolsPageContent } from './ClusterMachinePools/ClusterMachinePools'
import { ClusterOverviewPageContent } from './ClusterOverview/ClusterOverview'
import { ClustersSettingsPageContent } from './ClusterSettings/ClusterSettings'
import { usePrevious } from '../../../../components/usePrevious'

export const ClusterContext = createContext<{
    readonly cluster: Cluster | undefined
    readonly addons: Addon[] | undefined
    readonly importCommand?: string
    readonly importCommandError?: string
    setImportCommand?: (command: string) => void
    setImportCommandError?: (error: string) => void
}>({
    cluster: undefined,
    addons: undefined,
})

export default function ClusterDetailsPage({ match }: RouteComponentProps<{ id: string }>) {
    const location = useLocation()
    const history = useHistory()
    const { t } = useTranslation(['cluster'])
    const [importCommand, setImportCommand] = useState<string | undefined>()
    const [importCommandError, setImportCommandError] = useState<string | undefined>()
    const [, setRoute] = useRecoilState(acmRouteState)
    useEffect(() => setRoute(AcmRoute.Clusters), [setRoute])

    const [
        managedClusters,
        clusterDeployments,
        managedClusterInfos,
        certificateSigningRequests,
        managedClusterAddons,
        clusterManagementAddons,
        clusterClaims,
    ] = useRecoilValue(
        waitForAll([
            managedClustersState,
            clusterDeploymentsState,
            managedClusterInfosState,
            certificateSigningRequestsState,
            managedClusterAddonsState,
            clusterManagementAddonsState,
            clusterClaimsState,
        ])
    )

    const managedCluster = managedClusters.find((mc) => mc.metadata.name === match.params.id)
    const clusterDeployment = clusterDeployments.find(
        (cd) => cd.metadata.name === match.params.id && cd.metadata.namespace === match.params.id
    )
    const managedClusterInfo = managedClusterInfos.find(
        (mci) => mci.metadata.name === match.params.id && mci.metadata.namespace === match.params.id
    )
    const clusterAddons = managedClusterAddons.filter((mca) => mca.metadata.namespace === match.params.id)
    const addons = mapAddons(clusterManagementAddons, clusterAddons)

    const clusterClaim = clusterClaims.find((cc) => cc.spec?.namespace === clusterDeployment?.metadata?.name)

    const clusterExists = !!managedCluster || !!clusterDeployment || !!managedClusterInfo

    const cluster = getCluster(
        managedClusterInfo,
        clusterDeployment,
        certificateSigningRequests,
        managedCluster,
        clusterAddons,
        clusterClaim
    )
    const prevCluster = usePrevious(cluster)

    const [canGetSecret, setCanGetSecret] = useState<boolean>(true)
    useEffect(() => {
        const canGetSecret = canUser('get', SecretDefinition, match.params.id)
        canGetSecret.promise
            .then((result) => setCanGetSecret(result.status?.allowed!))
            .catch((err) => console.error(err))
        return () => canGetSecret.abort()
    }, [match.params.id])

    if (
        (prevCluster?.isHive && prevCluster?.status === ClusterStatus.destroying) ||
        (!prevCluster?.isHive && prevCluster?.status === ClusterStatus.detaching)
    ) {
        return <ClusterDestroy isLoading={clusterExists} cluster={prevCluster!} />
    }

    if (!clusterExists) {
        return (
            <AcmPage>
                <ErrorPage
                    error={new ResourceError('Not found', 404)}
                    actions={
                        <AcmButton role="link" onClick={() => history.push(NavigationPath.clusters)}>
                            {t('button.backToClusters')}
                        </AcmButton>
                    }
                />
            </AcmPage>
        )
    }

    return (
        <AcmPage hasDrawer>
            <ClusterContext.Provider
                value={{
                    cluster,
                    addons,
                    importCommand,
                    setImportCommand,
                    importCommandError,
                    setImportCommandError,
                }}
            >
                <AcmPageHeader
                    breadcrumb={[
                        { text: t('clusters'), to: NavigationPath.clusters },
                        { text: cluster.displayName!, to: '' },
                    ]}
                    title={cluster.displayName!}
                    description={
                        cluster.name !== cluster.displayName && (
                            <span style={{ color: 'var(--pf-global--Color--200)' }}>{cluster.name}</span>
                        )
                    }
                    navigation={
                        <AcmSecondaryNav>
                            <AcmSecondaryNavItem
                                isActive={
                                    location.pathname === NavigationPath.clusterOverview.replace(':id', match.params.id)
                                }
                            >
                                <Link to={NavigationPath.clusterOverview.replace(':id', match.params.id)}>
                                    {t('tab.overview')}
                                </Link>
                            </AcmSecondaryNavItem>
                            <AcmSecondaryNavItem
                                isActive={
                                    location.pathname === NavigationPath.clusterNodes.replace(':id', match.params.id)
                                }
                            >
                                <Link to={NavigationPath.clusterNodes.replace(':id', match.params.id)}>
                                    {t('tab.nodes')}
                                </Link>
                            </AcmSecondaryNavItem>
                            {cluster.isHive && (
                                <AcmSecondaryNavItem
                                    isActive={
                                        location.pathname ===
                                        NavigationPath.clusterMachinePools.replace(':id', match.params.id)
                                    }
                                >
                                    <Link to={NavigationPath.clusterMachinePools.replace(':id', match.params.id)}>
                                        {t('tab.machinepools')}
                                    </Link>
                                </AcmSecondaryNavItem>
                            )}
                            <AcmSecondaryNavItem
                                isActive={
                                    location.pathname === NavigationPath.clusterSettings.replace(':id', match.params.id)
                                }
                            >
                                <Link to={NavigationPath.clusterSettings.replace(':id', match.params.id)}>
                                    {t('tab.settings')}
                                </Link>
                            </AcmSecondaryNavItem>
                        </AcmSecondaryNav>
                    }
                    actions={
                        <AcmActionGroup>
                            <AcmLaunchLink
                                links={addons
                                    ?.filter((addon) => addon.launchLink)
                                    ?.map((addon) => ({
                                        id: addon.launchLink?.displayText!,
                                        text: addon.launchLink?.displayText!,
                                        href: addon.launchLink?.href!,
                                    }))}
                            />
                            <DownloadConfigurationDropdown canGetSecret={canGetSecret} />
                            <ClusterActionDropdown cluster={cluster!} isKebab={false} />
                        </AcmActionGroup>
                    }
                />

                <Suspense fallback={<Fragment />}>
                    <Switch>
                        <Route exact path={NavigationPath.clusterOverview}>
                            <ClusterOverviewPageContent canGetSecret={canGetSecret} />
                        </Route>
                        <Route exact path={NavigationPath.clusterNodes}>
                            <NodePoolsPageContent />
                        </Route>
                        {cluster.isHive && (
                            <Route exact path={NavigationPath.clusterMachinePools}>
                                <MachinePoolsPageContent />
                            </Route>
                        )}
                        <Route exact path={NavigationPath.clusterSettings}>
                            <ClustersSettingsPageContent />
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
