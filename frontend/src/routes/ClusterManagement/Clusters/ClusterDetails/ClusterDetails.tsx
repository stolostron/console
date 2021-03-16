/* Copyright Contributors to the Open Cluster Management project */

import {
    AcmActionGroup,
    AcmButton,
    AcmErrorBoundary,
    AcmLaunchLink,
    AcmPage,
    AcmPageHeader,
    AcmScrollable,
    AcmSecondaryNav,
    AcmSecondaryNavItem,
} from '@open-cluster-management/ui-components'
import { createContext, Fragment, Suspense, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRecoilState } from 'recoil'
import { Link, Redirect, Route, RouteComponentProps, Switch, useHistory, useLocation } from 'react-router-dom'
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
import { ClusterOverviewPageContent } from './ClusterOverview/ClusterOverview'
import { ClustersSettingsPageContent } from './ClusterSettings/ClusterSettings'
import {
    managedClustersState,
    managedClusterInfosState,
    clusterDeploymentsState,
    certificateSigningRequestsState,
    clusterManagementAddonsState,
    managedClusterAddonsState,
} from '../../../../atoms'

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

    // Cluster
    const [managedClusters] = useRecoilState(managedClustersState)
    const [clusterDeployments] = useRecoilState(clusterDeploymentsState)
    const [managedClusterInfos] = useRecoilState(managedClusterInfosState)
    const [certificateSigningRequests] = useRecoilState(certificateSigningRequestsState)

    const managedCluster = managedClusters.find((mc) => mc.metadata.name === match.params.id)
    const clusterDeployment = clusterDeployments.find(
        (cd) => cd.metadata.name === match.params.id && cd.metadata.namespace === match.params.id
    )
    const managedClusterInfo = managedClusterInfos.find(
        (mci) => mci.metadata.name === match.params.id && mci.metadata.namespace === match.params.id
    )

    const clusterExists = !!managedCluster || !!clusterDeployment || !!managedClusterInfo

    const [cluster, setCluster] = useState<Cluster | undefined>(
        getCluster(managedClusterInfo, clusterDeployment, certificateSigningRequests, managedCluster)
    )
    useEffect(() => {
        // Need to keep cluster data for detach/destroy
        if (clusterExists) {
            setCluster(getCluster(managedClusterInfo, clusterDeployment, certificateSigningRequests, managedCluster))
        }
    }, [managedCluster, clusterDeployment, managedClusterInfo, certificateSigningRequests, clusterExists])
    // End cluster

    const [canGetSecret, setCanGetSecret] = useState<boolean>(true)

    // Addons
    const [managedClusterAddons] = useRecoilState(managedClusterAddonsState)
    const [clusterManagementAddons] = useRecoilState(clusterManagementAddonsState)
    const addons = mapAddons(clusterManagementAddons, managedClusterAddons)
    // End addons

    useEffect(() => {
        const canGetSecret = canUser('get', SecretDefinition, match.params.id)
        canGetSecret.promise
            .then((result) => setCanGetSecret(result.status?.allowed!))
            .catch((err) => console.error(err))
        return () => canGetSecret.abort()
    }, [match.params.id])

    if (
        (cluster?.isHive && cluster?.status === ClusterStatus.destroying) ||
        (!cluster?.isHive && cluster?.status === ClusterStatus.detaching)
    ) {
        return <ClusterDestroy isLoading={clusterExists} cluster={cluster!} />
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
                        { text: match.params.id, to: '' },
                    ]}
                    title={match.params.id}
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
                        <Fragment>
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
                        </Fragment>
                    }
                />
                <AcmErrorBoundary>
                    <AcmScrollable borderTop>
                        <Suspense fallback={<Fragment />}>
                            <Switch>
                                <Route exact path={NavigationPath.clusterOverview}>
                                    <ClusterOverviewPageContent canGetSecret={canGetSecret} />
                                </Route>
                                <Route exact path={NavigationPath.clusterNodes}>
                                    <NodePoolsPageContent />
                                </Route>
                                <Route exact path={NavigationPath.clusterSettings}>
                                    <ClustersSettingsPageContent />
                                </Route>
                                <Route exact path={NavigationPath.clusterDetails}>
                                    <Redirect to={NavigationPath.clusterOverview.replace(':id', match.params.id)} />
                                </Route>
                            </Switch>
                        </Suspense>
                    </AcmScrollable>
                </AcmErrorBoundary>
            </ClusterContext.Provider>
        </AcmPage>
    )
}
