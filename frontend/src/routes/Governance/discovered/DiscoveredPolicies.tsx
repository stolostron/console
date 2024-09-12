/* Copyright Contributors to the Open Cluster Management project */
import { EmptyState, EmptyStateIcon, PageSection, Spinner, Title } from '@patternfly/react-core'
import { AcmEmptyState, compareStrings, ITableFilter, IAcmTableColumn, AcmAlert } from '../../../ui-components'
import { DiscoverdPolicyTableItem, ISourceType, useFetchPolicies } from './useFetchPolicies'
import { useTranslation } from '../../../lib/acm-i18next'
import { useMemo } from 'react'
import { Link, generatePath } from 'react-router-dom-v5-compat'
import { getEngineString, getEngineWithSvg } from '../common/util'
import { NavigationPath } from '../../../NavigationPath'
import { discoveredSourceCell, policyViolationSummary, severityCell } from './ByCluster/common'
import { ClusterPolicyViolationIcons2 } from '../components/ClusterPolicyViolations'
import { AcmTableWithEngine } from '../common/AcmTableWithEngine'
import { uniq } from 'lodash'

interface ISourceFilter {
  label: string
  value: string
}

export const getSourceFilter = (data: DiscoverdPolicyTableItem[]): ISourceFilter[] => {
  const uniqMap: { [key: string]: ISourceType } = {}
  data?.forEach((data: DiscoverdPolicyTableItem) => {
    if (data.source?.type) {
      const key = data.source.type + data.source.parentName + data.source.parentNs
      uniqMap[key] = data.source
    }
  })

  const result: ISourceFilter[] = []

  for (const key in uniqMap) {
    const source = uniqMap[key]
    if (source.type.toLowerCase() === 'policy') {
      const nsName = source.parentNs + '.' + source.parentName
      result.push({ label: nsName, value: nsName })
    } else if (source.type) {
      result.push({ label: source.type, value: source.type })
    }
  }

  return result
}

export default function DiscoveredPolicies() {
  const { isFetching, data, err } = useFetchPolicies()
  const { t } = useTranslation()

  const discoveredPoliciesCols = useMemo<IAcmTableColumn<DiscoverdPolicyTableItem>[]>(
    () => [
      {
        header: t('Name'),
        cell: (item: DiscoverdPolicyTableItem) => (
          <Link
            to={generatePath(NavigationPath.discoveredByCluster, {
              kind: item.kind,
              policyName: item.name,
              apiGroup: item.policies[0].apigroup,
              apiVersion: item.policies[0].apiversion,
              policyNamespace: item.policies[0].cluster,
            })}
            state={{
              from: NavigationPath.policies,
            }}
          >
            {item.name}
          </Link>
        ),
        // Policy name
        sort: 'name',
        search: 'name',
        id: 'name',
        exportContent: (item) => item.name,
      },
      {
        header: t('Engine'),
        cell: (item: DiscoverdPolicyTableItem) => getEngineWithSvg(item.kind),
        sort: (a: DiscoverdPolicyTableItem, b: DiscoverdPolicyTableItem) =>
          compareStrings(getEngineString(a.kind), getEngineString(b.kind)),
        search: (item: DiscoverdPolicyTableItem) => getEngineString(item.kind),
        id: 'engine',
        exportContent: (item: DiscoverdPolicyTableItem) => getEngineString(item.kind),
      },
      {
        header: t('Kind'),
        cell: 'kind',
        sort: 'kind',
        search: 'kind',
        id: 'kind',
        exportContent: (item: DiscoverdPolicyTableItem) => item.kind,
      },
      {
        header: t('Response action'),
        cell: 'responseAction',
        sort: 'responseAction',
        search: 'responseAction',
        id: 'responseAction',
        tooltip: t('discoveredPolicies.tooltip.responseAction'),
        exportContent: (item: DiscoverdPolicyTableItem) => item.responseAction,
      },
      {
        header: t('Severity'),
        // TODO Add severity icon
        cell: severityCell,
        sort: 'severity',
        search: 'severity',
        id: 'severity',
        exportContent: (item) => item.severity,
      },
      {
        header: t('Cluster violations'),
        cell: (item: DiscoverdPolicyTableItem) => {
          const { noncompliant, compliant, pending, unknown } = policyViolationSummary(item.policies)
          const path = generatePath(NavigationPath.discoveredByCluster, {
            apiGroup: item.policies[0].apigroup,
            apiVersion: item.policies[0].apiversion,
            kind: item.kind,
            policyName: item.name,
            policyNamespace: item.policies[0].cluster,
          })
          if (noncompliant !== 0 || compliant !== 0 || pending != 0 || unknown !== 0) {
            return (
              <ClusterPolicyViolationIcons2
                compliant={compliant}
                compliantHref={path}
                noncompliant={noncompliant}
                violationHref={path}
                pending={pending}
                pendingHref={path}
                unknown={unknown}
              />
            )
          }
          return '-'
        },
        tooltip: t('discoveredPolicies.tooltip.clusterViolation'),
        sort: 'violations',
        search: 'violations',
        id: 'violations',
        exportContent: (item: DiscoverdPolicyTableItem) => {
          const { noncompliant, compliant, pending, unknown } = policyViolationSummary(item.policies)
          return `${t('no violations: {{count}} cluster', { count: compliant })}, ${t('violations: {{count}} cluster', { count: noncompliant })}, ${t('pending: {{count}} cluster', { count: pending })}, ${t('unknown: {{count}} cluster', { count: unknown })}`
        },
      },
      {
        header: t('Source'),
        cell: (item: DiscoverdPolicyTableItem) => discoveredSourceCell(t, item.source),
        sort: (a: DiscoverdPolicyTableItem, b: DiscoverdPolicyTableItem) =>
          compareStrings(a.source?.type, b.source?.type),
        search: (item: DiscoverdPolicyTableItem) => item.source?.type ?? '',
        id: 'source',
        exportContent: (item) => item?.source?.type ?? '-',
      },
    ],
    [t]
  )

  const filters = useMemo<ITableFilter<DiscoverdPolicyTableItem>[]>(
    () => [
      {
        id: 'violations',
        label: 'Cluster violations',
        options: [
          {
            label: t('No violations'),
            value: 'no-violations',
          },
          {
            label: t('Violations'),
            value: 'violations',
          },
        ],
        tableFilterFn: (selectedValues, item) => {
          const { noncompliant, compliant, unknown, pending } = policyViolationSummary(item.policies)

          const total = noncompliant + compliant + unknown + pending

          if (selectedValues.includes('no-violations') && total == compliant) {
            return true
          } else if (selectedValues.includes('violations') && noncompliant > 0) return true
          return false
        },
      },
      {
        id: 'kind',
        label: t('Kind'),
        options: uniq(data?.map((d) => d.kind)).map((kind: string) => ({ label: kind, value: kind })),
        tableFilterFn: (selectedValues, item) => {
          return selectedValues.includes(item.kind)
        },
      },
      {
        id: 'responseAction',
        label: t('Response action'),
        options: [
          { label: t('Inform'), value: 'inform' },
          { label: t('Enforce'), value: 'enforce' },
          { label: t('Inform/Enforce'), value: 'inform/enforce' },
        ],
        tableFilterFn: (selectedValues, item) => {
          return selectedValues.includes(item.responseAction)
        },
      },
      {
        id: 'Source',
        label: t('Source'),
        options: data ? getSourceFilter(data) : [],
        tableFilterFn: (selectedValues, item) => {
          if (item.source?.type.toLowerCase() === 'policy') {
            return selectedValues.includes(item.source.parentNs + '.' + item.source.parentName)
          }

          return item.source?.type ? selectedValues.includes(item.source?.type) : false
        },
      },
    ],
    [data, t]
  )

  if (isFetching) {
    return (
      <PageSection>
        <EmptyState>
          <EmptyStateIcon variant="container" component={Spinner} />
          <Title size="lg" headingLevel="h4">
            Loading
          </Title>
        </EmptyState>
      </PageSection>
    )
  }

  return (
    <PageSection>
      <AcmTableWithEngine<DiscoverdPolicyTableItem>
        id="discoveredPolicyTable"
        columns={discoveredPoliciesCols}
        keyFn={(item) => item.id}
        items={data}
        emptyState={<AcmEmptyState title={t(`You don't have any policies`)} message={t('There are no policies')} />}
        filters={filters}
        showExportButton
        exportFilePrefix="discoveredPolicies"
      />
      {err ? (
        <AcmAlert data-testid={'delete-resource-error'} noClose={true} variant={'danger'} title={<>{err.message}</>} />
      ) : null}
    </PageSection>
  )
}
