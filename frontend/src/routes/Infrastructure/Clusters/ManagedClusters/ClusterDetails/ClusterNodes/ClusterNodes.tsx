/* Copyright Contributors to the Open Cluster Management project */

import { NodeInfo } from '../../../../../../resources'
import {
  AcmEmptyState,
  AcmInlineStatus,
  AcmPageContent,
  AcmTable,
  compareNumbers,
  getNodeStatusLabel,
  IAcmTableColumn,
  StatusType,
} from '../../../../../../ui-components'
import { PageSection } from '@patternfly/react-core'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { ReactNode, useContext } from 'react'
import { useTranslation } from '../../../../../../lib/acm-i18next'
import { quantityToScalar, scalarToQuantity } from '../../../../../../lib/units'
import { ScaleClusterAlert } from '../../components/ScaleClusterAlert'
import { ClusterContext } from '../ClusterDetails'
import { NavigationPath } from '../../../../../../NavigationPath'
import { Link } from 'react-router-dom'
import { PluginContext } from '../../../../../../lib/PluginContext'

export function NodePoolsPageContent() {
  return (
    <AcmPageContent id="nodes">
      <PageSection>
        <NodesPoolsTable />
      </PageSection>
    </AcmPageContent>
  )
}

export function NodesPoolsTable() {
  const { t } = useTranslation()
  const { cluster } = useContext(ClusterContext)
  const { isSearchAvailable } = useContext(PluginContext)

  const nodes: NodeInfo[] = cluster?.nodes?.nodeList!

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
      const memory = quantityToScalar(node.capacity!.memory)
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
    return scalarToQuantity(memory)
  }

  const columns: IAcmTableColumn<NodeInfo>[] = [
    {
      header: t('table.name'),
      sort: 'name',
      search: 'name',
      cell: (node: NodeInfo) => {
        const hasOcpConsole = cluster?.distribution?.ocp?.version && cluster.consoleURL
        return hasOcpConsole ? (
          <a href={`${cluster!.consoleURL}/k8s/cluster/nodes/${node.name}`} target="_blank" rel="noreferrer">
            <span style={{ marginRight: '8px' }}>
              <ExternalLinkAltIcon />
            </span>
            {node.name}
          </a>
        ) : isSearchAvailable ? (
          <Link to={`${NavigationPath.resources}?cluster=${cluster!.name!}&kind=node&apiversion=v1&name=${node.name}`}>
            {node.name}
          </Link>
        ) : (
          node.name
        )
      },
    },
    {
      header: t('table.status'),
      sort: (a: NodeInfo, b: NodeInfo) => {
        const aReadyCondition = a.conditions?.find((condition) => condition.type === 'Ready')?.status ?? ''
        const bReadyCondition = b.conditions?.find((condition) => condition.type === 'Ready')?.status ?? ''
        return aReadyCondition.localeCompare(bReadyCondition)
      },
      cell: (node) => {
        const readyCondition = node.conditions?.find((condition) => condition.type === 'Ready')
        let type: StatusType
        switch (readyCondition?.status) {
          case 'True':
            type = StatusType.healthy
            break
          case 'False':
            type = StatusType.danger
            break
          case 'Unknown':
          default:
            type = StatusType.unknown
        }
        const status = getNodeStatusLabel(type, t)
        return <AcmInlineStatus type={type} status={status} />
      },
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
    <>
      <ScaleClusterAlert />
      <AcmTable<NodeInfo>
        items={nodes}
        emptyState={<AcmEmptyState title={t('No nodes found')} message={t('The cluster has no nodes.')} />}
        columns={columns}
        keyFn={keyFn}
        tableActions={[]}
        rowActions={[]}
      />
    </>
  )
}
