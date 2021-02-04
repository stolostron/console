import React, { ReactNode, useContext } from 'react'
import {
    AcmPageCard,
    AcmTable,
    compareNumbers,
    IAcmTableColumn,
    AcmErrorBoundary,
} from '@open-cluster-management/ui-components'
import { useTranslation } from 'react-i18next'
import { NodeInfo } from '../../../../../resources/managed-cluster-info'
import { ClusterContext } from '../ClusterDetails'

export function NodePoolsPageContent() {
    const { cluster } = useContext(ClusterContext)
    return (
        <AcmErrorBoundary>
            <NodesPoolsTable nodes={cluster?.nodes?.nodeList!} />
        </AcmErrorBoundary>
    )
}

export function NodesPoolsTable(props: { nodes: NodeInfo[] }) {
    const { t } = useTranslation(['cluster'])

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
        return <span>{roles.join(', ')}</span>
    }
    function rolesSortFn(a: NodeInfo, b: NodeInfo): number {
        const roleA = getRoles(a).join(', ')
        const roleB = getRoles(b).join(', ')
        return roleA.localeCompare(roleB)
    }

    function getNodeMemory(node: NodeInfo): number {
        try {
            const memory = parseInt(node.capacity!.memory)
            if (memory === 0) return 0
            if (isNaN(memory)) return 0
            return memory
        } catch (err) {
            return 0
        }
    }
    function memorySortFn(a: NodeInfo, b: NodeInfo): number {
        return compareNumbers(getNodeMemory(a), getNodeMemory(b))
    }
    function memoryCellFn(node: NodeInfo): ReactNode {
        const memory = getNodeMemory(node)
        if (memory === 0 || memory === undefined) return '-'
        return formatFileSize(memory)
    }

    const columns: IAcmTableColumn<NodeInfo>[] = [
        {
            header: t('table.name'),
            sort: 'name',
            search: 'name',
            cell: 'name',
        },
        {
            header: t('table.role'),
            sort: rolesSortFn,
            cell: rolesCellFn,
        },
        {
            header: t('table.region'),
            sort: getLabelSortFn('failure-domain.beta.kubernetes.io/region'),
            cell: getLabelCellFn('failure-domain.beta.kubernetes.io/region'),
        },
        {
            header: t('table.zone'),
            sort: getLabelSortFn('failure-domain.beta.kubernetes.io/zone'),
            cell: getLabelCellFn('failure-domain.beta.kubernetes.io/zone'),
        },
        {
            header: t('table.instanceType'),
            sort: getLabelSortFn('beta.kubernetes.io/instance-type'),
            cell: getLabelCellFn('beta.kubernetes.io/instance-type'),
        },
        {
            header: t('table.cpu'),
            sort: 'capacity.cpu',
            cell: (node) => node.capacity?.cpu ?? '-',
        },
        {
            header: t('table.memory'),
            sort: memorySortFn,
            cell: memoryCellFn,
        },
    ]
    function keyFn(node: NodeInfo) {
        return node.name as string
    }

    return (
        <AcmPageCard>
            <AcmTable<NodeInfo>
                plural="nodes"
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
