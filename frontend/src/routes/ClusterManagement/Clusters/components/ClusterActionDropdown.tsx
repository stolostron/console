/* Copyright Contributors to the Open Cluster Management project */

import { AcmDrawerContext, AcmInlineProvider } from '@open-cluster-management/ui-components'
import { useContext, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BulkActionModel, errorIsNot, IBulkActionModelProps } from '../../../../components/BulkActionModel'
import { RbacDropdown } from '../../../../components/Rbac'
import { deleteCluster, detachCluster } from '../../../../lib/delete-cluster'
import { Cluster, ClusterStatus } from '../../../../lib/get-cluster'
import { rbacCreate, rbacDelete, rbacPatch } from '../../../../lib/rbac-util'
import { patchResource, ResourceErrorCode } from '../../../../lib/resource-request'
import { ClusterDeployment, ClusterDeploymentDefinition } from '../../../../resources/cluster-deployment'
import { ManagedClusterDefinition } from '../../../../resources/managed-cluster'
import { ManagedClusterActionDefinition } from '../../../../resources/managedclusteraction'
import { BatchUpgradeModal } from './BatchUpgradeModal'
import { EditLabels } from './EditLabels'
import { StatusField } from './StatusField'

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
            rbac: [rbacPatch(ManagedClusterDefinition, undefined, cluster.name)],
        },
        {
            id: 'launch-cluster',
            text: t('managed.launch'),
            click: (cluster: Cluster) => window.open(cluster?.consoleURL, '_blank'),
        },
        {
            id: 'upgrade-cluster',
            text: t('managed.upgrade'),
            click: (cluster: Cluster) => setShowUpgradeModal(true),
            isDisabled: true,
            rbac: [rbacCreate(ManagedClusterActionDefinition, cluster.namespace)],
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
        //     rbac: [rbacCreate(ManagedClusterDefinition)],
        // },
        {
            id: 'hibernate-cluster',
            text: t('managed.hibernate'),
            click: () => {
                setModalProps({
                    open: true,
                    singular: t('cluster'),
                    plural: t('clusters'),
                    action: t('hibernate'),
                    processing: t('hibernating'),
                    resources: [cluster],
                    description: t('cluster.hibernate.description'),
                    columns: modalColumns,
                    keyFn: (cluster) => cluster.name as string,
                    actionFn: (cluster) => {
                        return patchResource(
                            {
                                apiVersion: ClusterDeploymentDefinition.apiVersion,
                                kind: ClusterDeploymentDefinition.kind,
                                metadata: {
                                    name: cluster.name!,
                                    namespace: cluster.namespace!,
                                },
                            } as ClusterDeployment,
                            [{ op: 'replace', path: '/spec/powerState', value: 'Hibernating' }]
                        )
                    },
                    close: () => {
                        setModalProps({ open: false })
                        props.refresh?.()
                    },
                })
            },
            isDisabled: true,
            rbac: [rbacPatch(ClusterDeploymentDefinition, cluster.namespace, cluster.name)],
        },
        {
            id: 'resume-cluster',
            text: t('managed.resume'),
            click: () => {
                setModalProps({
                    open: true,
                    singular: t('cluster'),
                    plural: t('clusters'),
                    action: t('resume'),
                    processing: t('resuming'),
                    resources: [cluster],
                    description: t('cluster.resume.description'),
                    columns: modalColumns,
                    keyFn: (cluster) => cluster.name as string,
                    actionFn: (cluster) => {
                        return patchResource(
                            {
                                apiVersion: ClusterDeploymentDefinition.apiVersion,
                                kind: ClusterDeploymentDefinition.kind,
                                metadata: {
                                    name: cluster.name!,
                                    namespace: cluster.namespace!,
                                },
                            } as ClusterDeployment,
                            [{ op: 'replace', path: '/spec/powerState', value: 'Running' }]
                        )
                    },
                    close: () => {
                        setModalProps({ open: false })
                        props.refresh?.()
                    },
                })
            },
            isDisabled: true,
            rbac: [rbacPatch(ClusterDeploymentDefinition, cluster.namespace, cluster.name)],
        },
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
            rbac: [rbacDelete(ManagedClusterDefinition, undefined, cluster.name)],
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
                rbacDelete(ManagedClusterDefinition, undefined, cluster.name),
                rbacDelete(ClusterDeploymentDefinition, cluster.namespace, cluster.name),
            ],
        },
    ]

    if ([ClusterStatus.hibernating, ClusterStatus.stopping, ClusterStatus.resuming].includes(cluster.status)) {
        const disabledHibernationActions = [
            'launch-cluster',
            'upgrade-cluster',
            'search-cluster',
            'hibernate-cluster',
            'attach-cluster',
            'detach-cluster',
        ]
        actions = actions.filter((a) => !disabledHibernationActions.includes(a.id))
    }

    if (cluster.status !== ClusterStatus.hibernating) {
        actions = actions.filter((a) => a.id !== 'resume-cluster')
    }

    if (!cluster.hive.isHibernatable) {
        actions = actions.filter((a) => a.id !== 'hibernate-cluster')
    }

    if (!cluster.consoleURL) {
        actions = actions.filter((a) => a.id !== 'launch-cluster')
    }

    if (
        cluster.distribution?.isManagedOpenShift ||
        cluster.status !== ClusterStatus.ready ||
        cluster.distribution?.ocp?.availableUpdates === undefined ||
        cluster.distribution?.ocp?.availableUpdates.length === 0 ||
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
