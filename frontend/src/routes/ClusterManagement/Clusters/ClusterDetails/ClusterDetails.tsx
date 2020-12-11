import React, { Fragment, Suspense, useEffect, useCallback, useState } from 'react'
import { Link, Redirect, Route, RouteComponentProps, Switch, useLocation, useHistory } from 'react-router-dom'
import {
    AcmPageHeader,
    AcmSecondaryNav,
    AcmSecondaryNavItem,
    AcmSpinnerBackdrop,
    AcmPage,
    AcmButton,
    AcmActionGroup,
    AcmLaunchLink
} from '@open-cluster-management/ui-components'
import { useTranslation } from 'react-i18next'
import { NavigationPath } from '../../../../NavigationPath'
import { ClusterOverviewPageContent } from './ClusterOverview/ClusterOverview'
import { NodePoolsPageContent } from './ClusterNodes/ClusterNodes'
import { ClustersSettingsPageContent } from './ClusterSettings/ClusterSettings'
import { useQuery } from '../../../../lib/useQuery'
import { getSingleCluster, getCluster, Cluster } from '../../../../lib/get-cluster'
import { getAllAddons, mapAddons, Addon } from '../../../../lib/get-addons'
import { ClusterDeployment } from '../../../../resources/cluster-deployment'
import { ManagedClusterInfo } from '../../../../resources/managed-cluster-info'
import { CertificateSigningRequest } from '../../../../resources/certificate-signing-requests'
import { ErrorPage } from '../../../../components/ErrorPage'
import { EditLabelsModal } from '../components/EditLabelsModal'
import { ResourceError, ResourceErrorCode } from '../../../../lib/resource-request'
import { DownloadConfigurationDropdown } from '../components/DownloadConfigurationDropdown'
import { ClusterManagementAddOn } from '../../../../resources/cluster-management-add-on'
import { ManagedClusterAddOn } from '../../../../resources/managed-cluster-add-on'

export const ClusterContext = React.createContext<{
    readonly cluster: Cluster | undefined
    readonly addons: Addon[] | undefined
    readonly addonsError?: Error
    readonly importCommand?: string
    readonly importCommandError?: string
    setImportCommand?: (command: string) => void
    setImportCommandError?: (error: string) => void
    readonly editModalOpen?: boolean
    setEditModalOpen?: (open: boolean) => void
}>({
    cluster: undefined,
    addons: undefined,
    addonsError: undefined,
})

export default function ClusterDetailsPage({ match }: RouteComponentProps<{ id: string }>) {
    const location = useLocation()
    const history = useHistory()
    const { t } = useTranslation(['cluster'])
    const [editModalOpen, setEditModalOpen] = useState<boolean>(false)
    const [importCommand, setImportCommand] = useState<string | undefined>()
    const [importCommandError, setImportCommandError] = useState<string | undefined>()
    
    // Cluster
    const { data, startPolling, loading, error, refresh } = useQuery(
        useCallback(() => getSingleCluster(match.params.id, match.params.id), [match.params.id])
    )
    const [cluster, setCluster] = useState<Cluster | undefined>(undefined)
    const [clusterError, setClusterError] = useState<Error | undefined>(undefined)
    useEffect(startPolling, [startPolling])
    useEffect(() => {
        if (error) {
            return setClusterError(error)
        }

        const results = data ?? []
        if (results.length > 0) {
            if (results[0].status === 'rejected' && results[1].status === 'rejected') {
                const cdRequest = results[0] as PromiseRejectedResult
                const mciRequest = results[1] as PromiseRejectedResult
                const resourceError: ResourceError = {
                    code: mciRequest.reason.code as ResourceErrorCode,
                    message: `${mciRequest.reason.message}.  ${cdRequest.reason.message}` as string,
                    name: '',
                }
                setClusterError(resourceError)
            } else {
                const items = results.map((d) => (d.status === 'fulfilled' ? d.value : undefined))
                setCluster(
                    getCluster(
                        items[1] as ManagedClusterInfo,
                        items[0] as ClusterDeployment,
                        items[2] as CertificateSigningRequest[]
                    )
                )
            }
        }
    }, [data, error])

    // Addons
    const { data: addonData, startPolling: addonStartPolling, error: addonError } = useQuery(
        useCallback(() => getAllAddons(match.params.id), [match.params.id])
    )
    const [addons, setAddons] = useState<Addon[] | undefined>(undefined)
    const [addonsError, setAddonsError] = useState<Error | undefined>(undefined)
    useEffect(addonStartPolling, [addonStartPolling])
    useEffect(() => {
        const results = addonData ?? []
        if (results.length > 0) {
            if (addonError) {
                return setAddonsError(addonError)
            }
            if (results.every((result) => result.status === 'fulfilled')) {
                const items = results.map((result) => (result.status === 'fulfilled' ? result.value : []))
                setAddons(mapAddons(items[0] as ClusterManagementAddOn[], items[1] as ManagedClusterAddOn[]))
            } else {
                const cmaRequest = results[0] as PromiseRejectedResult
                const mcaRequest = results[1] as PromiseRejectedResult
                const resourceError: ResourceError = {
                    code: mcaRequest?.reason?.code ?? (cmaRequest.reason.code as ResourceErrorCode),
                    message: mcaRequest?.reason?.message ?? (cmaRequest.reason.code as string),
                    name: '',
                }
                setAddonsError(resourceError)
            }
        }
    }, [addonData, addonError, setAddonsError])

    if (loading) {
        return <AcmSpinnerBackdrop />
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
        <AcmPage>
            <ClusterContext.Provider value={{ cluster, addons, addonsError, importCommand, setImportCommand, importCommandError, setImportCommandError, editModalOpen, setEditModalOpen }}>
                <EditLabelsModal
                    cluster={editModalOpen ? cluster : undefined}
                    close={() => {
                        setEditModalOpen(false)
                        refresh()
                    }}
                />
                <AcmPageHeader
                    title={match.params.id}
                    breadcrumb={[
                        { text: t('clusters'), to: NavigationPath.clusters },
                        { text: match.params.id, to: '' },
                    ]}
                    actions={
                        <Fragment>
                            <AcmActionGroup>
                                <AcmLaunchLink
                                    links={addons
                                        ?.filter((addon) => addon.launchLink)
                                        ?.map((addon) => ({
                                            id: addon.launchLink?.displayText ?? '',
                                            text: addon.launchLink?.displayText ?? '',
                                            href: addon.launchLink?.href ?? '',
                                        }))}
                                />
                                <DownloadConfigurationDropdown />
                            </AcmActionGroup>
                        </Fragment>
                    }
                />
                <AcmSecondaryNav>
                    <AcmSecondaryNavItem
                        isActive={location.pathname === NavigationPath.clusterOverview.replace(':id', match.params.id)}
                    >
                        <Link to={NavigationPath.clusterOverview.replace(':id', match.params.id)}>
                            {t('tab.overview')}
                        </Link>
                    </AcmSecondaryNavItem>
                    <AcmSecondaryNavItem
                        isActive={location.pathname === NavigationPath.clusterNodes.replace(':id', match.params.id)}
                    >
                        <Link to={NavigationPath.clusterNodes.replace(':id', match.params.id)}>{t('tab.nodes')}</Link>
                    </AcmSecondaryNavItem>
                    <AcmSecondaryNavItem
                        isActive={location.pathname === NavigationPath.clusterSettings.replace(':id', match.params.id)}
                    >
                        <Link to={NavigationPath.clusterSettings.replace(':id', match.params.id)}>
                            {t('tab.settings')}
                        </Link>
                    </AcmSecondaryNavItem>
                </AcmSecondaryNav>
                <Suspense fallback={<Fragment />}>
                    <Switch>
                        <Route exact path={NavigationPath.clusterOverview}>
                            <ClusterOverviewPageContent />
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
            </ClusterContext.Provider>
        </AcmPage>
    )
}
