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
import { AcmLabels, AcmTable, compareNumbers, compareStrings } from '@stolostron/ui-components'
import { TFunction } from 'i18next'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import {
    managedClustersState,
    placementBindingsState,
    placementDecisionsState,
    placementRulesState,
    placementsState,
    usePolicies,
} from '../../../../atoms'
import { useTranslation } from '../../../../lib/acm-i18next'
import { NavigationPath } from '../../../../NavigationPath'
import { Policy, PolicySet } from '../../../../resources'
import { usePolicySetClusterPolicyViolationsColumn } from '../../clusters/useClusterPolicyViolationsColumn'
import { getClustersSummaryForPolicySet, getPolicyComplianceForPolicySet, PolicyCompliance } from '../../common/util'
import { ClusterPolicyViolationIcons2 } from '../../components/ClusterPolicyViolations'
import { useClusterViolationSummaryMap } from '../../overview/ClusterViolationSummary'

function renderDonutChart(clusterComplianceSummary: { compliant: string[]; nonCompliant: string[] }, t: TFunction) {
    const clusterCompliantCount = clusterComplianceSummary.compliant.length
    const clusterNonCompliantCount = clusterComplianceSummary.nonCompliant.length
    const formattedData = [
        {
            key:
                clusterCompliantCount === 1
                    ? t('Cluster without policy violations')
                    : t('Clusters without policy violations'),
            value: clusterCompliantCount,
            isPrimary: true,
        },
        {
            key:
                clusterNonCompliantCount === 1
                    ? t('Cluster with policy violations')
                    : t('Clusters with policy violations'),
            value: clusterNonCompliantCount,
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
                    <ChartLegend
                        data={legendData}
                        labelComponent={<ChartLabel />}
                        colorScale={['var(--pf-global--success-color--100)', 'var(--pf-global--danger-color--100)']}
                    />
                }
                labels={({ datum }) => `${datum.x}: ${datum.y}`}
                padding={{
                    right: 300,
                }}
                title={`${((clusterCompliantCount / (clusterCompliantCount + clusterNonCompliantCount)) * 100).toFixed(
                    0
                )}%`}
                width={450}
                colorScale={['var(--pf-global--success-color--100)', 'var(--pf-global--danger-color--100)']}
            />
        </div>
    )
}

export function PolicySetDetailSidebar(props: { policySet: PolicySet }) {
    const { policySet } = props
    const { t } = useTranslation()
    const [managedClusters] = useRecoilState(managedClustersState)
    const policies = usePolicies()
    const [placements] = useRecoilState(placementsState)
    const [placementRules] = useRecoilState(placementRulesState)
    const [placementBindings] = useRecoilState(placementBindingsState)
    const [placementDecisions] = useRecoilState(placementDecisionsState)
    const [type, setType] = useState<'Clusters' | 'Policies'>('Clusters')
    const selectType = (type: 'Clusters' | 'Policies') => {
        setType(type)
    }

    const { policySetClusters, policySetClusterCompliance, policySetPolicies } = useMemo(() => {
        const placementRuleClusterCompliance = getClustersSummaryForPolicySet(
            policySet,
            policies,
            placementDecisions,
            placementBindings,
            placementRules
        )
        const placementClusterCompliance = getClustersSummaryForPolicySet(
            policySet,
            policies,
            placementDecisions,
            placementBindings,
            placements
        )

        const placementRulePolicyCompliance = getPolicyComplianceForPolicySet(
            policySet,
            policies,
            placementDecisions,
            placementBindings,
            placementRules
        )
        const placementPolicyCompliance = getPolicyComplianceForPolicySet(
            policySet,
            policies,
            placementDecisions,
            placementBindings,
            placements
        )

        const psClusterCompliance: {
            compliant: string[]
            nonCompliant: string[]
        } = {
            compliant: [...placementRuleClusterCompliance.compliant, ...placementClusterCompliance.compliant],
            nonCompliant: [...placementRuleClusterCompliance.nonCompliant, ...placementClusterCompliance.nonCompliant],
        }
        const psClusters: string[] = [...psClusterCompliance.compliant, ...psClusterCompliance.nonCompliant]
        const psPolicies: PolicyCompliance[] = [...placementRulePolicyCompliance, ...placementPolicyCompliance]

        return {
            policySetClusters: psClusters,
            policySetClusterCompliance: psClusterCompliance,
            policySetPolicies: psPolicies,
        }
    }, [policySet, policies, placementDecisions, placementBindings, placementRules, placements])

    const clusterViolationSummaryMap = useClusterViolationSummaryMap(
        policies.filter(
            (policy: Policy) =>
                policy.metadata.namespace === policySet.metadata.namespace &&
                policySetPolicies.find((p) => p.policyName === policy.metadata.name)
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
                    <a href={`/multicloud/infrastructure/clusters/details/${cluster}/overview`}>{cluster}</a>
                ),
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
                                expandedText={t('show.less')}
                                collapsedText={t('show.more', { number: collapse.length })}
                                allCollapsedText={t('count.labels', { number: collapse.length })}
                                collapse={collapse}
                            />
                        )
                    } else {
                        /* istanbul ignore next */
                        return '-'
                    }
                },
            },
        ],
        [clusterPolicyViolationsColumn, managedClusters, t]
    )

    const policyColumnDefs = useMemo(
        () => [
            {
                header: t('Policy name'),
                search: (policy: PolicyCompliance) => policy.policyName,
                sort: (a: PolicyCompliance, b: PolicyCompliance) =>
                    /* istanbul ignore next */
                    compareStrings(a.policyName, b.policyName),
                cell: (policy: PolicyCompliance) => {
                    return (
                        <Link
                            to={{
                                pathname: NavigationPath.policyDetails
                                    .replace(':namespace', policy.policyNamespace)
                                    .replace(':name', policy.policyName),
                            }}
                        >
                            {policy.policyName}
                        </Link>
                    )
                },
            },
            {
                header: t('Cluster violation'),
                sort: (a: PolicyCompliance, b: PolicyCompliance) => {
                    let violationCountA = 0
                    let violationCountB = 0
                    a?.clusterCompliance?.forEach((c) => {
                        if (c.compliance === 'NonCompliant') {
                            violationCountA++
                        }
                    })
                    b?.clusterCompliance?.forEach((c) => {
                        if (c.compliance === 'NonCompliant') {
                            violationCountB++
                        }
                    })
                    return compareNumbers(violationCountA, violationCountB)
                },
                cell: (policy: PolicyCompliance) => {
                    let violationCount = 0
                    // Get total count of cluster violations for a specific policy
                    const hasCompliance = policy?.clusterCompliance?.filter((cluster) => cluster.compliance) ?? []
                    if (hasCompliance.length > 0) {
                        const currentPolicy = policies.find((p: Policy) => p.metadata.name === policy.policyName)
                        hasCompliance.forEach((c) => {
                            if (c.compliance === 'NonCompliant') {
                                violationCount++
                            }
                        })
                        return (
                            <ClusterPolicyViolationIcons2
                                compliant={hasCompliance.length - violationCount}
                                compliantHref={`/multicloud/governance/policies/details/${currentPolicy?.metadata.namespace}/${currentPolicy?.metadata.name}/results`}
                                noncompliant={violationCount}
                                violationHref={`/multicloud/governance/policies/details/${currentPolicy?.metadata.namespace}/${currentPolicy?.metadata.name}/results`}
                            />
                        )
                    }
                    return '-'
                },
            },
            {
                header: t('Status'),
                sort: (itemA: PolicyCompliance, itemB: PolicyCompliance) => {
                    const policyA = policies.find((p: Policy) => p.metadata.name === itemA.policyName)
                    const policyB = policies.find((p: Policy) => p.metadata.name === itemB.policyName)
                    const statusA = policyA?.spec.disabled === true ? t('Disabled') : t('Enabled')
                    const statusB = policyB?.spec.disabled === true ? t('Disabled') : t('Enabled')
                    return compareStrings(statusA, statusB)
                },
                cell: (policyStatus: PolicyCompliance) => {
                    const policy = policies.find((p: Policy) => p.metadata.name === policyStatus.policyName)
                    return <span>{policy?.spec.disabled === true ? t('Disabled') : t('Enabled')}</span>
                },
            },
            {
                header: t('Remediation'),
                sort: (a: PolicyCompliance, b: PolicyCompliance) => {
                    const policyA = policies.find((p: Policy) => p.metadata.name === a.policyName)
                    const policyB = policies.find((p: Policy) => p.metadata.name === b.policyName)
                    /* istanbul ignore next */
                    return compareStrings(policyA?.spec.remediationAction, policyB?.spec.remediationAction)
                },
                cell: (policyStatus: PolicyCompliance) => {
                    const policy = policies.find((p: Policy) => p.metadata.name === policyStatus.policyName)
                    return policy?.spec.remediationAction ?? '-'
                },
            },
        ],
        [policies, t]
    )

    return (
        <Stack hasGutter>
            <TextContent>
                <Text component={TextVariants.p}>
                    <Split hasGutter>
                        <SplitItem>
                            <strong>{policySetClusters.length}</strong>&nbsp; clusters
                        </SplitItem>
                        <SplitItem>
                            <strong>{policySet.spec.policies.length ?? 0}</strong>&nbsp; policies
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
                    plural="Clusters"
                    items={policySetClusters}
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
                <AcmTable<PolicyCompliance>
                    plural="Policies"
                    items={policySetPolicies}
                    initialSort={{
                        index: 0, // default to sorting by violation count
                        direction: 'desc',
                    }}
                    columns={policyColumnDefs}
                    keyFn={(item: PolicyCompliance) => item.policyName}
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
