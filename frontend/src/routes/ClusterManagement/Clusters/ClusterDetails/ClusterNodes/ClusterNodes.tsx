import {
    AcmPageCard,
    AcmTable,
    IAcmTableColumn
} from '@open-cluster-management/ui-components'
import React, { ReactNode, useCallback, useEffect } from 'react'
import { ErrorPage } from '../../../../../components/ErrorPage'
import { useQuery } from '../../../../../lib/useQuery'
import { listManagedClusterInfos, NodeInfo } from '../../../../../resources/managed-cluster-info'

export function useManagedClusterInfos(namespace: string) {
    const callback = useCallback(() => {
        return listManagedClusterInfos(namespace)
    }, [namespace])
    return useQuery(callback)
}

export function NodePoolsPageContent(props: { name: string; namespace: string }) {
    const { error, data, startPolling, refresh } = useManagedClusterInfos(props.namespace)
    useEffect(startPolling, [startPolling])

    const mcis = data?.filter((m) => m.metadata.name === props.name)
    if (error) {
        return <ErrorPage error={error} />
    }
    return <NodesPoolsTable nodes={mcis?.[0]?.status.nodeList!} refresh={refresh} />
}

export function NodesPoolsTable(props: { nodes: NodeInfo[]; refresh: () => void }) {
    function getLabelCellFn(label: string) {
        const labelCellFn = (node: NodeInfo) => {
            return <span>{(node.labels && node.labels[label]) || ''}</span>
        }
        return labelCellFn
    }
    function getLabelSortFn(label: string) {
        const labelSortFn = (a: NodeInfo, b: NodeInfo): number => {
            const aValue = (a.labels && a.labels[label]) || ''
            const bValue = (b.labels && b.labels[label]) || ''
            return aValue.localeCompare(bValue)
        }
        return labelSortFn
    }

    function getRoles(node: NodeInfo): string[] {
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
        return roles
    }
    function rolesCellFn(node: NodeInfo): ReactNode {
        const roles = getRoles(node)
        return <span>{roles.join(',')}</span>
    }

    function rolesSortFn(a: NodeInfo, b: NodeInfo): number {
        const roleA = getRoles(a).join(',')
        const roleB = getRoles(b).join(',')
        return roleA.localeCompare(roleB)
    }

    function capacityCellFn(node: NodeInfo): ReactNode {
        if (!node.capacity) {
            return <span></span>
        }
        const cpu = node.capacity!['cpu'] || ''
        let memory = node.capacity!['memory'] || ''
        if (memory.length > 0 && parseInt(memory, 10) > 0) {
            memory = formatFileSize(parseInt(memory, 10))
        }
        return <span>{`${cpu}/${memory}`}</span>
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
            sort: rolesSortFn,
            cell: rolesCellFn,
        },
        {
            header: 'Region',
            sort: getLabelSortFn('failure-domain.beta.kubernetes.io/region'),
            cell: getLabelCellFn('failure-domain.beta.kubernetes.io/region'),
        },
        {
            header: 'Zone',
            sort: getLabelSortFn('failure-domain.beta.kubernetes.io/zone'),
            cell: getLabelCellFn('failure-domain.beta.kubernetes.io/zone'),
        },
        {
            header: 'Instance type',
            sort: getLabelSortFn('beta.kubernetes.io/instance-type'),
            cell: getLabelCellFn('beta.kubernetes.io/instance-type'),
        },
        {
            header: 'Size - Core and memory',
            cell: capacityCellFn,
        },
    ]
    function keyFn(node: NodeInfo) {
        return node.name as string
    }

    return (
        <AcmPageCard>
            <AcmTable<NodeInfo>
                plural="nodeinfos"
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

// formatFileSize converts a size (Ki) into a proper unit with 2 digit precision. (copied from console-ui)
function formatFileSize(size: number): string {
    size = size || 0

    const decimals = 2

    const threshold = 800 // Steps to next unit if exceeded
    const multiplier = 1024
    const units = ['B', 'Ki', 'Mi', 'Gi', 'Ti', 'Pi']

    let factorize = 1,
        unitIndex

    for (unitIndex = 0; unitIndex < units.length; unitIndex++) {
        if (unitIndex > 0) {
            factorize = Math.pow(multiplier, unitIndex)
        }

        if (size < multiplier * factorize && size < threshold * factorize) {
            break
        }
    }

    if (unitIndex >= units.length) {
        unitIndex = units.length - 1
    }

    let fileSize = size / factorize

    let res = fileSize.toFixed(decimals)

    // This removes unnecessary 0 or . chars at the end of the string/decimals
    if (res.indexOf('.') > -1) {
        res = res.replace(/\.?0*$/, '')
    }

    return `${res}${units[unitIndex + 1]}`
}
