/* Copyright Contributors to the Open Cluster Management project */
import { Button, Stack, StackItem } from '@patternfly/react-core'
import { CheckCircleIcon, InProgressIcon, PlusCircleIcon } from '@patternfly/react-icons'
import { useCallback, useMemo } from 'react'
import { ClusterImageSetK8sResource, ConfigMapK8sResource } from 'openshift-assisted-ui-lib/cim'
// import AddNodePoolModal from '../modals/AddNodePoolModal'
// import { Link } from 'react-router-dom'
// import RemoveNodePoolModal from '../modals/RemoveNodePoolModal'
// import NodePoolStatus from './NodePoolsProgress'
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

const NodePoolsTable = ({
    nodePools,
}: // onRemoveNodePool,
// onUpdateNodePool,
// onAddNodePool,
// clusterImages,
// supportedVersionsCM,
NodePoolsTableProps): JSX.Element => {
    const { t } = useTranslation()
    // const [manageHostsOpen, setManageHostsOpen] = useState<string>()
    // const [addNodePool, setAddNodePool] = useState(false)
    // const [removeNodePoolOpen, setRemoveNodePoolOpen] = useState<string>()

    // const manageNodePool = nodePools.find((np) => np.metadata?.uid === manageHostsOpen)
    // const removeNodePool = nodePools.find((np) => np.metadata?.uid === removeNodePoolOpen)

    const getNodepoolStatus = useCallback((nodepool: NodePool) => {
        const conditions = nodepool.status?.conditions || []

        for (let i = 0; i < conditions.length; i++) {
            if (conditions[i].type === 'Ready') {
                return conditions[i].status ? 'Ready' : 'Pending'
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
        ],
        [renderNodepoolStatus, t]
    )

    const keyFn = useCallback(
        (nodepool: NodePool) => nodepool.metadata!.uid ?? `${nodepool.metadata!.namespace}/${nodepool.metadata!.name}`,
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
