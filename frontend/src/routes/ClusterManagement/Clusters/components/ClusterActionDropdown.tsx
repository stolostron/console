import React, { useState, useContext, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { AcmDrawerContext, AcmInlineProvider } from '@open-cluster-management/ui-components'
import { RbacDropdown } from '../../../../components/Rbac'
import { BulkActionModel, errorIsNot, IBulkActionModelProps } from '../../../../components/BulkActionModel'
import { EditLabels } from './EditLabels'
import { StatusField } from './StatusField'
import { BatchUpgradeModal } from './BatchUpgradeModal'
import { Cluster, ClusterStatus } from '../../../../lib/get-cluster'
import { ResourceErrorCode } from '../../../../lib/resource-request'
import { deleteCluster, detachCluster } from '../../../../lib/delete-cluster'
import { getResourceAttributes } from '../../../../lib/rbac-util'
import { ManagedClusterDefinition } from '../../../../resources/managed-cluster'
import { ClusterDeploymentDefinition } from '../../../../resources/cluster-deployment'
import { ManagedClusterActionDefinition } from '../../../../resources/managedclusteraction'
// import { createImportResources } from '../../../lib/import-cluster'

export function ClusterActionDropdown(props: { cluster: Cluster; isKebab: boolean; refresh?: () => void }) {
    const { setDrawerContext } = useContext(AcmDrawerContext)
    const { t } = useTranslation(['cluster'])

    const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false)
    const [modalProps, setModalProps] = useState<IBulkActionModelProps<Cluster> | { open: false }>({
        open: false,
    })

    const { cluster } = props

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

    let actions = [
        {
            id: 'edit-labels',
            text: t('managed.editLabels'),
            click: (cluster: Cluster) => {
                setDrawerContext({
                    isExpanded: true,
                    title: t('labels.edit.title'),
                    onCloseClick: () => setDrawerContext(undefined),
                    panelContent: <EditLabels cluster={cluster} close={() => setDrawerContext(undefined)} />,
                    panelContentProps: { minSize: '600px' },
                })
            },
            isDisabled: true,
            rbac: [getResourceAttributes('patch', ManagedClusterDefinition, undefined, cluster.name)],
        },
        {
            id: 'launch-cluster',
            text: t('managed.launch'),
            click: (cluster: Cluster) => window.open(cluster?.consoleURL, '_blank'),
        },
        {
            id: 'upgrade-cluster',
            text: t('managed.upgrade'),
            click: (cluster: Cluster) => {
                setShowUpgradeModal(true)
            },
            isDisabled: true,
            rbac: [getResourceAttributes('create', ManagedClusterActionDefinition, cluster.namespace)],
        },
        {
            id: 'search-cluster',
            text: t('managed.search'),
            click: (cluster: Cluster) =>
                window.location.assign(`/search?filters={"textsearch":"cluster%3A${cluster?.name}"}`),
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
        //                         cluster?.provider ? <AcmInlineProvider provider={cluster?.provider} /> : '-',
        //                 },
        //             ],
        //             keyFn: (cluster) => cluster.name as string,
        //             actionFn: createImportResources,
        //         })
        //     },
        //     rbac: [getResourceAttributes('create', ManagedClusterDefinition)],
        // },
        {
            id: 'detach-cluster',
            text: t('managed.detached'),
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
                        props.refresh?.()
                    },
                    isDanger: true,
                    confirmText: cluster.name,
                    isValidError: errorIsNot([ResourceErrorCode.NotFound]),
                })
            },
            isDisabled: true,
            rbac: [getResourceAttributes('delete', ManagedClusterDefinition, undefined, cluster.name)],
        },
        {
            id: 'destroy-cluster',
            text: t('managed.destroySelected'),
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
                        props.refresh?.()
                    },
                    isDanger: true,
                    confirmText: cluster.name,
                    isValidError: errorIsNot([ResourceErrorCode.NotFound]),
                })
            },
            isDisabled: true,
            rbac: [
                getResourceAttributes('delete', ManagedClusterDefinition, undefined, cluster.name),
                getResourceAttributes('delete', ClusterDeploymentDefinition, cluster.namespace, cluster.name),
            ],
        },
    ]

    if (!cluster.consoleURL) {
        actions = actions.filter((a) => a.id !== 'launch-cluster')
    }

    if (
        cluster.distribution?.isManagedOpenShift ||
        cluster.status !== ClusterStatus.ready ||
        !(cluster.distribution?.ocp?.availableUpdates && cluster.distribution?.ocp?.availableUpdates.length > 0) ||
        (cluster.distribution?.ocp?.version &&
            cluster.distribution?.ocp?.desiredVersion &&
            cluster.distribution?.ocp?.version !== cluster.distribution?.ocp?.desiredVersion)
    ) {
        actions = actions.filter((a) => a.id !== 'upgrade-cluster')
    }

    if (!cluster.isManaged) {
        actions = actions.filter((a) => a.id !== 'edit-labels')
        actions = actions.filter((a) => a.id !== 'search-cluster')
    }

    if (cluster.status !== ClusterStatus.detached) {
        actions = actions.filter((a) => a.id !== 'attach-cluster')
    }

    if (cluster.status === ClusterStatus.detached) {
        actions = actions.filter((a) => a.id !== 'detach-cluster')
    }

    if (!cluster.isHive) {
        actions = actions.filter((a) => a.id !== 'destroy-cluster')
    }

    return (
        <>
            <BatchUpgradeModal clusters={[cluster]} open={showUpgradeModal} close={() => setShowUpgradeModal(false)} />
            <BulkActionModel<Cluster> {...modalProps} />
            <RbacDropdown<Cluster>
                id={`${cluster.name}-actions`}
                item={cluster}
                isKebab={props.isKebab}
                text={t('actions')}
                actions={actions}
            />
        </>
    )
}
