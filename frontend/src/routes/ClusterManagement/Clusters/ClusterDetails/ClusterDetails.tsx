import {
    AcmActionGroup,
    AcmButton,
    AcmDropdown,
    AcmInlineProvider,
    AcmLaunchLink,
    AcmPage,
    AcmPageHeader,
    AcmScrollable,
    AcmSecondaryNav,
    AcmSecondaryNavItem,
    AcmSpinnerBackdrop,
    AcmDrawerContext,
} from '@open-cluster-management/ui-components'
import React, { Fragment, Suspense, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Redirect, Route, RouteComponentProps, Switch, useHistory, useLocation } from 'react-router-dom'
import { AppContext } from '../../../../components/AppContext'
import { BulkActionModel, errorIsNot, IBulkActionModelProps } from '../../../../components/BulkActionModel'
import { BatchUpgradeModal } from '../components/BatchUpgradeModal'
import { StatusField } from '../components/StatusField'
import { ErrorPage } from '../../../../components/ErrorPage'
import { deleteCluster, detachCluster } from '../../../../lib/delete-cluster'
import { Addon, mapAddons } from '../../../../lib/get-addons'
import { Cluster, ClusterStatus, getCluster, getSingleCluster } from '../../../../lib/get-cluster'
import { ResourceError, ResourceErrorCode } from '../../../../lib/resource-request'
import { useQuery } from '../../../../lib/useQuery'
import { NavigationPath } from '../../../../NavigationPath'
import { CertificateSigningRequest } from '../../../../resources/certificate-signing-requests'
import { ClusterDeployment } from '../../../../resources/cluster-deployment'
import { ManagedCluster } from '../../../../resources/managed-cluster'
import { listManagedClusterAddOns } from '../../../../resources/managed-cluster-add-on'
import { ManagedClusterInfo } from '../../../../resources/managed-cluster-info'
import {
    CheckTableActionsRbacAccess,
    ClustersTableActionsRbac,
    createSubjectAccessReview,
    defaultTableRbacValues,
    rbacMapping,
} from '../../../../resources/self-subject-access-review'
import { DownloadConfigurationDropdown } from '../components/DownloadConfigurationDropdown'
import { ClusterDestroy } from '../components/ClusterDestroy'
import { EditLabels } from '../components/EditLabels'
import { NodePoolsPageContent } from './ClusterNodes/ClusterNodes'
import { ClusterOverviewPageContent } from './ClusterOverview/ClusterOverview'
import { ClustersSettingsPageContent } from './ClusterSettings/ClusterSettings'
import { usePrevious } from '../../../../components/usePrevious'
// import { createImportResources } from '../../../../lib/import-cluster'

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
    const [modalProps, setModalProps] = useState<IBulkActionModelProps<Cluster> | { open: false }>({
        open: false,
    })
    const [importCommand, setImportCommand] = useState<string | undefined>()
    const [importCommandError, setImportCommandError] = useState<string | undefined>()
    const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false)
    // Cluster
    const { data, startPolling, stopPolling, loading, error, refresh } = useQuery(
        useCallback(() => getSingleCluster(match.params.id, match.params.id), [match.params.id])
    )
    const [cluster, setCluster] = useState<Cluster | undefined>(undefined)
    const [clusterError, setClusterError] = useState<ResourceError | undefined>(undefined)
    const [getSecretAccessRestriction, setSecretAccessRestriction] = useState<boolean>(true)

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
        const resource = rbacMapping('secret.get', match.params.id, match.params.id)[0]
        try {
            const promiseResult = createSubjectAccessReview(resource).promise
            promiseResult.then((result) => {
                setSecretAccessRestriction(!result.status?.allowed!)
            })
        } catch (err) {
            console.error(err)
        }
    }, [match.params.id])

    const [tableActionRbacValues, setTableActionRbacValues] = useState<ClustersTableActionsRbac>(defaultTableRbacValues)
    useEffect(() => {
        if (cluster?.status) {
            const tempCluster: Cluster = {
                name: cluster.name,
                namespace: cluster.namespace,
                status: cluster?.status,
                isHive: cluster?.isHive,
                isManaged: cluster?.isManaged,
                provider: undefined,
                distribution: undefined,
                labels: undefined,
                nodes: undefined,
                hiveSecrets: undefined,
                kubeApiServer: undefined,
                consoleURL: undefined,
            }
            CheckTableActionsRbacAccess(tempCluster, setTableActionRbacValues)
        }
    }, [cluster?.status, cluster?.isHive, cluster?.isManaged, cluster?.name, cluster?.namespace])

    const modalColumns = useMemo(
        () => [
            {
                header: t('table.name'),
                cell: (cluster: Cluster) => <span style={{ whiteSpace: 'nowrap' }}>{cluster.name}</span>,
                sort: 'name',
            },
            {
                header: t('table.status'),
                sort: 'status',
                cell: (cluster: Cluster) => (
                    <span style={{ whiteSpace: 'nowrap' }}>
                        <StatusField cluster={cluster} />
                    </span>
                ),
            },
            {
                header: t('table.provider'),
                sort: 'provider',
                cell: (cluster: Cluster) =>
                    cluster?.provider ? <AcmInlineProvider provider={cluster?.provider} /> : '-',
            },
        ],
        [t]
    )

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
            <AcmDrawerContext.Consumer>
                {({ setDrawerContext }) => (
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
                        <BulkActionModel<Cluster> {...modalProps} />

                        <BatchUpgradeModal
                            clusters={!!cluster ? [cluster] : []}
                            open={showUpgradeModal}
                            close={() => setShowUpgradeModal(false)}
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
                                    <AcmSecondaryNavItem
                                        isActive={
                                            location.pathname ===
                                            NavigationPath.clusterSettings.replace(':id', match.params.id)
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
                                        <DownloadConfigurationDropdown
                                            getSecretAccessRestriction={getSecretAccessRestriction}
                                        />
                                        {(() => {
                                            const onSelect = (id: string) => {
                                                const action = actions.find((a) => a.id === id)
                                                return action?.click(cluster!)
                                            }
                                            let actions = [
                                                {
                                                    id: 'edit-labels',
                                                    text: t('managed.editLabels'),
                                                    click: (cluster: Cluster) => {
                                                        setDrawerContext({
                                                            isExpanded: true,
                                                            title: t('labels.edit.title'),
                                                            onCloseClick: () => setDrawerContext(undefined),
                                                            panelContent: (
                                                                <EditLabels
                                                                    cluster={cluster}
                                                                    close={() => setDrawerContext(undefined)}
                                                                />
                                                            ),
                                                            panelContentProps: { minSize: '600px' },
                                                        })
                                                    },
                                                    isDisabled: !tableActionRbacValues['cluster.edit.labels'],
                                                    tooltip: !tableActionRbacValues['cluster.edit.labels']
                                                        ? t('common:rbac.unauthorized')
                                                        : '',
                                                },
                                                {
                                                    id: 'launch-cluster',
                                                    text: t('managed.launch'),
                                                    click: (cluster: Cluster) =>
                                                        window.open(cluster?.consoleURL, '_blank'),
                                                },
                                                {
                                                    id: 'upgrade-cluster',
                                                    text: t('managed.upgrade'),
                                                    click: (cluster: Cluster) => setShowUpgradeModal(true),
                                                    isDisabled: !tableActionRbacValues['cluster.upgrade'],
                                                    tooltip: !tableActionRbacValues['cluster.edit.labels']
                                                        ? t('common:rbac.unauthorized')
                                                        : '',
                                                },
                                                {
                                                    id: 'search-cluster',
                                                    text: t('managed.search'),
                                                    click: (cluster: Cluster) =>
                                                        window.location.assign(
                                                            `/search?filters={"textsearch":"cluster%3A${cluster?.name}"}`
                                                        ),
                                                },
                                                // {
                                                //     id: 'attach-cluster',
                                                //     text: t('managed.import'),
                                                //     click: (cluster: Cluster) => {
                                                //         setModalProps({
                                                //             open: true,
                                                //             singular: t('cluster'),
                                                //             plural: t('clusters'),
                                                //             action: t('import'),
                                                //             processing: t('import.generating'),
                                                //             resources: [cluster],
                                                //             close: () => {
                                                //                 setModalProps({ open: false })
                                                //             },
                                                //             description: t('cluster.import.description'),
                                                //             columns: [
                                                //                 {
                                                //                     header: t('upgrade.table.name'),
                                                //                     sort: 'name',
                                                //                     cell: 'name',
                                                //                 },
                                                //                 {
                                                //                     header: t('table.provider'),
                                                //                     sort: 'provider',
                                                //                     cell: (cluster: Cluster) =>
                                                //                         cluster?.provider ? (
                                                //                             <AcmInlineProvider provider={cluster?.provider} />
                                                //                         ) : (
                                                //                             '-'
                                                //                         ),
                                                //                 },
                                                //             ],
                                                //             keyFn: (cluster) => cluster.name as string,
                                                //             actionFn: createImportResources,
                                                //         })
                                                //     },
                                                // },
                                                {
                                                    id: 'detach-cluster',
                                                    text: t('managed.detached'),
                                                    isDisabled: !tableActionRbacValues['cluster.detach'],
                                                    tooltip: !tableActionRbacValues['cluster.edit.labels']
                                                        ? t('common:rbac.unauthorized')
                                                        : '',
                                                    click: (cluster: Cluster) => {
                                                        setModalProps({
                                                            open: true,
                                                            singular: t('cluster'),
                                                            plural: t('clusters'),
                                                            action: t('detach'),
                                                            processing: t('detaching'),
                                                            resources: [cluster],
                                                            description: t('cluster.detach.description'),
                                                            columns: modalColumns,
                                                            keyFn: (cluster) => cluster.name as string,
                                                            actionFn: (cluster) => detachCluster(cluster.name!),
                                                            close: () => {
                                                                setModalProps({ open: false })
                                                                refresh()
                                                            },
                                                            isDanger: true,
                                                            confirmText: cluster.name,
                                                            isValidError: errorIsNot([ResourceErrorCode.NotFound]),
                                                        })
                                                    },
                                                },
                                                {
                                                    id: 'destroy-cluster',
                                                    text: t('managed.destroySelected'),
                                                    isDisabled: !tableActionRbacValues['cluster.destroy'],
                                                    tooltip: !tableActionRbacValues['cluster.edit.labels']
                                                        ? t('common:rbac.unauthorized')
                                                        : '',
                                                    click: (cluster: Cluster) => {
                                                        setModalProps({
                                                            open: true,
                                                            singular: t('cluster'),
                                                            plural: t('clusters'),
                                                            action: t('destroy'),
                                                            processing: t('destroying'),
                                                            resources: [cluster],
                                                            description: t('cluster.destroy.description'),
                                                            columns: modalColumns,
                                                            keyFn: (cluster) => cluster.name as string,
                                                            actionFn: (cluster) => deleteCluster(cluster.name!),
                                                            close: () => {
                                                                setModalProps({ open: false })
                                                                refresh()
                                                            },
                                                            isDanger: true,
                                                            confirmText: cluster.name,
                                                            isValidError: errorIsNot([ResourceErrorCode.NotFound]),
                                                        })
                                                    },
                                                },
                                            ]

                                            if (!cluster?.consoleURL) {
                                                actions = actions.filter((a) => a.id !== 'launch-cluster')
                                            }

                                            if (
                                                cluster?.distribution?.isManagedOpenShift ||
                                                cluster?.status !== ClusterStatus.ready ||
                                                !(
                                                    cluster?.distribution?.ocp?.availableUpdates &&
                                                    cluster?.distribution?.ocp?.availableUpdates.length > 0
                                                ) ||
                                                (cluster?.distribution?.ocp?.version &&
                                                    cluster?.distribution?.ocp?.desiredVersion &&
                                                    cluster?.distribution?.ocp?.version !==
                                                        cluster?.distribution?.ocp?.desiredVersion)
                                            ) {
                                                actions = actions.filter((a) => a.id !== 'upgrade-cluster')
                                            }

                                            if (!cluster?.isManaged) {
                                                actions = actions.filter((a) => a.id !== 'edit-labels')
                                                actions = actions.filter((a) => a.id !== 'search-cluster')
                                            }

                                            if (cluster?.status !== ClusterStatus.detached) {
                                                actions = actions.filter((a) => a.id !== 'attach-cluster')
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
                                                    isPlain={true}
                                                />
                                            )
                                        })()}
                                    </AcmActionGroup>
                                </Fragment>
                            }
                        />
                        <AcmScrollable>
                            <Suspense fallback={<Fragment />}>
                                <Switch>
                                    <Route exact path={NavigationPath.clusterOverview}>
                                        <ClusterOverviewPageContent
                                            getSecretAccessRestriction={getSecretAccessRestriction}
                                            editLabelAccessRestriction={!tableActionRbacValues['cluster.edit.labels']}
                                        />
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
                    </ClusterContext.Provider>
                )}
            </AcmDrawerContext.Consumer>
        </AcmPage>
    )
}
