/* Copyright Contributors to the Open Cluster Management project */
import { Button, Stack, StackItem } from '@patternfly/react-core'
import { CheckCircleIcon, InProgressIcon, PlusCircleIcon } from '@patternfly/react-icons'
import { useCallback, useMemo } from 'react'
import { ClusterImageSetK8sResource, ConfigMapK8sResource } from 'openshift-assisted-ui-lib/cim'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { AcmTable, IAcmTableColumn } from '../../../../../ui-components'
import { NodePool } from '../../../../../resources'
import { global_palette_green_500 as okColor } from '@patternfly/react-tokens'

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
        ],
        [renderNodepoolStatus, t]
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
                },
            }

            return { ...nodepool, ...transformedObject }
        },
        [getNodepoolStatus]
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
