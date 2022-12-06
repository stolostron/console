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
import { AcmLabels, AcmTable, colorThemes, compareNumbers, compareStrings } from '../../../../ui-components'
import { TFunction } from 'i18next'
import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useRecoilState, useSharedAtoms } from '../../../../shared-recoil'
import { useTranslation } from '../../../../lib/acm-i18next'
import { NavigationPath } from '../../../../NavigationPath'
import { Policy, PolicySet } from '../../../../resources'
import {
    getClustersSummaryForPolicySet,
    getPlacementDecisionsForResource,
    getPolicyRemediation,
    getPolicySetPolicies,
} from '../../common/util'
import { ClusterPolicyViolationIcons2 } from '../../components/ClusterPolicyViolations'
import {
    useClusterViolationSummaryMap,
    usePolicySetClusterPolicyViolationsColumn,
} from '../../overview/ClusterViolationSummary'

function renderDonutChart(clusterComplianceSummary: { compliant: string[]; nonCompliant: string[] }, t: TFunction) {
    const clusterCompliantCount = clusterComplianceSummary.compliant.length
    const clusterNonCompliantCount = clusterComplianceSummary.nonCompliant.length
    const formattedData = [
        {
            key:
                clusterNonCompliantCount === 1
                    ? t('Cluster with policy violations')
                    : t('Clusters with policy violations'),
            value: clusterNonCompliantCount,
        },
        {
            key:
                clusterCompliantCount === 1
                    ? t('Cluster without policy violations')
                    : t('Clusters without policy violations'),
            value: clusterCompliantCount,
            isPrimary: true,
        },
    ]
    const chartData = formattedData.map((d) => ({ x: d.key, y: d.value }))
    const legendData: Array<{ name?: string; link?: string }> = formattedData.map((d) => ({
        name: `${d.value} ${d.key}`,
    }))

    const donutTitle =
        clusterCompliantCount + clusterNonCompliantCount === 0
            ? '0%'
            : `${((clusterCompliantCount / (clusterCompliantCount + clusterNonCompliantCount)) * 100).toFixed(0)}%`

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
                        colorScale={colorThemes.failureSuccess}
                    />
                }
                labels={({ datum }) => `${datum.x}: ${datum.y}`}
                padding={{
                    right: 300,
                }}
                title={donutTitle}
                width={450}
                colorScale={colorThemes.failureSuccess}
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
        usePolicies,
    } = useSharedAtoms()
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
            unknown: string[]
        } = {
            compliant: clusterCompliance.compliant,
            nonCompliant: clusterCompliance.nonCompliant,
            unknown: clusterCompliance.unknown,
        }
        const psClusters: string[] = [
            ...psClusterCompliance.compliant,
            ...psClusterCompliance.nonCompliant,
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
                      return decision[0].status.decisions.find(
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
                            to={{
                                pathname: NavigationPath.policyDetails
                                    .replace(':namespace', policy.metadata.namespace ?? '')
                                    .replace(':name', policy.metadata.name ?? ''),
                            }}
                        >
                            {policy.metadata.name}
                        </Link>
                    )
                },
            },
            {
                header: t('Cluster violation'),
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
                    const unknownCount = policySetClusterContext?.filter((status) => !status.compliant).length ?? 0
                    if (violationCount !== 0 || compliantCount !== 0 || unknownCount !== 0) {
                        return (
                            <ClusterPolicyViolationIcons2
                                compliant={compliantCount}
                                compliantHref={`/multicloud/governance/policies/details/${currentPolicy?.metadata.namespace}/${currentPolicy?.metadata.name}/results`}
                                noncompliant={violationCount}
                                violationHref={`/multicloud/governance/policies/details/${currentPolicy?.metadata.namespace}/${currentPolicy?.metadata.name}/results`}
                                unknown={unknownCount}
                            />
                        )
                    }
                    return '-'
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
            },
            {
                header: t('Remediation'),
                sort: (policyA: Policy, policyB: Policy) => {
                    const policyARemediation = getPolicyRemediation(policyA)
                    const policyBRemediation = getPolicyRemediation(policyB)
                    /* istanbul ignore next */
                    return compareStrings(policyARemediation, policyBRemediation)
                },
                cell: (policy: Policy) => {
                    return getPolicyRemediation(policy)
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
                            <strong>{policySetClusters.length}</strong>&nbsp; clusters
                        </SplitItem>
                        <SplitItem>
                            <strong>{policySetPolicies.length}</strong>&nbsp; policies
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
                    plural={t('Clusters')}
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
                <AcmTable<Policy>
                    plural={t('Policies')}
                    items={policySetPolicies}
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
