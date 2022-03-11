/* Copyright Contributors to the Open Cluster Management project */

import { makeStyles } from '@material-ui/styles'
import { ChartDonut, ChartLabel, ChartLegend } from '@patternfly/react-charts'
import { Text, TextContent, TextVariants, ToggleGroup, ToggleGroupItem } from '@patternfly/react-core'
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

const useStyles = makeStyles({
    body: {
        position: 'relative',
        top: '-35px',
        padding: '0 8px',
        '& section': {
            paddingTop: 'var(--pf-global--spacer--lg)',
        },
    },
    titleText: {
        paddingBottom: 'var(--pf-global--spacer--xl)',
        '& h4': {
            color: 'var(--pf-global--Color--200)',
        },
    },
    sectionSeparator: {
        borderBottom: '1px solid #D2D2D2',
        margin: '0 -2rem 1rem -2rem',
    },
    donutContainer: {
        maxWidth: '450px',
        margin: '0 auto',
    },
    toggleContainer: {
        position: 'relative',
        zIndex: 1,
        top: '16px',
        width: 'fit-content',
        height: 0,
        marginLeft: 'auto',
    },
    tableTitle: {
        paddingBottom: 'var(--pf-global--spacer--md)',
    },
    backAction: {
        paddingBottom: 'var(--pf-global--spacer--lg)',
    },
    subDetailComponents: {
        paddingBottom: 'var(--pf-global--spacer--xl)',
        '& small': {
            color: 'inherit',
            paddingBottom: 'var(--pf-global--spacer--sm)',
        },
    },
    riskSubDetail: {
        paddingLeft: 'var(--pf-global--spacer--lg)',
        '& p': {
            fontSize: 'var(--pf-global--FontSize--xs)',
            color: '#5A6872',
        },
    },
})

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
        <ChartDonut
            ariaTitle={t('Policy cluster violations')}
            ariaDesc={t('Policy cluster violations chart')}
            legendOrientation="vertical"
            legendPosition="right"
            constrainToVisibleArea={true}
            data={chartData}
            legendComponent={
                <ChartLegend
                    data={legendData}
                    labelComponent={<ChartLabel style={{ width: '100ps' }} />}
                    colorScale={['#0066CC', '#C9190B']}
                />
            }
            labels={({ datum }) => `${datum.x}: ${datum.y}`}
            padding={{
                bottom: 20,
                left: 20,
                right: 275,
                top: 20,
            }}
            title={`${((clusterCompliantCount / (clusterCompliantCount + clusterNonCompliantCount)) * 100).toFixed(
                0
            )}%`}
            width={450}
            height={200}
            colorScale={['#0066CC', '#C9190B']}
        />
    )
}

export function PolicySetDetailSidebar(props: { policySet: PolicySet }) {
    const { policySet } = props
    const classes = useStyles()
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
                    a?.clusterCompliance?.forEach(
                        (c: { clusterName: string; compliance: 'Compliant' | 'NonCompliant' }) => {
                            if (c.compliance === 'NonCompliant') {
                                violationCountA++
                            }
                        }
                    )
                    b?.clusterCompliance?.forEach(
                        (c: { clusterName: string; compliance: 'Compliant' | 'NonCompliant' }) => {
                            if (c.compliance === 'NonCompliant') {
                                violationCountB++
                            }
                        }
                    )
                    return compareNumbers(violationCountA, violationCountB)
                },
                cell: (policy: PolicyCompliance) => {
                    let violationCount = 0
                    // Get total count of cluster violations for a specific policy
                    const hasCompliance = policy?.clusterCompliance?.filter((cluster) => cluster.compliance) ?? []
                    if (hasCompliance.length > 0) {
                        const currentPolicy = policies.find((p: Policy) => p.metadata.name === policy.policyName)
                        hasCompliance.forEach(
                            (c: { clusterName: string; compliance: 'Compliant' | 'NonCompliant' }) => {
                                if (c.compliance === 'NonCompliant') {
                                    violationCount++
                                }
                            }
                        )
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
        <div className={classes.body}>
            <TextContent className={classes.titleText}>
                <Text component={TextVariants.h2}>{policySet.metadata.name}</Text>
                <p style={{ fontSize: '12px', color: '#6A6E73', fontWeight: 100 }}>
                    {`Namespace: ${policySet.metadata.namespace}`}
                </p>
                <div style={{ marginBottom: '.5rem' }}>
                    <strong>{policySetClusters.length}</strong> clusters
                    <strong style={{ marginLeft: '1rem' }}>{policySet.spec.policies.length ?? 0}</strong> policies
                </div>
                <Text component={TextVariants.p}>{policySet.spec.description}</Text>
            </TextContent>
            <div className={classes.sectionSeparator} />
            <div className={classes.donutContainer}>
                {policySetClusters.length > 0 && renderDonutChart(policySetClusterCompliance, t)}
            </div>
            <div className={classes.toggleContainer}>
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
            </div>
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
        </div>
    )
}
