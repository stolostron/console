/* Copyright Contributors to the Open Cluster Management project */
import { ButtonVariant, Stack, StackItem } from '@patternfly/react-core'
import { CheckCircleIcon, InProgressIcon } from '@patternfly/react-icons'
import { useCallback, useContext, useMemo, useState } from 'react'
import { ClusterImageSetK8sResource } from 'openshift-assisted-ui-lib/cim'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { AcmTable, IAcmRowAction, IAcmTableColumn } from '../../../../../ui-components'
import { NodePool } from '../../../../../resources'
import { global_palette_green_500 as okColor } from '@patternfly/react-tokens'
import { get } from 'lodash'
import { ClusterContext } from '../ClusterDetails/ClusterDetails'
import { DistributionField } from './DistributionField'
import { AddNodePoolModal } from './AddNodePoolModal'
import { IManageNodePoolNodesModalProps, ManageNodePoolNodesModal } from './ManagedNodePoolNodesModal'
import { IRemoveNodePoolModalProps, RemoveNodePoolModal } from './RemoveNodePoolModal'
import { HypershiftCloudPlatformType } from './NodePoolForm'

type NodePoolsTableProps = {
    nodePools: NodePool[]
    clusterImages: ClusterImageSetK8sResource[]
}

const NodePoolsTable = ({ nodePools, clusterImages }: NodePoolsTableProps): JSX.Element => {
    const { t } = useTranslation()
    const { cluster, hostedCluster } = useContext(ClusterContext)
    const [openAddNodepoolModal, toggleOpenAddNodepoolModal] = useState<boolean>(false)
    const toggleAddNodepoolModal = () => toggleOpenAddNodepoolModal(!openAddNodepoolModal)
    const [manageNodepoolModalProps, setManageNodepoolModalProps] = useState<
        IManageNodePoolNodesModalProps | { open: false }
    >({
        open: false,
    })
    const [removeNodepoolModalProps, setRemoveNodepoolModalProps] = useState<
        IRemoveNodePoolModalProps | { open: false }
    >({
        open: false,
    })

    const getNodepoolStatus = useCallback((nodepool: NodePool) => {
        const conditions = nodepool.status?.conditions || []

        for (const condition of conditions) {
            if (condition.type === 'Ready') {
                return condition.status === 'True' ? 'Ready' : 'Pending'
            }
        }
    }, [])

    const renderNodepoolStatus = useCallback(
        (nodepool: NodePool) => {
            const status = getNodepoolStatus(nodepool)

            if (status === 'Ready') {
                return (
                    <span>
                        <CheckCircleIcon color={okColor.value} /> {t('Ready')}
                    </span>
                )
            }
            if (status === 'Pending') {
                return (
                    <span>
                        <InProgressIcon /> {t('Pending')}
                    </span>
                )
            }
        },
        [getNodepoolStatus, t]
    )

    const renderHealthCheck = useCallback(
        (nodepool: NodePool) => {
            const healthCheck = get(nodepool, 'spec.management.autoRepair', false) ? 'True' : 'False'

            return <span>{t(healthCheck)}</span>
        },
        [t]
    )

    const getAutoscaling = useCallback((nodepool: NodePool) => {
        const autoscaling = get(nodepool, 'spec.autoScaling')
        if (!autoscaling) {
            return ''
        }

        const min = autoscaling.min || 1
        const max = autoscaling.max || 1

        return `Min ${min} Max ${max}`
    }, [])

    // Need to dynamically add columns when we add support for other clouds ie. Azure
    const columns = useMemo<IAcmTableColumn<NodePool>[]>(
        () => [
            {
                header: t('Nodepool'),
                sort: 'metadata.name',
                search: 'metadata.name',
                cell: 'metadata.name',
            },
            {
                header: t('Status'),
                sort: 'transformed.status',
                search: 'transformed.status',
                cell: (nodepool) => renderNodepoolStatus(nodepool),
            },
            {
                header: t('table.distribution'),
                sort: 'status.version',
                search: 'status.version',
                cell: (nodepool) => <DistributionField cluster={cluster} nodepool={nodepool} />,
            },
            {
                header: t('Subnet'),
                sort: 'spec.platform.aws.subnet.id',
                search: 'spec.platform.aws.subnet.id',
                cell: 'spec.platform.aws.subnet.id',
            },
            {
                header: t('Instance type'),
                sort: 'spec.platform.aws.instanceType',
                search: 'spec.platform.aws.instanceType',
                cell: 'spec.platform.aws.instanceType',
            },
            {
                header: t('Nodes'),
                sort: 'spec.replicas',
                search: 'spec.replicas',
                cell: 'spec.replicas',
            },
            {
                header: t('Health check'),
                sort: 'spec.management.autoRepair',
                search: 'spec.management.autoRepair',
                cell: (nodepool) => renderHealthCheck(nodepool),
            },
            {
                header: t('Upgrade type'),
                sort: 'spec.management.upgradeType',
                search: 'spec.management.upgradeType',
                cell: 'spec.management.upgradeType',
            },
            {
                header: t('Autoscaling'),
                sort: 'transformed.autoscaling',
                search: 'transformed.autoscaling',
                cell: (nodepool) => getAutoscaling(nodepool),
            },
        ],
        [renderNodepoolStatus, renderHealthCheck, getAutoscaling, t, cluster]
    )

    const keyFn = useCallback(
        (nodepool: NodePool) => nodepool.metadata.uid ?? `${nodepool.metadata.namespace}/${nodepool.metadata.name}`,
        []
    )

    const generateTransformedData = useCallback(
        (nodepool: NodePool) => {
            const transformedObject = {
                transformed: {
                    status: getNodepoolStatus(nodepool),
                    autoscaling: getAutoscaling(nodepool),
                },
            }

            return { ...nodepool, ...transformedObject }
        },
        [getNodepoolStatus, getAutoscaling]
    )

    const transformedNodepoolItems = useMemo(
        () => nodePools.map(generateTransformedData),
        [nodePools, generateTransformedData]
    )

    const rowActionResolver = useCallback(
        (nodepool: NodePool) => {
            const actions: IAcmRowAction<any>[] = []

            if (getNodepoolStatus(nodepool) !== 'Pending') {
                actions.push({
                    id: 'manageNodepool',
                    title: t('Manage nodepool'),
                    click: () => {
                        setManageNodepoolModalProps({
                            open: true,
                            close: () => {
                                setManageNodepoolModalProps({ open: false })
                            },
                            hostedCluster,
                            nodepool,
                        })
                    },
                })
            }

            actions.push({
                id: 'removeNodepool',
                title: t('Remove nodepool'),
                click: () => {
                    setRemoveNodepoolModalProps({
                        open: true,
                        close: () => {
                            setRemoveNodepoolModalProps({ open: false })
                        },
                        nodepool,
                        nodepoolCount: nodePools.length,
                    })
                },
            })

            return actions
        },
        [getNodepoolStatus, hostedCluster, nodePools.length, t]
    )
    return (
        <>
            <RemoveNodePoolModal {...removeNodepoolModalProps} />
            <ManageNodePoolNodesModal {...manageNodepoolModalProps} />
            <AddNodePoolModal
                open={openAddNodepoolModal}
                close={toggleAddNodepoolModal}
                hostedCluster={hostedCluster}
                refNodepool={nodePools && nodePools.length > 0 ? nodePools[0] : undefined}
                clusterImages={clusterImages}
            />
            <Stack hasGutter>
                <StackItem>
                    <AcmTable<NodePool>
                        key="nodepool-table"
                        plural={t('Node pools')}
                        columns={columns}
                        keyFn={keyFn}
                        items={transformedNodepoolItems}
                        tableActionButtons={[
                            {
                                id: 'addNodepool',
                                title: t('Add nodepool'),
                                click: () => toggleAddNodepoolModal(),
                                isDisabled: hostedCluster?.spec?.platform?.type !== HypershiftCloudPlatformType.AWS,
                                tooltip:
                                    hostedCluster?.spec?.platform?.type !== HypershiftCloudPlatformType.AWS
                                        ? t(
                                              'Add nodepool is only supported for AWS. Use the HyperShift CLI to add additional nodepools.'
                                          )
                                        : t('rbac.unauthorized'),
                                variant: ButtonVariant.primary,
                            },
                        ]}
                        rowActionResolver={rowActionResolver}
                    />
                </StackItem>
            </Stack>
        </>
    )
}

export default NodePoolsTable
