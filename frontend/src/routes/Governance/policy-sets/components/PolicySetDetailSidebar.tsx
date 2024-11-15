/* Copyright Contributors to the Open Cluster Management project */

import { ChartDonut, ChartLabel, ChartLegend } from '@patternfly/react-charts'
import {
  Split,
  SplitItem,
  Stack,
  Text,
  TextContent,
  TextVariants,
  ToggleGroup,
  ToggleGroupItem,
} from '@patternfly/react-core'
import { TableGridBreakpoint } from '@patternfly/react-table'
import {
  AcmEmptyState,
  AcmLabels,
  AcmTable,
  colorThemes,
  compareNumbers,
  compareStrings,
} from '../../../../ui-components'
import { TFunction } from 'react-i18next'
import { useCallback, useMemo, useState } from 'react'
import { Link, generatePath } from 'react-router-dom-v5-compat'
import { useRecoilValue, useSharedAtoms } from '../../../../shared-recoil'
import { Trans, useTranslation } from '../../../../lib/acm-i18next'
import { NavigationPath } from '../../../../NavigationPath'
import { Policy, PolicySet } from '../../../../resources'
import { exportObjectString } from '../../../../resources/utils'
import {
  getClustersSummaryForPolicySet,
  getPlacementDecisionsForResource,
  getPolicySetPolicies,
} from '../../common/util'
import { ClusterPolicyViolationIcons2 } from '../../components/ClusterPolicyViolations'
import {
  useClusterViolationSummaryMap,
  usePolicySetClusterPolicyViolationsColumn,
} from '../../overview/ClusterViolationSummary'
import { useAddRemediationPolicies } from '../../common/useCustom'

function renderDonutChart(
  clusterComplianceSummary: { compliant: string[]; nonCompliant: string[]; pending: string[] },
  t: TFunction
) {
  const clusterCompliantCount = clusterComplianceSummary.compliant.length
  const clusterNonCompliantCount = clusterComplianceSummary.nonCompliant.length
  const clusterPendingCount = clusterComplianceSummary.pending.length
  const formattedData = [
    {
      key: clusterNonCompliantCount === 1 ? t('Cluster with policy violations') : t('Clusters with policy violations'),
      value: clusterNonCompliantCount,
    },
    {
      key: clusterPendingCount === 1 ? t('Cluster with pending policies') : t('Clusters with pending policies'),
      value: clusterPendingCount,
    },
    {
      key:
        clusterCompliantCount === 1 ? t('Cluster without policy violations') : t('Clusters without policy violations'),
      value: clusterCompliantCount,
      isPrimary: true,
    },
  ]
  const chartData = formattedData.map((d) => ({ x: d.key, y: d.value }))
  const legendData: Array<{ name?: string; link?: string }> = formattedData.map((d) => ({
    name: `${d.value} ${d.key}`,
  }))

  return (
    <div style={{ height: 230, marginTop: -16, marginBottom: -16 }}>
      <ChartDonut
        ariaTitle={t('Policy cluster violations')}
        ariaDesc={t('Policy cluster violations chart')}
        legendOrientation="vertical"
        legendPosition="right"
        // constrainToVisibleArea={true}
        data={chartData}
        legendComponent={
          <ChartLegend data={legendData} labelComponent={<ChartLabel />} colorScale={colorThemes.criticalLowSuccess} />
        }
        labels={({ datum }) => `${datum.x}: ${datum.y}`}
        padding={{
          right: 300,
        }}
        title={clusterNonCompliantCount.toString()}
        subTitle={t('Violation', { count: clusterNonCompliantCount })}
        width={450}
        colorScale={colorThemes.criticalLowSuccess}
      />
    </div>
  )
}

export function PolicySetDetailSidebar(props: { policySet: PolicySet }) {
  const { policySet } = props
  const { t } = useTranslation()
  const {
    managedClustersState,
    placementBindingsState,
    placementDecisionsState,
    placementRulesState,
    placementsState,
  } = useSharedAtoms()
  const managedClusters = useRecoilValue(managedClustersState)
  const policies = useAddRemediationPolicies()
  const placements = useRecoilValue(placementsState)
  const placementRules = useRecoilValue(placementRulesState)
  const placementBindings = useRecoilValue(placementBindingsState)
  const placementDecisions = useRecoilValue(placementDecisionsState)
  const [type, setType] = useState<'Clusters' | 'Policies'>('Clusters')
  const selectType = (type: 'Clusters' | 'Policies') => {
    setType(type)
  }

  const policySetPolicies = useMemo(() => {
    return getPolicySetPolicies(policies, policySet)
  }, [policySet, policies])

  const { policySetClusters, policySetClusterCompliance } = useMemo(() => {
    const clusterCompliance = getClustersSummaryForPolicySet(
      policySet,
      policies,
      placementDecisions,
      placementBindings,
      [...placements, ...placementRules]
    )
    const psClusterCompliance: {
      compliant: string[]
      nonCompliant: string[]
      pending: string[]
      unknown: string[]
    } = {
      compliant: clusterCompliance.compliant,
      nonCompliant: clusterCompliance.nonCompliant,
      pending: clusterCompliance.pending,
      unknown: clusterCompliance.unknown,
    }
    const psClusters: string[] = [
      ...psClusterCompliance.compliant,
      ...psClusterCompliance.nonCompliant,
      ...psClusterCompliance.pending,
      ...psClusterCompliance.unknown,
    ]

    return {
      policySetClusters: psClusters,
      policySetClusterCompliance: psClusterCompliance,
    }
  }, [policySet, policies, placementDecisions, placementBindings, placementRules, placements])

  const clusterViolationSummaryMap = useClusterViolationSummaryMap(
    policies.filter(
      (policy: Policy) =>
        policy.metadata.namespace === policySet.metadata.namespace &&
        policySetPolicies.find((p) => p.metadata.name === policy.metadata.name)
    )
  )
  const clusterPolicyViolationsColumn = usePolicySetClusterPolicyViolationsColumn(clusterViolationSummaryMap)

  const clusterColumnDefs = useMemo(
    () => [
      {
        header: t('Cluster name'),
        search: (cluster: string) => cluster,
        sort: (a: string, b: string) =>
          /* istanbul ignore next */
          compareStrings(a, b),
        cell: (cluster: string) => (
          <a href={`/multicloud/infrastructure/clusters/details/${cluster}/${cluster}/overview`}>{cluster}</a>
        ),
        exportContent: (cluster: string) => cluster,
      },
      clusterPolicyViolationsColumn,
      {
        header: t('Labels'),
        cell: (cluster: string) => {
          const clusterMatch = managedClusters.find((c) => c.metadata.name === cluster)
          if (clusterMatch && clusterMatch.metadata.labels) {
            const labelKeys = Object.keys(clusterMatch.metadata.labels)
            const collapse =
              [
                'clusterID',
                'installer.name',
                'installer.namespace',
                'name',
                'vendor',
                'managed-by',
                'local-cluster',
                'openshiftVersion',
              ].filter((label) => {
                return labelKeys.includes(label)
              }) ?? []
            /* istanbul ignore next */
            labelKeys.forEach((label) => {
              if (label.includes('open-cluster-management.io')) {
                collapse.push(label)
              }
            })
            return (
              <AcmLabels
                labels={clusterMatch.metadata.labels}
                expandedText={t('Show less')}
                collapsedText={t('show.more', { count: collapse.length })}
                allCollapsedText={t('count.labels', { count: collapse.length })}
                collapse={collapse}
              />
            )
          } else {
            /* istanbul ignore next */
            return '-'
          }
        },
        exportContent: (cluster: string) => {
          const clusterMatch = managedClusters.find((c) => c.metadata.name === cluster)
          if (clusterMatch?.metadata.labels) {
            return exportObjectString(clusterMatch?.metadata.labels)
          }
        },
      },
    ],
    [clusterPolicyViolationsColumn, managedClusters, t]
  )

  const decision = useMemo(
    () =>
      getPlacementDecisionsForResource(policySet, placementDecisions, placementBindings, [
        ...placements,
        ...placementRules,
      ]),
    [policySet, placementDecisions, placementBindings, placements, placementRules]
  )

  const getClusterContext = useCallback(
    (policy: Policy) => {
      return decision.length
        ? policy?.status?.status?.filter((status) => {
            return (decision[0].status?.decisions || []).find(
              (decisionStatus) => decisionStatus.clusterName === status.clustername
            )
          })
        : []
    },
    [decision]
  )

  const policyColumnDefs = useMemo(
    () => [
      {
        header: t('Policy name'),
        search: (policy: Policy) => policy.metadata.name ?? '',
        sort: (policyA: Policy, policyB: Policy) =>
          /* istanbul ignore next */
          compareStrings(policyA.metadata.name, policyB.metadata.name),
        cell: (policy: Policy) => {
          return (
            <Link
              to={generatePath(NavigationPath.policyDetails, {
                namespace: policy.metadata.namespace ?? '',
                name: policy.metadata.name ?? '',
              })}
            >
              {policy.metadata.name}
            </Link>
          )
        },
        exportContent: (policy: Policy) => policy.metadata.name ?? '',
      },
      {
        header: t('Cluster violations'),
        sort: (policyA: Policy, policyB: Policy) => {
          // Find the clusters in context of the PolicySet
          const policySetClusterContextA = getClusterContext(policyA)
          // Find the clusters in context of the PolicySet
          const policySetClusterContextB = getClusterContext(policyB)
          const violationACount =
            policySetClusterContextA?.filter((status) => status.compliant === 'NonCompliant').length ?? 0
          const violationBCount =
            policySetClusterContextB?.filter((status) => status.compliant === 'NonCompliant').length ?? 0
          return compareNumbers(violationACount, violationBCount)
        },
        cell: (currentPolicy: Policy) => {
          // Find the clusters in context of the PolicySet
          const policySetClusterContext = getClusterContext(currentPolicy)
          const violationCount =
            policySetClusterContext?.filter((status) => status.compliant === 'NonCompliant').length ?? 0
          const compliantCount =
            policySetClusterContext?.filter((status) => status.compliant === 'Compliant').length ?? 0
          const pendingCount = policySetClusterContext?.filter((status) => status.compliant === 'Pending').length ?? 0
          const unknownCount = policySetClusterContext?.filter((status) => !status.compliant).length ?? 0
          if (violationCount !== 0 || compliantCount !== 0 || pendingCount != 0 || unknownCount !== 0) {
            return (
              <ClusterPolicyViolationIcons2
                compliant={compliantCount}
                compliantHref={`/multicloud/governance/policies/details/${currentPolicy?.metadata.namespace}/${currentPolicy?.metadata.name}/results`}
                noncompliant={violationCount}
                violationHref={`/multicloud/governance/policies/details/${currentPolicy?.metadata.namespace}/${currentPolicy?.metadata.name}/results`}
                pending={pendingCount}
                pendingHref={`/multicloud/governance/policies/details/${currentPolicy?.metadata.namespace}/${currentPolicy?.metadata.name}/results`}
                unknown={unknownCount}
              />
            )
          }
          return '-'
        },
        exportContent: (policy: Policy) => {
          const policySetClusterContext = getClusterContext(policy)
          const violationCount =
            policySetClusterContext?.filter((status) => status.compliant === 'NonCompliant').length ?? 0
          const compliantCount =
            policySetClusterContext?.filter((status) => status.compliant === 'Compliant').length ?? 0
          const pendingCount = policySetClusterContext?.filter((status) => status.compliant === 'Pending').length ?? 0
          const unknownCount = policySetClusterContext?.filter((status) => !status.compliant).length ?? 0
          return `${t('no violations: {{count}} cluster', { count: compliantCount })}, ${t('violations: {{count}} cluster', { count: violationCount })}, ${t('pending: {{count}} cluster', { count: pendingCount })}, ${t('unknown: {{count}} cluster', { count: unknownCount })}`
        },
      },
      {
        header: t('Status'),
        sort: (policyA: Policy, policyB: Policy) => {
          const statusA = policyA?.spec.disabled === true ? t('Disabled') : t('Enabled')
          const statusB = policyB?.spec.disabled === true ? t('Disabled') : t('Enabled')
          return compareStrings(statusA, statusB)
        },
        cell: (policy: Policy) => {
          return <span>{policy?.spec.disabled === true ? t('Disabled') : t('Enabled')}</span>
        },
        exportContent: (policy: Policy) => {
          return policy?.spec.disabled === true ? t('Disabled') : t('Enabled')
        },
      },
      {
        header: t('Remediation'),
        sort: (policyA: Policy, policyB: Policy) => {
          const policyARemediation = policyA.remediationResult
          const policyBRemediation = policyB.remediationResult
          return compareStrings(policyARemediation, policyBRemediation)
        },
        cell: (policy: Policy) => {
          return policy.remediationResult
        },
        exportContent: (policy: Policy) => {
          return policy.remediationResult
        },
      },
    ],
    [getClusterContext, t]
  )

  return (
    <Stack hasGutter>
      <TextContent>
        <Text component={TextVariants.p}>
          <Split hasGutter>
            <SplitItem>
              <Trans
                i18nKey="policyset.details.sidebar.cluster.count"
                values={{
                  count: policySetClusters.length,
                }}
                components={{ bold: <strong /> }}
              />
            </SplitItem>
            <SplitItem>
              <Trans
                i18nKey="policyset.details.sidebar.policy.count"
                values={{
                  count: policySetPolicies.length,
                }}
                components={{ bold: <strong /> }}
              />
            </SplitItem>
          </Split>
        </Text>
        <Text component={TextVariants.p}>{policySet.spec.description}</Text>
      </TextContent>
      <div>{policySetClusters.length > 0 && renderDonutChart(policySetClusterCompliance, t)}</div>
      <Split>
        <SplitItem isFilled />
        <ToggleGroup>
          <ToggleGroupItem
            text={t('Clusters')}
            buttonId="clusters"
            isSelected={type === 'Clusters'}
            onChange={() => selectType('Clusters')}
          />
          <ToggleGroupItem
            text={t('Policies')}
            buttonId="policies"
            isSelected={type === 'Policies'}
            onChange={() => selectType('Policies')}
          />
        </ToggleGroup>
      </Split>
      {type === 'Clusters' ? (
        <AcmTable<string>
          showExportButton
          exportFilePrefix={`${policySet.metadata.name}-clusterdetails`}
          items={policySetClusters}
          emptyState={
            <AcmEmptyState
              title={t('No clusters found')}
              message={t('None of the policies in the policy set have been placed on a cluster.')}
            />
          }
          initialSort={{
            index: 1, // default to sorting by violation count
            direction: 'desc',
          }}
          columns={clusterColumnDefs}
          keyFn={(item: string) => item}
          tableActions={[]}
          rowActions={[]}
          gridBreakPoint={TableGridBreakpoint.none}
          autoHidePagination={true}
          searchPlaceholder={t('Find by name')}
        />
      ) : (
        <AcmTable<Policy>
          showExportButton
          exportFilePrefix={`${policySet.metadata.name}-policiesdetails`}
          items={policySetPolicies}
          emptyState={
            <AcmEmptyState title={t('No polices found')} message={t('There are no policies in the policy set.')} />
          }
          initialSort={{
            index: 1, // default to sorting by violation count
            direction: 'desc',
          }}
          columns={policyColumnDefs}
          keyFn={(item: Policy) => item.metadata.uid ?? ''}
          tableActions={[]}
          rowActions={[]}
          gridBreakPoint={TableGridBreakpoint.none}
          autoHidePagination={true}
          searchPlaceholder={t('Find by name')}
        />
      )}
    </Stack>
  )
}
