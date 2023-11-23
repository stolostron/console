/* Copyright Contributors to the Open Cluster Management project */

import { PageSection } from '@patternfly/react-core'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { ReactNode, useContext } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from '../../../../../../lib/acm-i18next'
import { PluginContext } from '../../../../../../lib/PluginContext'
import { quantityToScalar, scalarToQuantity } from '../../../../../../lib/units'
import { NavigationPath } from '../../../../../../NavigationPath'
import { NodeInfo } from '../../../../../../resources'
import { useRecoilValue, useSharedAtoms } from '../../../../../../shared-recoil'
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
import { ScaleClusterAlert } from '../../components/ScaleClusterAlert'
import { ClusterContext } from '../ClusterDetails'

function getNodeLabelValue(node: NodeInfo, label: string | string[]) {
  // find first label present if given an array, or just use single label provided
  const preferredLabel = Array.isArray(label) ? label.find((label) => node.labels?.[label]) : label
  return preferredLabel ? node.labels?.[preferredLabel] || '' : ''
}

function getLabelCellFn(label: string | string[]) {
  const labelCellFn = (node: NodeInfo) => {
    return <span>{getNodeLabelValue(node, label)}</span>
  }
  return labelCellFn
}
function getLabelSortFn(label: string | string[]) {
  const labelSortFn = (a: NodeInfo, b: NodeInfo): number => {
    const aValue = getNodeLabelValue(a, label)
    const bValue = getNodeLabelValue(b, label)
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

const REGION_LABELS = ['topology.kubernetes.io/region', 'failure-domain.beta.kubernetes.io/region']
const ZONE_LABELS = ['topology.kubernetes.io/zone', 'failure-domain.beta.kubernetes.io/zone']
const INSTANCE_TYPE_LABELS = ['node.kubernetes.io/instance-type', 'beta.kubernetes.io/instance-type']

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
  const { isGlobalHubState } = useSharedAtoms()
  const isGlobalHub = useRecoilValue(isGlobalHubState)

  const nodes: NodeInfo[] = cluster?.nodes?.nodeList!

  function getSearchLink(node: NodeInfo) {
    return !isGlobalHub && isSearchAvailable ? (
      <Link to={`${NavigationPath.resources}?cluster=${cluster!.name!}&kind=node&apiversion=v1&name=${node.name}`}>
        {node.name}
      </Link>
    ) : (
      node.name
    )
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
        ) : (
          getSearchLink(node)
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
      sort: getLabelSortFn(REGION_LABELS),
      cell: getLabelCellFn(REGION_LABELS),
    },
    {
      header: t('table.zone'),
      sort: getLabelSortFn(ZONE_LABELS),
      cell: getLabelCellFn(ZONE_LABELS),
    },
    {
      header: t('table.instanceType'),
      sort: getLabelSortFn(INSTANCE_TYPE_LABELS),
      cell: getLabelCellFn(INSTANCE_TYPE_LABELS),
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
