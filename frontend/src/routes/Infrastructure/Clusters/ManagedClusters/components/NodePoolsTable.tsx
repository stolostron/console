/* Copyright Contributors to the Open Cluster Management project */
import { Button, Stack, StackItem } from '@patternfly/react-core'
import { CheckCircleIcon, InProgressIcon, PlusCircleIcon } from '@patternfly/react-icons'
import { useCallback, useMemo } from 'react'
import { ClusterImageSetK8sResource, ConfigMapK8sResource } from 'openshift-assisted-ui-lib/cim'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { AcmTable, IAcmTableColumn } from '../../../../../ui-components'
import { NodePool } from '../../../../../resources'
import { global_palette_green_500 as okColor } from '@patternfly/react-tokens'
import { get } from 'lodash'

type NodePoolsTableProps = {
    nodePools: NodePool[]
    onRemoveNodePool: (nodePool: NodePool) => Promise<unknown>
    onUpdateNodePool: (
        nodePool: NodePool,
        nodePoolPatches: {
            op: string
            value: unknown
            path: string
        }[]
    ) => Promise<void>
    onAddNodePool: (nodePool: NodePool) => Promise<void>
    clusterImages: ClusterImageSetK8sResource[]
    supportedVersionsCM?: ConfigMapK8sResource
}

const NodePoolsTable = ({ nodePools }: NodePoolsTableProps): JSX.Element => {
    const { t } = useTranslation()

    const getNodepoolStatus = useCallback((nodepool: NodePool) => {
        const conditions = nodepool.status?.conditions || []

        for (const condition of conditions) {
            if (condition.type === 'Ready') {
                return condition.status ? 'Ready' : 'Pending'
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
        [renderNodepoolStatus, renderHealthCheck, getAutoscaling, t]
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
    return (
        <>
            <Stack hasGutter>
                <StackItem>
                    <AcmTable<NodePool>
                        key="nodepool-table"
                        plural={t('Nodepools')}
                        columns={columns}
                        keyFn={keyFn}
                        items={transformedNodepoolItems}
                    />
                </StackItem>
                <StackItem>
                    <Button variant="link" icon={<PlusCircleIcon />} iconPosition="right" onClick={undefined}>
                        {t('Add Nodepool')}
                    </Button>
                </StackItem>
            </Stack>
        </>
    )
}

export default NodePoolsTable
