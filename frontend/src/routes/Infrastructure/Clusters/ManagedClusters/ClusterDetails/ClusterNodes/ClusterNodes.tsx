/* Copyright Contributors to the Open Cluster Management project */

import { PageSection } from '@patternfly/react-core'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { ReactNode, useCallback, useContext, useMemo } from 'react'
import { Link } from 'react-router-dom-v5-compat'
import { ObservabilityEndpoint, useMetricsPoll } from '~/lib/useMetricsPoll'
import { useRecoilValue, useSharedAtoms } from '~/shared-recoil'
import { useTranslation } from '../../../../../../lib/acm-i18next'
import { PluginContext } from '../../../../../../lib/PluginContext'
import { quantityToScalar, scalarToQuantity } from '../../../../../../lib/units'
import { NavigationPath } from '../../../../../../NavigationPath'
import { getRoles, NodeInfo } from '../../../../../../resources'
import {
  AcmButton,
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
import { useClusterDetailsContext } from '../ClusterDetails'

function getNodeLabelValue(node: NodeInfo, label: string | string[]) {
  // find first label present if given an array, or just use single label provided
  const preferredLabel = Array.isArray(label) ? label.find((label) => node.labels?.[label]) : label
  return preferredLabel ? node.labels?.[preferredLabel] ?? '' : ''
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
  } catch {
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
      <PageSection hasBodyWrapper={false}>
        <NodesPoolsTable />
      </PageSection>
    </AcmPageContent>
  )
}

export function NodesPoolsTable() {
  const { t } = useTranslation()
  const { cluster } = useClusterDetailsContext()
  const { isSearchAvailable } = useContext(PluginContext)
  const { clusterManagementAddonsState, useIsObservabilityInstalled } = useSharedAtoms()
  const isObservabilityInstalled = useIsObservabilityInstalled()
  const clusterManagementAddons = useRecoilValue(clusterManagementAddonsState)
  const obsCont = clusterManagementAddons.find((cma) => cma.metadata.name === 'observability-controller')
  let grafanaLink: string | undefined
  try {
    const rawLink = obsCont?.metadata?.annotations?.['console.open-cluster-management.io/launch-link']
    grafanaLink = rawLink ? new URL(rawLink).origin : undefined
  } catch {
    grafanaLink = undefined
  }
  // accelerator_card_info metric link for all managed cluster GPU data
  const observabilityLink = `${grafanaLink}/explore?schemaVersion=1&panes={"jjq":{"queries":[{"expr":"accelerator_card_info"}]}}&orgId=1`
  const nodes: NodeInfo[] = cluster?.nodes?.nodeList ?? []

  // polling metric every 1min
  const [gpuData, gpuDataError, gpuDataLoading] = useMetricsPoll({
    endpoint: ObservabilityEndpoint.QUERY,
    query: 'accelerator_card_info',
    skip: !isObservabilityInstalled,
  })
  // parse metric and return Record in format: { [nodeID]: 0 }
  const nodeGPUCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    if (isObservabilityInstalled && !gpuDataLoading && !gpuDataError) {
      const resultData = gpuData?.data?.result ?? []
      resultData.forEach((data) => {
        const metricNodeName = data.metric.instance.split(':')[0]
        // increase count by 1 for each gpu metric instance
        counts[metricNodeName] = (counts[metricNodeName] ?? 0) + 1
      })
    }
    return counts
  }, [gpuData?.data?.result, gpuDataError, gpuDataLoading, isObservabilityInstalled])

  const getSearchLink = useCallback(
    (node: NodeInfo) => {
      // if search is unavailable - return the Node name text
      if (!isSearchAvailable) {
        return node.name
      }
      return (
        <Link to={`${NavigationPath.resources}?cluster=${cluster.name!}&kind=node&apiversion=v1&name=${node.name}`}>
          {node.name}
        </Link>
      )
    },
    [cluster.name, isSearchAvailable]
  )

  const columns: IAcmTableColumn<NodeInfo>[] = useMemo(
    () => [
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
      ...(isObservabilityInstalled
        ? [
            {
              header: t('GPU count'),
              sort: (a: NodeInfo, b: NodeInfo) => {
                return compareNumbers(nodeGPUCounts[a?.name ?? ''], nodeGPUCounts[b?.name ?? ''])
              },
              cell: (node: NodeInfo) => nodeGPUCounts[node?.name ?? ''] ?? 0,
              tooltip: (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {t(
                    'The count of GPUs on a Node is gathered from the "accelerator_card_info" metric, which is present only when Red Hat Advanced Cluster Management Observability is installed.'
                  )}
                  {grafanaLink && (
                    <AcmButton
                      variant="link"
                      component="a"
                      target="_blank"
                      isInline={true}
                      href={observabilityLink}
                      icon={<ExternalLinkAltIcon />}
                      iconPosition="right"
                    >
                      {t('Observability metrics')}
                    </AcmButton>
                  )}
                </div>
              ),
            },
          ]
        : []),
    ],
    [cluster, getSearchLink, grafanaLink, isObservabilityInstalled, nodeGPUCounts, observabilityLink, t]
  )
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
