/* Copyright Contributors to the Open Cluster Management project */
import { EmptyState, EmptyStateIcon, PageSection, Spinner, EmptyStateHeader } from '@patternfly/react-core'
import {
  AcmEmptyState,
  compareStrings,
  ITableFilter,
  IAcmTableColumn,
  AcmAlert,
  AcmTable,
  AcmLabels,
} from '../../../ui-components'
import { DiscoverdPolicyTableItem, useFetchPolicies } from './useFetchPolicies'
import { useTranslation } from '../../../lib/acm-i18next'
import { ReactNode, useMemo } from 'react'
import { Link, generatePath } from 'react-router-dom-v5-compat'
import { getEngineString, getEngineWithSvg } from '../common/util'
import { NavigationPath } from '../../../NavigationPath'
import {
  discoveredSourceCell,
  getResponseActionFilter,
  getSeverityFilter,
  getSourceExportCSV,
  getSourceFilterOptions,
  policyViolationSummary,
  responseActionCell,
  severityCell,
} from './ByCluster/common'
import { ClusterPolicyViolationIcons2 } from '../components/ClusterPolicyViolations'
import { exportObjectString, filterLabelFn } from '../../../resources/utils'
import { isEqual } from 'lodash'

function nameCell(item: DiscoverdPolicyTableItem): ReactNode {
  return (
    <Link
      to={generatePath(NavigationPath.discoveredByCluster, {
        kind: item.kind,
        policyName: item.name,
        apiGroup: item.policies[0].apigroup,
        apiVersion: item.policies[0].apiversion,
      })}
      state={{
        from: NavigationPath.policies,
      }}
    >
      {item.name}
    </Link>
  )
}

function clusterCell(item: DiscoverdPolicyTableItem): ReactNode | string {
  const { noncompliant, compliant, pending, unknown } = policyViolationSummary(item.policies)
  const path = generatePath(NavigationPath.discoveredByCluster, {
    apiGroup: item.policies[0].apigroup,
    apiVersion: item.policies[0].apiversion,
    kind: item.kind,
    policyName: item.name,
  })
  if (noncompliant !== 0 || compliant !== 0 || pending !== 0 || unknown !== 0) {
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
}

function labelsCell(
  item: DiscoverdPolicyTableItem,
  labelMap: Record<string, { pairs?: Record<string, string>; labels?: string[] }> | undefined
): ReactNode | string {
  const labels = labelMap?.[item.id]?.pairs
  return <AcmLabels labels={labels} isCompact={true} />
}

export default function DiscoveredPolicies() {
  const { isFetching, data, labelData, err } = useFetchPolicies()
  const { labelOptions, labelMap } = labelData || {}
  const { t } = useTranslation()

  const discoveredPoliciesCols = useMemo<IAcmTableColumn<DiscoverdPolicyTableItem>[]>(
    () => [
      {
        header: t('Name'),
        cell: nameCell,
        // Policy name
        sort: 'name',
        search: 'name',
        id: 'name',
        exportContent: (item) => item.name,
      },
      {
        header: t('Engine'),
        cell: (item: DiscoverdPolicyTableItem) => getEngineWithSvg(item.apigroup),
        sort: (a: DiscoverdPolicyTableItem, b: DiscoverdPolicyTableItem) =>
          compareStrings(getEngineString(a.apigroup), getEngineString(b.apigroup)),
        search: (item: DiscoverdPolicyTableItem) => getEngineString(item.apigroup),
        id: 'engine',
        exportContent: (item: DiscoverdPolicyTableItem) => getEngineString(item.apigroup),
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
        header: t('table.labels'),
        cell: (item: DiscoverdPolicyTableItem) => labelsCell(item, labelMap),
        exportContent: (item: DiscoverdPolicyTableItem) => {
          return exportObjectString(labelMap ? labelMap[item.id]?.pairs : {})
        },
      },
      {
        header: t('Response action'),
        cell: responseActionCell,
        sort: 'responseAction',
        search: 'responseAction',
        id: 'responseAction',
        tooltip: t('discoveredPolicies.tooltip.responseAction'),
        exportContent: (item: DiscoverdPolicyTableItem) => item.responseAction ?? '-',
      },
      {
        header: t('Severity'),
        cell: severityCell,
        sort: 'severity',
        search: 'severity',
        id: 'severity',
        tooltip: t('discoveredPolicies.tooltip.severity'),
        exportContent: (item) => item.severity,
      },
      {
        header: t('Cluster violations'),
        cell: clusterCell,
        tooltip: t('discoveredPolicies.tooltip.clusterViolation'),
        sort: (a: DiscoverdPolicyTableItem, b: DiscoverdPolicyTableItem) => {
          const aViolation = policyViolationSummary(a.policies)
          const bViolation = policyViolationSummary(b.policies)
          if (isEqual(aViolation, bViolation)) return 0
          if (aViolation.noncompliant > bViolation.noncompliant) return -1
          if (aViolation.noncompliant < bViolation.noncompliant) return 1
          if (aViolation.compliant > bViolation.compliant) return -1
          if (aViolation.compliant < bViolation.compliant) return 1

          return 0
        },
        search: 'violations',
        id: 'violations',
        exportContent: (item: DiscoverdPolicyTableItem) => {
          const { noncompliant, compliant, pending, unknown } = policyViolationSummary(item.policies)
          return `${t('no violations: {{count}} cluster', { count: compliant })}, ${t('violations: {{count}} cluster', { count: noncompliant })}, ${t('pending: {{count}} cluster', { count: pending })}, ${t('unknown: {{count}} cluster', { count: unknown })}`
        },
      },
      {
        header: t('Source'),
        cell: (item: DiscoverdPolicyTableItem) => (
          <div
            style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            title={item.source?.type ?? ''}
          >
            {discoveredSourceCell(t, item.source)}
          </div>
        ),
        sort: (a: DiscoverdPolicyTableItem, b: DiscoverdPolicyTableItem) =>
          compareStrings(a.source?.type, b.source?.type),
        search: (item: DiscoverdPolicyTableItem) => item.source?.type ?? '',
        id: 'source',
        exportContent: getSourceExportCSV,
      },
    ],
    [labelMap, t]
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
          {
            label: t('No status'),
            value: '-',
          },
        ],
        tableFilterFn: (selectedValues, item) => {
          // For items with no violations
          if (selectedValues.includes('-') && clusterCell(item) === '-') return true

          const { noncompliant, compliant, unknown, pending } = policyViolationSummary(item.policies)
          const total = noncompliant + compliant + unknown + pending

          // This applies to cases where a violation is not specified, such as with "vapb"
          if (noncompliant == 0 && compliant == 0 && unknown == 0 && pending == 0) return false
          if (selectedValues.includes('no-violations') && total == compliant) {
            return true
          } else if (selectedValues.includes('violations') && noncompliant > 0) return true
          return false
        },
      },
      {
        id: 'kind',
        label: t('Kind'),
        options: [
          { label: 'CertificatePolicy', value: 'CertificatePolicy' },
          { label: 'ConfigurationPolicy', value: 'ConfigurationPolicy' },
          { label: 'Gatekeeper constraint', value: 'Gatekeeper' },
          { label: 'Gatekeeper mutations', value: 'Gatekeeper Mutations' },
          { label: 'OperatorPolicy', value: 'OperatorPolicy' },
          { label: 'ValidatingAdmissionPolicyBinding', value: 'ValidatingAdmissionPolicyBinding' },
          { label: 'Kyverno ClusterPolicy', value: 'ClusterPolicy' },
          { label: 'Kyverno Policy', value: 'Policy' },
        ],
        tableFilterFn: (selectedValues, item) => {
          if (item.apigroup === 'constraints.gatekeeper.sh') {
            return selectedValues.includes('Gatekeeper')
          }

          if (item.apigroup === 'mutations.gatekeeper.sh') {
            return selectedValues.includes('Gatekeeper Mutations')
          }

          if (item.apigroup === 'kyverno.io') {
            if (selectedValues.includes('ClusterPolicy') && item.kind === 'ClusterPolicy') {
              return true
            }
            if (selectedValues.includes('Policy') && item.kind === 'Policy') {
              return true
            }
          }

          return selectedValues.includes(item.kind)
        },
      },
      getResponseActionFilter(t),
      getSeverityFilter(t),
      {
        id: 'label',
        label: t('Label'),
        options: labelOptions || [],
        supportsInequality: true, // table will allow user to convert filtered values to a=b or a!=b
        tableFilterFn: (selectedValues, item) => filterLabelFn(selectedValues, item, labelMap),
      },
      {
        id: 'source',
        label: t('Source'),
        options: data ? getSourceFilterOptions(data) : [],
        tableFilterFn: (selectedValues, item) => {
          return item.source?.type ? selectedValues.includes(item.source?.type) : false
        },
      },
    ],
    [data, labelMap, labelOptions, t]
  )

  if (isFetching) {
    return (
      <PageSection>
        <EmptyState>
          <EmptyStateHeader titleText={t('Loading')} icon={<EmptyStateIcon icon={Spinner} />} headingLevel="h4" />
        </EmptyState>
      </PageSection>
    )
  }

  return (
    <PageSection>
      <AcmTable<DiscoverdPolicyTableItem>
        id="discoveredPolicyTable"
        columns={discoveredPoliciesCols}
        keyFn={(item) => item.id}
        items={data}
        emptyState={<AcmEmptyState title={t(`You don't have any policies.`)} message={t('There are no policies.')} />}
        filters={filters}
        secondaryFilterIds={['label']}
        showExportButton
        exportFilePrefix="discoveredPolicies"
      />
      {err ? (
        <AcmAlert data-testid={'delete-resource-error'} noClose={true} variant={'danger'} title={<>{err.message}</>} />
      ) : null}
    </PageSection>
  )
}
