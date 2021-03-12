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
    AcmSpinnerBackdrop,
} from '@open-cluster-management/ui-components'
import React, { Fragment, Suspense, useCallback, useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Redirect, Route, RouteComponentProps, Switch, useHistory, useLocation } from 'react-router-dom'
import { AppContext } from '../../../../components/AppContext'
import { ErrorPage } from '../../../../components/ErrorPage'
import { usePrevious } from '../../../../components/usePrevious'
import { Addon, mapAddons } from '../../../../lib/get-addons'
import { Cluster, ClusterStatus, getCluster, getSingleCluster } from '../../../../lib/get-cluster'
import { getUserAccess } from '../../../../lib/rbac-util'
import { ResourceError } from '../../../../lib/resource-request'
import { useQuery } from '../../../../lib/useQuery'
import { NavigationPath } from '../../../../NavigationPath'
import { CertificateSigningRequest } from '../../../../resources/certificate-signing-requests'
import { ClusterDeployment } from '../../../../resources/cluster-deployment'
import { ManagedCluster } from '../../../../resources/managed-cluster'
import { listManagedClusterAddOns } from '../../../../resources/managed-cluster-add-on'
import { ManagedClusterInfo } from '../../../../resources/managed-cluster-info'
import { SecretDefinition } from '../../../../resources/secret'
import { ClusterActionDropdown } from '../components/ClusterActionDropdown'
import { ClusterDestroy } from '../components/ClusterDestroy'
import { DownloadConfigurationDropdown } from '../components/DownloadConfigurationDropdown'
import { NodePoolsPageContent } from './ClusterNodes/ClusterNodes'
import { ClusterOverviewPageContent } from './ClusterOverview/ClusterOverview'
import { ClustersSettingsPageContent } from './ClusterSettings/ClusterSettings'

export const ClusterContext = React.createContext<{
    readonly cluster: Cluster | undefined
    readonly addons: Addon[] | undefined
    readonly addonsError?: Error
    readonly importCommand?: string
    readonly importCommandError?: string
    setImportCommand?: (command: string) => void
    setImportCommandError?: (error: string) => void
}>({
    cluster: undefined,
    addons: undefined,
    addonsError: undefined,
})

export default function ClusterDetailsPage({ match }: RouteComponentProps<{ id: string }>) {
    const location = useLocation()
    const history = useHistory()
    const { t } = useTranslation(['cluster'])
    const [importCommand, setImportCommand] = useState<string | undefined>()
    const [importCommandError, setImportCommandError] = useState<string | undefined>()
    // Cluster
    const { data, startPolling, stopPolling, loading, error } = useQuery(
        useCallback(() => getSingleCluster(match.params.id, match.params.id), [match.params.id])
    )
    const [cluster, setCluster] = useState<Cluster | undefined>(undefined)
    const [clusterError, setClusterError] = useState<ResourceError | undefined>(undefined)
    const [canGetSecret, setCanGetSecret] = useState<boolean>(true)

    // Addons
    const {
        data: addonData,
        startPolling: addonStartPolling,
        stopPolling: addonStopPolling,
        error: addonError,
    } = useQuery(useCallback(() => listManagedClusterAddOns(match.params.id), [match.params.id]))
    const [addons, setAddons] = useState<Addon[] | undefined>(undefined)
    const [addonsError, setAddonsError] = useState<Error | undefined>(undefined)
    const { clusterManagementAddons } = useContext(AppContext)

    useEffect(addonStartPolling, [addonStartPolling])
    useEffect(() => {
        if (addonError) {
            return setAddonsError(addonError)
        }
        if (addonData) {
            setAddons(mapAddons(clusterManagementAddons, addonData))
        }
    }, [addonData, addonError, clusterManagementAddons])
    // End addons

    // handle detach/destroy of clusters
    const prevStatus = usePrevious(cluster?.status)
    const prevIsHive = usePrevious(cluster?.isHive)
    const [clusterIsRemoved, setClusterIsRemoved] = useState<boolean>(false)

    useEffect(startPolling, [startPolling])
    useEffect(() => {
        if (error) {
            return setClusterError(error)
        }

        const results = data ?? []
        if (results.length > 0) {
            if (results[0].status === 'rejected' && results[3].status === 'rejected') {
                // show cluster detach/destroy success state
                if (
                    (prevIsHive && prevStatus === ClusterStatus.destroying) ||
                    (!prevIsHive && prevStatus === ClusterStatus.detaching)
                ) {
                    stopPolling()
                    addonStopPolling()
                    setClusterIsRemoved(true)
                } else {
                    setClusterError(results[3].reason)
                }
            } else {
                const items = results.map((d) => (d.status === 'fulfilled' ? d.value : undefined))
                setCluster(
                    getCluster(
                        items[1] as ManagedClusterInfo,
                        items[0] as ClusterDeployment,
                        items[2] as CertificateSigningRequest[],
                        items[3] as ManagedCluster
                    )
                )
            }
        }
    }, [data, error, prevStatus, prevIsHive, stopPolling, addonStopPolling])

    useEffect(() => {
        const canGetSecret = getUserAccess('get', SecretDefinition, match.params.id)
        canGetSecret.promise
            .then((result) => setCanGetSecret(result.status?.allowed!))
            .catch((err) => console.error(err))
        return () => canGetSecret.abort()
    }, [match.params.id])

    if (loading) {
        return <AcmSpinnerBackdrop />
    }

    if (
        cluster?.status === ClusterStatus.destroying ||
        (!cluster?.isHive && cluster?.status === ClusterStatus.detaching) ||
        clusterIsRemoved
    ) {
        return <ClusterDestroy isLoading={!clusterIsRemoved} cluster={cluster} />
    }

    if (clusterError) {
        return (
            <AcmPage>
                <ErrorPage
                    error={clusterError}
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
                    addonsError,
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
