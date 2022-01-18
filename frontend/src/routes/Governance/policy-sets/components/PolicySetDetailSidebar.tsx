/* Copyright Contributors to the Open Cluster Management project */

import { makeStyles } from '@material-ui/styles'
import { ChartDonut, ChartLabel, ChartLegend } from '@patternfly/react-charts'
import { Text, TextContent, TextVariants, ToggleGroup, ToggleGroupItem } from '@patternfly/react-core'
import { CheckCircleIcon, ExclamationCircleIcon } from '@patternfly/react-icons'
import { TableGridBreakpoint } from '@patternfly/react-table'
import { AcmLabels, AcmTable, compareNumbers, compareStrings } from '@stolostron/ui-components'
import { TFunction } from 'i18next'
import { useState } from 'react'
import { useRecoilState } from 'recoil'
import { managedClustersState, policiesState } from '../../../../atoms'
import { useTranslation } from '../../../../lib/acm-i18next'
import { PolicySet, PolicySetResultClusters, PolicySetResultsStatus } from '../../../../resources/policy-set'

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
        margin: '0 -2rem',
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

function renderDonutChart(clusters: PolicySetResultClusters[], t: TFunction) {
    const clusterCompliantCount = clusters.filter((cluster) => cluster.compliant === 'Compliant').length
    const clusterNonCompliantCount = clusters.filter((cluster) => cluster.compliant === 'NonCompliant').length
    const formattedData = [
        {
            key: t('Clusters with policy violations'),
            value: clusterCompliantCount,
            isPrimary: true,
        },
        {
            key: t('Clusters without policy violations'),
            value: clusterNonCompliantCount,
        },
    ]
    const chartData = formattedData.map((d) => ({ x: d.key, y: d.value }))
    const legendData: Array<{ name?: string; link?: string }> = formattedData.map((d) => ({
        name: `${d.value} ${d.key}`,
    }))

    return (
        <ChartDonut
            ariaTitle={t('Policy cluster compliance')}
            ariaDesc={t('Policy cluster compliance chart')}
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
            title={`${((clusterCompliantCount / clusters.length) * 100).toFixed(0)}%`}
            width={450}
            height={200}
            colorScale={['#0066CC', '#C9190B']}
        />
    )
}

export function PolicySetSidebar(props: { policySet: PolicySet; policySetClusters: PolicySetResultClusters[] }) {
    const { policySet, policySetClusters } = props
    const classes = useStyles()
    const { t } = useTranslation()
    const [managedClusters] = useRecoilState(managedClustersState)
    const [policies] = useRecoilState(policiesState)
    const [type, setType] = useState<'Clusters' | 'Policies'>('Clusters')
    const selectType = (type: 'Clusters' | 'Policies') => {
        setType(type)
    }

    const policySetPolicies: PolicySetResultsStatus[] = policySet.status?.results.map(
        (result: PolicySetResultsStatus) => {
            return result
        },
        []
    )

    const clusterColumnDefs = [
        {
            header: t('Cluster name'),
            search: (cluster: PolicySetResultClusters) => cluster.clusterName,
            sort: (a: PolicySetResultClusters, b: PolicySetResultClusters) =>
                compareStrings(a.clusterName, b.clusterName),
            cell: (cluster: PolicySetResultClusters) => (
                <a href={`/multicloud/infrastructure/clusters/details/${cluster.clusterName}/overview`}>
                    {cluster.clusterName}
                </a>
            ),
        },
        {
            header: t('Policy violation'),
            sort: (a: PolicySetResultClusters, b: PolicySetResultClusters) => {
                let violationCountA = 0
                let violationCountB = 0
                policySet.status?.results.forEach((result: PolicySetResultsStatus) => {
                    result?.clusters &&
                        result.clusters.forEach((c: PolicySetResultClusters) => {
                            if (c.clusterName === a.clusterName && a.compliant === 'NonCompliant') {
                                violationCountA++
                            } else if (c.clusterName === b.clusterName && b.compliant === 'NonCompliant') {
                                violationCountB++
                            }
                        })
                })
                return compareNumbers(violationCountA, violationCountB)
            },
            cell: (cluster: PolicySetResultClusters) => {
                let violationCount = 0
                // Get total count of policy violations for a specific cluster
                policySet.status?.results.forEach((result: PolicySetResultsStatus) => {
                    result?.clusters &&
                        result.clusters.forEach((c: PolicySetResultClusters) => {
                            if (c.clusterName === cluster.clusterName && cluster.compliant === 'NonCompliant') {
                                violationCount++
                            }
                        })
                })
                return (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        {violationCount > 0 ? (
                            <ExclamationCircleIcon color="#C9190B" />
                        ) : (
                            <CheckCircleIcon color="#3E8635" />
                        )}
                        <p
                            style={{ marginLeft: '.25rem' }}
                        >{`${violationCount} of ${policySet.spec.policies.length} in violation`}</p>
                    </div>
                )
            },
        },
        {
            header: t('Labels'),
            cell: (clusterInfo: PolicySetResultClusters) => {
                const cluster = managedClusters.find((cluster) => cluster.metadata.name === clusterInfo.clusterName)
                if (cluster && cluster.metadata.labels) {
                    const labelKeys = Object.keys(cluster.metadata.labels)
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
                    labelKeys.forEach((label) => {
                        if (label.includes('open-cluster-management.io')) {
                            collapse.push(label)
                        }
                    })
                    return (
                        <AcmLabels
                            labels={cluster.metadata.labels}
                            expandedText={t('show.less')}
                            collapsedText={t('show.more', { number: collapse.length })}
                            allCollapsedText={t('count.labels', { number: collapse.length })}
                            collapse={collapse}
                        />
                    )
                } else {
                    return '-'
                }
            },
        },
    ]

    const policyColumnDefs = [
        {
            header: t('Policy name'),
            search: (policy: PolicySetResultsStatus) => policy.policy,
            sort: (a: PolicySetResultsStatus, b: PolicySetResultsStatus) => compareStrings(a.policy, b.policy),
            cell: (policy: PolicySetResultsStatus) => (
                <a href={`/multicloud/governance/policies/${policy.policy}`}>{policy.policy}</a>
            ),
        },
        {
            header: t('Cluster violation'),
            sort: (a: PolicySetResultsStatus, b: PolicySetResultsStatus) => {
                let violationCountA = 0
                let violationCountB = 0
                a?.clusters?.forEach((c: PolicySetResultClusters) => {
                    if (c.compliant === 'NonCompliant') {
                        violationCountA++
                    }
                })
                b?.clusters?.forEach((c: PolicySetResultClusters) => {
                    if (c.compliant === 'NonCompliant') {
                        violationCountB++
                    }
                })
                return compareNumbers(violationCountA, violationCountB)
            },
            cell: (policy: PolicySetResultsStatus) => {
                let violationCount = 0
                // Get total count of cluster violations for a specific policy
                policy?.clusters?.forEach((c: PolicySetResultClusters) => {
                    if (c.compliant === 'NonCompliant') {
                        violationCount++
                    }
                })
                return (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        {violationCount > 0 ? (
                            <ExclamationCircleIcon color="#C9190B" />
                        ) : (
                            <CheckCircleIcon color="#3E8635" />
                        )}
                        <p
                            style={{ marginLeft: '.25rem' }}
                        >{`${violationCount} of ${policySetClusters.length} in violation`}</p>
                    </div>
                )
            },
        },
        {
            header: t('Remediation'),
            sort: (a: PolicySetResultsStatus, b: PolicySetResultsStatus) => {
                const policyA = policies.find((p) => p.metadata.name === a.policy)
                const policyB = policies.find((p) => p.metadata.name === b.policy)
                return compareStrings(policyA?.spec.remediationAction, policyB?.spec.remediationAction)
            },
            cell: (policyStatus: PolicySetResultsStatus) => {
                const policy = policies.find((p) => p.metadata.name === policyStatus.policy)
                return policy?.spec.remediationAction ?? '-'
            },
        },
    ]

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
                {policySetClusters.length > 0 && renderDonutChart(policySetClusters, t)}
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
                <AcmTable<PolicySetResultClusters>
                    plural="Clusters"
                    items={policySetClusters}
                    initialSort={{
                        index: 1, // default to sorting by violation count
                        direction: 'desc',
                    }}
                    columns={clusterColumnDefs}
                    keyFn={(item: any) => item.policy}
                    tableActions={[]}
                    rowActions={[]}
                    gridBreakPoint={TableGridBreakpoint.none}
                    autoHidePagination={true}
                    searchPlaceholder={t('Find by name')}
                />
            ) : (
                <AcmTable<PolicySetResultsStatus>
                    plural="Clusters"
                    items={policySetPolicies}
                    initialSort={{
                        index: 1, // default to sorting by violation count
                        direction: 'desc',
                    }}
                    columns={policyColumnDefs}
                    keyFn={(item: any) => item.policy}
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
