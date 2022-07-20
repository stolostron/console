/* Copyright Contributors to the Open Cluster Management project */

import { Text, TextContent, TextVariants } from '@patternfly/react-core'
import { AcmInlineProvider, Provider } from '../../../../../ui-components'
import { useContext, useMemo, useState } from 'react'
import { useHistory } from 'react-router'
import { BulkActionModel, errorIsNot, IBulkActionModelProps } from '../../../../../components/BulkActionModel'
import { RbacDropdown } from '../../../../../components/Rbac'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { deleteCluster, detachCluster } from '../../../../../lib/delete-cluster'
import { deleteHypershiftCluster } from '../../../../../lib/delete-hypershift-cluster'
import { createImportResources } from '../../../../../lib/import-cluster'
import { PluginContext } from '../../../../../lib/PluginContext'
import { rbacCreate, rbacDelete, rbacPatch } from '../../../../../lib/rbac-util'
import { NavigationPath } from '../../../../../NavigationPath'
import {
    Cluster,
    ClusterCuratorDefinition,
    ClusterDeployment,
    ClusterDeploymentDefinition,
    ClusterStatus,
    HostedClusterDefinition,
    ManagedClusterDefinition,
    patchResource,
    ResourceErrorCode,
} from '../../../../../resources'
import { BatchChannelSelectModal } from './BatchChannelSelectModal'
import { BatchUpgradeModal } from './BatchUpgradeModal'
import ScaleUpDialog from './cim/ScaleUpDialog'
import { EditLabels } from './EditLabels'
import { StatusField } from './StatusField'

/**
 * Function to return cluster actions available to a cluster
 * @param cluster
 */
export function getClusterActions(cluster: Cluster) {
    let actionIds = [
        'edit-labels',
        'upgrade-cluster',
        'select-channel',
        'search-cluster',
        'import-cluster',
        'hibernate-cluster',
        'resume-cluster',
        'detach-cluster',
        'destroy-cluster',
        'ai-edit',
        'ai-scale-up',
        'destroy-hypershift-cluster',
    ]

    // ClusterCurator
    if ([ClusterStatus.prehookjob, ClusterStatus.prehookfailed].includes(cluster.status)) {
        const disabledPreHookActions = [
            'upgrade-cluster',
            'select-channel',
            'search-cluster',
            'import-cluster',
            'hibernate-cluster',
            'resume-cluster',
            'detach-cluster',
        ]
        actionIds = actionIds.filter((id) => !disabledPreHookActions.includes(id))
    }

    if (cluster.status === ClusterStatus.importfailed) {
        const disabledImportFailedActions = [
            'upgrade-cluster',
            'select-channel',
            'search-cluster',
            'import-cluster',
            'detach-cluster',
        ]
        actionIds = actionIds.filter((id) => !disabledImportFailedActions.includes(id))
    }

    if ([ClusterStatus.hibernating, ClusterStatus.stopping, ClusterStatus.resuming].includes(cluster.status)) {
        const disabledHibernationActions = [
            'upgrade-cluster',
            'select-channel',
            'search-cluster',
            'hibernate-cluster',
            'import-cluster',
            'detach-cluster',
        ]
        actionIds = actionIds.filter((id) => !disabledHibernationActions.includes(id))
    }

    if (cluster.status !== ClusterStatus.hibernating) {
        actionIds = actionIds.filter((id) => id !== 'resume-cluster')
    }

    if (!cluster.hive.isHibernatable) {
        actionIds = actionIds.filter((id) => id !== 'hibernate-cluster')
    }

    if (cluster.status !== ClusterStatus.ready || !cluster.distribution?.upgradeInfo?.isReadyUpdates) {
        actionIds = actionIds.filter((id) => id !== 'upgrade-cluster')
    }

    if (cluster.status !== ClusterStatus.ready || !cluster.distribution?.upgradeInfo?.isReadySelectChannels) {
        actionIds = actionIds.filter((id) => id !== 'select-channel')
    }

    if (!cluster.isManaged || cluster.status === ClusterStatus.detaching) {
        actionIds = actionIds.filter((id) => id !== 'edit-labels')
        actionIds = actionIds.filter((id) => id !== 'search-cluster')
    }

    if (cluster.status !== ClusterStatus.detached) {
        actionIds = actionIds.filter((id) => id !== 'import-cluster')
    }

    if (cluster.status === ClusterStatus.detached || !cluster.isManaged || cluster.status === ClusterStatus.detaching) {
        actionIds = actionIds.filter((id) => id !== 'detach-cluster')
    }

    if (!cluster.isHive || (cluster.hive.clusterPool && !cluster.hive.clusterClaimName)) {
        actionIds = actionIds.filter((id) => id !== 'destroy-cluster')
    }

    if (!cluster.isHypershift || cluster.status === ClusterStatus.destroying) {
        actionIds = actionIds.filter((id) => id !== 'destroy-hypershift-cluster')
    }

    if (cluster.provider !== Provider.hybrid) {
        actionIds = actionIds.filter((id) => id !== 'ai-edit')
    }

    if (
        !(
            cluster.provider === Provider.hybrid &&
            [ClusterStatus.pendingimport, ClusterStatus.ready, ClusterStatus.unknown].includes(cluster.status)
        )
    ) {
        actionIds = actionIds.filter((id) => id !== 'ai-scale-up')
    }
    return actionIds
}

export function ClusterActionDropdown(props: { cluster: Cluster; isKebab: boolean }) {
    const { t } = useTranslation()
    const history = useHistory()
    const { isSearchAvailable } = useContext(PluginContext)

    const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false)
    const [showChannelSelectModal, setShowChannelSelectModal] = useState<boolean>(false)
    const [scaleUpModalOpen, setScaleUpModalOpen] = useState<string | undefined>(undefined)
    const [modalProps, setModalProps] = useState<IBulkActionModelProps<Cluster> | { open: false }>({
        open: false,
    })
    const [showEditLabels, setShowEditLabels] = useState<boolean>(false)

    const { cluster } = props

    const modalColumns = useMemo(
        () => [
            {
                header: t('table.name'),
                cell: (cluster: Cluster) => (
                    <>
                        <span style={{ whiteSpace: 'nowrap' }}>{cluster.displayName}</span>
                        {cluster.hive.clusterClaimName && (
                            <TextContent>
                                <Text component={TextVariants.small}>{cluster.hive.clusterClaimName}</Text>
                            </TextContent>
                        )}
                    </>
                ),
                sort: 'displayName',
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

    const destroyRbac = useMemo(
        () => [
            rbacDelete(
                cluster.provider === Provider.hypershift ? HostedClusterDefinition : ClusterDeploymentDefinition,
                cluster.namespace,
                cluster.name
            ),
        ],
        [cluster.name, cluster.namespace, cluster.provider]
    )
    if (cluster.isManaged) {
        destroyRbac.push(rbacDelete(ManagedClusterDefinition, undefined, cluster.name))
    }

    let actions = useMemo(
        () => [
            {
                id: 'edit-labels',
                text: t('managed.editLabels'),
                click: () => setShowEditLabels(true),
                isAriaDisabled: true,
                rbac: [rbacPatch(ManagedClusterDefinition, undefined, cluster.name)],
            },
            {
                id: 'upgrade-cluster',
                text: t('managed.upgrade'),
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                click: (_cluster: Cluster) => setShowUpgradeModal(true),
                isAriaDisabled: true,
                rbac: [
                    rbacPatch(ClusterCuratorDefinition, cluster.namespace),
                    rbacCreate(ClusterCuratorDefinition, cluster.namespace),
                ],
            },
            {
                id: 'select-channel',
                text: t('managed.selectChannel'),
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                click: (_cluster: Cluster) => setShowChannelSelectModal(true),
                isAriaDisabled: true,
                rbac: [
                    rbacPatch(ClusterCuratorDefinition, cluster.namespace),
                    rbacCreate(ClusterCuratorDefinition, cluster.namespace),
                ],
            },
            ...(isSearchAvailable
                ? [
                      {
                          id: 'search-cluster',
                          text: t('managed.search'),
                          click: (cluster: Cluster) =>
                              window.location.assign(
                                  `${NavigationPath.search}?filters={"textsearch":"cluster%3A${cluster?.name}"}`
                              ),
                      },
                  ]
                : []),
            {
                id: 'import-cluster',
                text: t('managed.import'),
                click: (cluster: Cluster) => {
                    setModalProps({
                        open: true,
                        title: t('bulk.title.import'),
                        action: t('import'),
                        processing: t('importing'),
                        resources: [cluster],
                        close: () => {
                            setModalProps({ open: false })
                        },
                        description: t('bulk.message.import'),
                        columns: [
                            {
                                header: t('upgrade.table.name'),
                                sort: 'displayName',
                                cell: (cluster) => (
                                    <>
                                        <span style={{ whiteSpace: 'nowrap' }}>{cluster.displayName}</span>
                                        {cluster.hive.clusterClaimName && (
                                            <TextContent>
                                                <Text component={TextVariants.small}>
                                                    {cluster.hive.clusterClaimName}
                                                </Text>
                                            </TextContent>
                                        )}
                                    </>
                                ),
                            },
                            {
                                header: t('table.provider'),
                                sort: 'provider',
                                cell: (cluster: Cluster) =>
                                    cluster?.provider ? <AcmInlineProvider provider={cluster?.provider} /> : '-',
                            },
                        ],
                        keyFn: (cluster) => cluster.name as string,
                        actionFn: (cluster: Cluster) => createImportResources(cluster.name!, cluster.clusterSet!),
                    })
                },
                rbac: [rbacCreate(ManagedClusterDefinition)],
            },
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
                isAriaDisabled: true,
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
                isAriaDisabled: true,
                rbac: [rbacPatch(ClusterDeploymentDefinition, cluster.namespace, cluster.name)],
            },
            {
                id: 'detach-cluster',
                text: t('managed.detach'),
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
                        icon: 'warning',
                        confirmText: cluster.displayName,
                        isValidError: errorIsNot([ResourceErrorCode.NotFound]),
                    })
                },
                isAriaDisabled: true,
                rbac: [rbacDelete(ManagedClusterDefinition, undefined, cluster.name)],
            },
            {
                id: 'destroy-cluster',
                text: t('managed.destroy'),
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
                        actionFn: (cluster) => deleteCluster(cluster),
                        close: () => {
                            setModalProps({ open: false })
                        },
                        isDanger: true,
                        icon: 'warning',
                        confirmText: cluster.displayName,
                        isValidError: errorIsNot([ResourceErrorCode.NotFound]),
                    })
                },
                isAriaDisabled: true,
                rbac: destroyRbac,
            },
            {
                id: 'ai-edit',
                text: t('managed.editAI'),
                click: (cluster: Cluster) =>
                    history.push(
                        NavigationPath.editCluster
                            .replace(':namespace', cluster.namespace!)
                            .replace(':name', cluster.name!)
                    ),
                isAriaDisabled: cluster.status !== ClusterStatus.draft,
            },
            {
                id: 'ai-scale-up',
                text: t('managed.ai.scaleUp'),
                click: (cluster: Cluster) => setScaleUpModalOpen(cluster.name),
            },
            {
                id: 'destroy-hypershift-cluster',
                text: t('managed.destroy'),
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
                        actionFn: (cluster) => deleteHypershiftCluster(cluster),
                        close: () => {
                            setModalProps({ open: false })
                        },
                        isDanger: true,
                        icon: 'warning',
                        confirmText: cluster.displayName,
                        isValidError: errorIsNot([ResourceErrorCode.NotFound]),
                    })
                },
                isAriaDisabled: true,
                rbac: destroyRbac,
            },
        ],
        [cluster, destroyRbac, history, isSearchAvailable, modalColumns, t]
    )
    const clusterActions = getClusterActions(cluster)
    actions = actions.filter((action) => clusterActions.indexOf(action.id) > -1)
    return (
        <>
            <EditLabels
                resource={
                    showEditLabels
                        ? { ...ManagedClusterDefinition, metadata: { name: cluster.name, labels: cluster.labels } }
                        : undefined
                }
                displayName={cluster.displayName}
                close={() => setShowEditLabels(false)}
            />
            <BatchUpgradeModal clusters={[cluster]} open={showUpgradeModal} close={() => setShowUpgradeModal(false)} />
            <BatchChannelSelectModal
                clusters={[cluster]}
                open={showChannelSelectModal}
                close={() => setShowChannelSelectModal(false)}
            />
            <BulkActionModel<Cluster> {...modalProps} />
            {actions && actions.length > 0 && (
                <RbacDropdown<Cluster>
                    id={`${cluster.name}-actions`}
                    item={cluster}
                    isKebab={props.isKebab}
                    text={t('actions')}
                    actions={actions}
                />
            )}
            <ScaleUpDialog
                isOpen={!!scaleUpModalOpen}
                clusterName={scaleUpModalOpen}
                closeDialog={() => setScaleUpModalOpen(undefined)}
            />
        </>
    )
}
