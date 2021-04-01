/* Copyright Contributors to the Open Cluster Management project */

import { AcmDrawerContext, AcmInlineProvider } from '@open-cluster-management/ui-components'
import { useContext, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRecoilState } from 'recoil'
import { BulkActionModel, errorIsNot, IBulkActionModelProps } from '../../../../components/BulkActionModel'
import { RbacDropdown } from '../../../../components/Rbac'
import { deleteCluster, detachCluster } from '../../../../lib/delete-cluster'
import { Cluster, ClusterStatus } from '../../../../lib/get-cluster'
import { rbacCreate, rbacDelete, rbacPatch } from '../../../../lib/rbac-util'
import { patchResource, ResourceErrorCode } from '../../../../lib/resource-request'
import { ClusterDeployment, ClusterDeploymentDefinition } from '../../../../resources/cluster-deployment'
import { ManagedCluster, ManagedClusterDefinition } from '../../../../resources/managed-cluster'
import { ManagedClusterSetDefinition } from '../../../../resources/managed-cluster-set'
import { ManagedClusterActionDefinition } from '../../../../resources/managedclusteraction'
import { BatchUpgradeModal } from './BatchUpgradeModal'
import { ManagedClusterSetModal } from './ManagedClusterSetModal'
import { EditLabels } from './EditLabels'
import { StatusField } from './StatusField'
import { managedClusterSetsState } from '../../../../atoms'
import { managedClusterSetLabel } from '../../../../resources/managed-cluster-set'

export function ClusterActionDropdown(props: { cluster: Cluster; isKebab: boolean }) {
    const { setDrawerContext } = useContext(AcmDrawerContext)
    const { t } = useTranslation(['cluster'])
    const [managedClusterSets] = useRecoilState(managedClusterSetsState)

    const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false)
    const [showManagedClusterSetModal, setShowManagedClusterSetModal] = useState<boolean>(false)
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
            {
                header: t('table.set'),
                sort: `labels.${managedClusterSetLabel}`,
                cell: (cluster: Cluster) => cluster.labels?.[managedClusterSetLabel] ?? '-',
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
            id: 'manage-set',
            text: cluster?.labels?.[managedClusterSetLabel] ? t('managed.removeSet') : t('managed.addSet'),
            click: (cluster: Cluster) => {
                if (cluster?.labels?.[managedClusterSetLabel]) {
                    setModalProps({
                        open: true,
                        isDanger: true,
                        title: t('bulk.title.removeSet'),
                        action: t('remove'),
                        processing: t('removing'),
                        resources: [cluster],
                        description: t('bulk.message.removeSet'),
                        columns: modalColumns,
                        keyFn: (cluster) => cluster.name as string,
                        actionFn: (cluster) => {
                            return patchResource(
                                {
                                    apiVersion: ManagedClusterDefinition.apiVersion,
                                    kind: ManagedClusterDefinition.kind,
                                    metadata: {
                                        name: cluster.name!,
                                    },
                                } as ManagedCluster,
                                [
                                    {
                                        op: 'remove',
                                        path: `/metadata/labels/${managedClusterSetLabel.replace(/\//g, '~1')}`,
                                    },
                                ]
                            )
                        },
                        close: () => setModalProps({ open: false }),
                    })
                } else {
                    setShowManagedClusterSetModal(true)
                }
            },
            isDisabled: !!cluster?.labels?.[managedClusterSetLabel],
            rbac: cluster?.labels?.[managedClusterSetLabel]
                ? [
                      rbacCreate(
                          ManagedClusterSetDefinition,
                          undefined,
                          cluster?.labels?.[managedClusterSetLabel],
                          'join'
                      ),
                  ]
                : undefined,
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
        //     id: 'import-cluster',
        //     text: t('managed.import'),
        //     click: (cluster: Cluster) => {
        //         setModalProps({
        //             open: true,
        //             title: t('bulk.title.import'),
        //             action: t('import'),
        //             processing: t('import.generating'),
        //             resources: [cluster],
        //             close: () => {
        //                 setModalProps({ open: false })
        //             },
        //             description: t('bulk.message.import'),
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
                    title: t('bulk.title.hibernate'),
                    action: t('hibernate'),
                    processing: t('hibernating'),
                    resources: [cluster],
                    description: t('bulk.message.hibernate'),
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
                    title: t('bulk.title.resume'),
                    action: t('resume'),
                    processing: t('resuming'),
                    resources: [cluster],
                    description: t('bulk.message.resume'),
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
                    title: t('bulk.title.detach'),
                    action: t('detach'),
                    processing: t('detaching'),
                    resources: [cluster],
                    description: t('bulk.message.detach'),
                    columns: modalColumns,
                    keyFn: (cluster) => cluster.name as string,
                    actionFn: (cluster) => detachCluster(cluster.name!),
                    close: () => {
                        setModalProps({ open: false })
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
                    title: t('bulk.title.destroy'),
                    action: t('destroy'),
                    processing: t('destroying'),
                    resources: [cluster],
                    description: t('bulk.message.destroy'),
                    columns: modalColumns,
                    keyFn: (cluster) => cluster.name as string,
                    actionFn: (cluster) => deleteCluster(cluster.name!),
                    close: () => {
                        setModalProps({ open: false })
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
            'import-cluster',
            'detach-cluster',
        ]
        actions = actions.filter((a) => !disabledHibernationActions.includes(a.id))
    }

    if ((!cluster?.labels?.[managedClusterSetLabel] && managedClusterSets.length === 0) || !cluster.isManaged) {
        actions = actions.filter((a) => a.id !== 'manage-set')
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
        actions = actions.filter((a) => a.id !== 'import-cluster')
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
            {showManagedClusterSetModal && (
                <ManagedClusterSetModal
                    clusters={[cluster]}
                    open={showManagedClusterSetModal}
                    close={() => setShowManagedClusterSetModal(false)}
                />
            )}
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
