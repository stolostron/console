/* Copyright Contributors to the Open Cluster Management project */

import { Page } from '@patternfly/react-core'
import {
    AcmActionGroup,
    AcmButton,
    AcmLaunchLink,
    AcmPage,
    AcmPageHeader,
    AcmSecondaryNav,
    AcmSecondaryNavItem,
    Provider,
} from '../../../../../ui-components'
import {
    AgentClusterInstallK8sResource,
    AgentK8sResource,
    HostedClusterK8sResource,
    InfraEnvK8sResource,
} from 'openshift-assisted-ui-lib/cim'
import { createContext, Fragment, Suspense, useEffect, useState } from 'react'
import { Link, Redirect, Route, RouteComponentProps, Switch, useHistory, useLocation } from 'react-router-dom'
import { useRecoilValue, waitForAll } from 'recoil'
import {
    agentClusterInstallsState,
    agentsState,
    certificateSigningRequestsState,
    clusterClaimsState,
    clusterCuratorsState,
    clusterDeploymentsState,
    clusterManagementAddonsState,
    hostedClustersState,
    infraEnvironmentsState,
    managedClusterAddonsState,
    managedClusterInfosState,
    managedClustersState,
    nodePoolsState,
} from '../../../../../atoms'
import { ErrorPage } from '../../../../../components/ErrorPage'
import { usePrevious } from '../../../../../components/usePrevious'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { canUser } from '../../../../../lib/rbac-util'
import { NavigationPath } from '../../../../../NavigationPath'
import {
    Addon,
    Cluster,
    ClusterCurator,
    ClusterDeployment,
    ClusterStatus,
    getCluster,
    mapAddons,
    ResourceError,
    SecretDefinition,
} from '../../../../../resources'
import { ClusterActionDropdown, getClusterActions } from '../components/ClusterActionDropdown'
import { ClusterDestroy } from '../components/ClusterDestroy'
import { DownloadConfigurationDropdown } from '../components/DownloadConfigurationDropdown'
import { MachinePoolsPageContent } from './ClusterMachinePools/ClusterMachinePools'
import { NodePoolsPageContent } from './ClusterNodes/ClusterNodes'
import { ClusterOverviewPageContent } from './ClusterOverview/ClusterOverview'
import { ClustersSettingsPageContent } from './ClusterSettings/ClusterSettings'

export const ClusterContext = createContext<{
    readonly cluster: Cluster | undefined
    readonly clusterCurator?: ClusterCurator
    readonly addons: Addon[] | undefined
    readonly clusterDeployment?: ClusterDeployment
    readonly agents?: AgentK8sResource[]
    readonly agentClusterInstall?: AgentClusterInstallK8sResource
    // readonly infraEnv?: InfraEnvK8sResource
    readonly infraEnvAIFlow?: InfraEnvK8sResource
    readonly hostedCluster?: HostedClusterK8sResource
}>({
    cluster: undefined,
    addons: undefined,
    clusterDeployment: undefined,
    agents: undefined,
    agentClusterInstall: undefined,
    // infraEnv: undefined,
    infraEnvAIFlow: undefined,
    hostedCluster: undefined,
})

export default function ClusterDetailsPage({ match }: RouteComponentProps<{ id: string }>) {
    const location = useLocation()
    const history = useHistory()
    const { t } = useTranslation()

    const [
        managedClusters,
        clusterDeployments,
        managedClusterInfos,
        certificateSigningRequests,
        managedClusterAddons,
        clusterManagementAddons,
        clusterClaims,
        clusterCurators,
        agentClusterInstalls,
        agents,
        infraEnvs,
        hostedClusters,
        nodePools,
    ] = useRecoilValue(
        waitForAll([
            managedClustersState,
            clusterDeploymentsState,
            managedClusterInfosState,
            certificateSigningRequestsState,
            managedClusterAddonsState,
            clusterManagementAddonsState,
            clusterClaimsState,
            clusterCuratorsState,
            agentClusterInstallsState,
            agentsState,
            infraEnvironmentsState,
            hostedClustersState,
            nodePoolsState,
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

    const clusterCurator = clusterCurators.find((cc) => cc.metadata.namespace === match.params.id)

    const agentClusterInstall = agentClusterInstalls.find(
        (aci) => aci.metadata.name === match.params.id && aci.metadata.namespace === match.params.id
    )
    const hostedCluster = hostedClusters.find(
        (hc) => hc.metadata.name === match.params.id && hc.metadata.namespace === match.params.id
    )
    const infraEnvAIFlow = infraEnvs.find(
        (ie: InfraEnvK8sResource) =>
            ie.spec?.clusterRef?.name === clusterDeployment?.metadata.name &&
            ie.spec?.clusterRef?.namespace === clusterDeployment?.metadata.namespace
    )

    const clusterExists = !!managedCluster || !!clusterDeployment || !!managedClusterInfo || !!hostedCluster

    const cluster = getCluster(
        managedClusterInfo,
        clusterDeployment,
        certificateSigningRequests,
        managedCluster,
        clusterAddons,
        clusterClaim,
        clusterCurator,
        agentClusterInstall,
        hostedCluster,
        nodePools
    )
    const prevCluster = usePrevious(cluster)
    const showMachinePoolTab = cluster.isHive && cluster.isManaged && cluster.provider !== Provider.baremetal

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
            <Page>
                <ErrorPage
                    error={new ResourceError('Not found', 404)}
                    actions={
                        <AcmButton role="link" onClick={() => history.push(NavigationPath.clusters)}>
                            {t('button.backToClusters')}
                        </AcmButton>
                    }
                />
            </Page>
        )
    }

    const clusterActionGroupChildren = []
    const addonLinks = addons.filter((addon) => addon.launchLink)
    if (addonLinks.length > 0) {
        clusterActionGroupChildren.push(
            <AcmLaunchLink
                links={addonLinks?.map((addon) => ({
                    id: addon.launchLink?.displayText!,
                    text: addon.launchLink?.displayText!,
                    href: addon.launchLink?.href!,
                }))}
            />
        )
    }
    if (cluster?.hive.secrets?.installConfig || (cluster?.kubeconfig && cluster.provider !== Provider.hypershift)) {
        clusterActionGroupChildren.push(<DownloadConfigurationDropdown canGetSecret={canGetSecret} />)
    }
    if (getClusterActions(cluster).length > 0) {
        clusterActionGroupChildren.push(<ClusterActionDropdown cluster={cluster!} isKebab={false} />)
    }
    return (
        <ClusterContext.Provider
            value={{
                cluster,
                clusterCurator,
                addons,
                agentClusterInstall,
                agents,
                clusterDeployment,
                // infraEnv,
                infraEnvAIFlow,
                hostedCluster,
            }}
        >
            <AcmPage
                hasDrawer
                header={
                    <AcmPageHeader
                        breadcrumb={[
                            { text: t('Clusters'), to: NavigationPath.clusters },
                            { text: cluster.displayName!, to: '' },
                        ]}
                        title={cluster.displayName!}
                        description={
                            cluster.hive.clusterClaimName && (
                                <span style={{ color: 'var(--pf-global--Color--200)' }}>
                                    {cluster.hive.clusterClaimName}
                                </span>
                            )
                        }
                        navigation={
                            <AcmSecondaryNav>
                                <AcmSecondaryNavItem
                                    isActive={
                                        location.pathname ===
                                        NavigationPath.clusterOverview.replace(':id', match.params.id)
                                    }
                                >
                                    <Link to={NavigationPath.clusterOverview.replace(':id', match.params.id)}>
                                        {t('tab.overview')}
                                    </Link>
                                </AcmSecondaryNavItem>
                                <AcmSecondaryNavItem
                                    isActive={
                                        location.pathname ===
                                        NavigationPath.clusterNodes.replace(':id', match.params.id)
                                    }
                                >
                                    <Link to={NavigationPath.clusterNodes.replace(':id', match.params.id)}>
                                        {t('tab.nodes')}
                                    </Link>
                                </AcmSecondaryNavItem>
                                {showMachinePoolTab && (
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
                                        location.pathname ===
                                        NavigationPath.clusterSettings.replace(':id', match.params.id)
                                    }
                                >
                                    <Link to={NavigationPath.clusterSettings.replace(':id', match.params.id)}>
                                        {t('tab.addons')}
                                    </Link>
                                </AcmSecondaryNavItem>
                            </AcmSecondaryNav>
                        }
                        actions={<AcmActionGroup>{clusterActionGroupChildren}</AcmActionGroup>}
                    />
                }
            >
                <Suspense fallback={<Fragment />}>
                    <Switch>
                        <Route exact path={NavigationPath.clusterOverview}>
                            <ClusterOverviewPageContent canGetSecret={canGetSecret} />
                        </Route>
                        <Route exact path={NavigationPath.clusterNodes}>
                            <NodePoolsPageContent />
                        </Route>
                        {showMachinePoolTab && (
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
            </AcmPage>
        </ClusterContext.Provider>
    )
}
