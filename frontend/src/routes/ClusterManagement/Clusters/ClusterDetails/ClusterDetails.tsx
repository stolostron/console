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
    AcmLaunchLink,
    AcmDropdown,
} from '@open-cluster-management/ui-components'
import { useTranslation } from 'react-i18next'
import { NavigationPath } from '../../../../NavigationPath'
import { ClusterOverviewPageContent } from './ClusterOverview/ClusterOverview'
import { NodePoolsPageContent } from './ClusterNodes/ClusterNodes'
import { ClustersSettingsPageContent } from './ClusterSettings/ClusterSettings'
import { useQuery } from '../../../../lib/useQuery'
import { getSingleCluster, getCluster, Cluster, ClusterStatus } from '../../../../lib/get-cluster'
import { getAllAddons, mapAddons, Addon } from '../../../../lib/get-addons'
import { ClusterDeployment } from '../../../../resources/cluster-deployment'
import { ManagedClusterInfo } from '../../../../resources/managed-cluster-info'
import { CertificateSigningRequest } from '../../../../resources/certificate-signing-requests'
import { ErrorPage } from '../../../../components/ErrorPage'
import { EditLabelsModal } from '../components/EditLabelsModal'
import { ClosedConfirmModalProps, ConfirmModal, IConfirmModalProps } from '../../../../components/ConfirmModal'
import { deleteCluster } from '../../../../lib/delete-cluster'
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
    const [confirm, setConfirm] = useState<IConfirmModalProps>(ClosedConfirmModalProps)
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
            <ClusterContext.Provider
                value={{
                    cluster,
                    addons,
                    addonsError,
                    importCommand,
                    setImportCommand,
                    importCommandError,
                    setImportCommandError,
                    editModalOpen,
                    setEditModalOpen,
                }}
            >
                <EditLabelsModal
                    cluster={editModalOpen ? cluster : undefined}
                    close={() => {
                        setEditModalOpen(false)
                        refresh()
                    }}
                />
                <ConfirmModal
                    open={confirm.open}
                    confirm={confirm.confirm}
                    cancel={confirm.cancel}
                    title={confirm.title}
                    message={confirm.message}
                />
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
                                            id: addon.launchLink?.displayText ?? '',
                                            text: addon.launchLink?.displayText ?? '',
                                            href: addon.launchLink?.href ?? '',
                                        }))}
                                />
                                <DownloadConfigurationDropdown />
                                {(() => {
                                    const onSelect = (id: string) => {
                                        const action = actions.find((a) => a.id === id)
                                        return action?.click(cluster!)
                                    }
                                    let actions = [
                                        {
                                            id: 'edit-labels',
                                            text: t('managed.editLabels'),
                                            click: (cluster: Cluster) => setEditModalOpen(true),
                                        },
                                        {
                                            id: 'launch-cluster',
                                            text: t('managed.launch'),
                                            click: (cluster: Cluster) => window.open(cluster?.consoleURL, '_blank'),
                                        },
                                        {
                                            id: 'upgrade-cluster',
                                            text: t('managed.upgrade'),
                                            click: (cluster: Cluster) => {},
                                        },
                                        {
                                            id: 'search-cluster',
                                            text: t('managed.search'),
                                            click: (cluster: Cluster) => {},
                                        },
                                        {
                                            id: 'detach-cluster',
                                            text: t('managed.detached'),
                                            click: (cluster: Cluster) => {
                                                setConfirm({
                                                    title: t('modal.detach.title'),
                                                    message: `You are about to detach ${cluster?.name}. This action is irreversible.`,
                                                    open: true,
                                                    confirm: () => {
                                                        deleteCluster(cluster?.name!, false).promise.then((results) => {
                                                            results.forEach((result) => {
                                                                if (result.status === 'rejected') {
                                                                    // setErrors([
                                                                    //     `Failed to detach managed cluster ${cluster?.name}. ${result.reason}`,
                                                                    // ])
                                                                }
                                                            })
                                                        })
                                                        setConfirm(ClosedConfirmModalProps)
                                                    },
                                                    cancel: () => {
                                                        setConfirm(ClosedConfirmModalProps)
                                                    },
                                                })
                                                // props.refresh()
                                            },
                                        },
                                        {
                                            id: 'destroy-cluster',
                                            text: t('managed.destroySelected'),
                                            click: (cluster: Cluster) => {
                                                setConfirm({
                                                    title: t('modal.destroy.title'),
                                                    message: `You are about to destroy ${cluster.name}. This action is irreversible.`,
                                                    open: true,
                                                    confirm: () => {
                                                        deleteCluster(cluster.name!, false).promise.then((results) => {
                                                            results.forEach((result) => {
                                                                if (result.status === 'rejected') {
                                                                    // setErrors([
                                                                    //     `Failed to destroy managed cluster ${cluster.name}. ${result.reason}`,
                                                                    // ])
                                                                }
                                                            })
                                                        })
                                                        setConfirm(ClosedConfirmModalProps)
                                                    },
                                                    cancel: () => {
                                                        setConfirm(ClosedConfirmModalProps)
                                                    },
                                                })
                                                // props.refresh()
                                            },
                                        },
                                    ]

                                    if (!cluster?.consoleURL) {
                                        actions = actions.filter((a) => a.id !== 'launch-cluster')
                                    }

                                    if (!cluster?.distribution?.ocp?.availableUpdates) {
                                        actions = actions.filter((a) => a.id !== 'upgrade-cluster')
                                    }

                                    if (!cluster?.isManaged) {
                                        actions = actions.filter((a) => a.id !== 'search-cluster')
                                    }

                                    if (cluster?.status === ClusterStatus.detached) {
                                        actions = actions.filter((a) => a.id !== 'detach-cluster')
                                    }

                                    if (!cluster?.isHive) {
                                        actions = actions.filter((a) => a.id !== 'destroy-cluster')
                                    }

                                    return (
                                        <AcmDropdown
                                            id={`${cluster?.name}-actions`}
                                            onSelect={onSelect}
                                            text={t('actions')}
                                            dropdownItems={actions}
                                            isKebab={false}
                                        />
                                    )
                                })()}
                            </AcmActionGroup>
                        </Fragment>
                    }
                />

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
