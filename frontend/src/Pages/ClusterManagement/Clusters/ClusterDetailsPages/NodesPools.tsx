import {
    AcmEmptyPage,
    AcmLoadingPage,
    AcmPageCard,
    AcmTable,
    IAcmTableColumn,
} from '@open-cluster-management/ui-components'

import { ListManagedClusterInfos, NodeInfo } from '../../../../lib/ManagedClusterInfo'
import React, { useEffect, ReactNode } from 'react'
import { ErrorPage } from '../../../../components/ErrorPage'

export function NodePoolsPageContent(props: { name: string; namespace: string }) {
    const { loading, error, data, startPolling, stopPolling, refresh } = ListManagedClusterInfos(props.namespace)
    useEffect(() => {
        startPolling(5 * 1000)
        return stopPolling
    }, [startPolling, stopPolling, refresh])

    const mcis = data?.filter((m) => m.metadata.name == props.name)
    console.log('mcis', mcis)

    if (loading) {
        return <AcmLoadingPage />
    } else if (error) {
        return <ErrorPage error={error} />
    } else if (
        !data ||
        !mcis ||
        mcis.length === 0 ||
        !mcis[0].status.nodeList ||
        mcis[0].status.nodeList!.length === 0
    ) {
        return <AcmEmptyPage title="No nodes found." message={`Cluster ${props.name} does not contain any nodes.`} />
    }

    return (
        <AcmPageCard>
            <NodesPoolsTable nodes={mcis[0].status.nodeList!} refresh={refresh} />
        </AcmPageCard>
    )
}

export function NodesPoolsTable(props: {
    nodes: NodeInfo[]
    refresh: () => void
    // deleteConnection: (name?: string, namespace?: string) => Promise<unknown>
}) {
    function getLabelCellFn(label: string) {
        const labelCellFn = (node: NodeInfo) => {
            console.log(label, node.labels)
            return <span>{(node.labels && node.labels[label]) || ''}</span>
        }
        return labelCellFn
    }
    function getLabelSortFn(label: string) {
        const labelSortFn = (a: NodeInfo, b: NodeInfo): number => {
            const aValue = (a.labels && a.labels[label]) || ''
            const bValue = (b.labels && b.labels[label]) || ''
            console.log('compare',a,b,label,bValue,aValue.localeCompare(bValue))
            return aValue.localeCompare(bValue)
        }
        return labelSortFn
    }
    function rolesCellFn(node: NodeInfo): ReactNode {
        const roles: string[] = []
        const nodeRolePrefix = 'node-role.kubernetes.io/'
        const index = nodeRolePrefix.length
        if (node.labels) {
            Object.keys(node.labels!).forEach((label) => {
                if (label.startsWith(nodeRolePrefix)) {
                    roles.push(label.substring(index))
                }
            })
        }
        return <span>{roles.join(',')}</span>
    }

    function capacityFn(node: NodeInfo): ReactNode {
        return <span></span>
    }
    const columns: IAcmTableColumn<NodeInfo>[] = [
        {
            header: 'Name',
            sort: 'name',
            search: 'name',
            cell: 'name',
        },
        {
            header: 'Role',
            sort: 'Role',
            search: 'name',
            cell: rolesCellFn,
        },
        {
            header: 'Region',
            sort: getLabelSortFn('failure-domain.beta.kubernetes.io/region'),
            search: 'failure-domain.beta.kubernetes.io/region',
            cell: getLabelCellFn('failure-domain.beta.kubernetes.io/region'),
        },
        {
            header: 'Zone',
            sort: getLabelSortFn('failure-domain.beta.kubernetes.io/zone'),
            search: 'failure-domain.beta.kubernetes.io/zone',
            cell: getLabelCellFn('failure-domain.beta.kubernetes.io/zone'),
        },
        {
            header: 'Instance type',
            sort: getLabelSortFn('beta.kubernetes.io/instance-type'),
            search: 'labels["beta.kubernetes.io/instance-type"]',
            cell: getLabelCellFn('beta.kubernetes.io/instance-type'),
        },
        {
            header: 'Size - Core and memory',
            cell: 'labels["beta.kubernetes.io/instance-type"]',
        },
    ]
    function keyFn(node: NodeInfo) {
        return node.name as string
    }

    // const [deleteProviderConnection] = useDeleteProviderConnectionMutation({ client })
    //const [confirm, setConfirm] = useState<IConfirmModalProps>(ClosedConfirmModalProps)
    // const history = useHistory()

    return (
        <AcmPageCard>
            <AcmTable<NodeInfo>
                plural="clustermanagementaddons"
                items={props.nodes}
                columns={columns}
                keyFn={keyFn}
                tableActions={[]}
                bulkActions={[]}
                rowActions={[]}
            />
        </AcmPageCard>
    )
}
