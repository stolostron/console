/* Copyright Contributors to the Open Cluster Management project */

import { makeStyles } from '@material-ui/styles'
import { AcmTable, compareNumbers, compareStrings } from '@open-cluster-management/ui-components'
import { ChartDonut, ChartLabel, ChartLegend } from '@patternfly/react-charts'
import { Text, TextContent, TextVariants } from '@patternfly/react-core'
import { CheckCircleIcon, ExclamationCircleIcon } from '@patternfly/react-icons'
import { TableGridBreakpoint } from '@patternfly/react-table'
import { TFunction } from 'i18next'
import { useTranslation } from '../../../lib/acm-i18next'
import { PolicySet, PolicySetResultClusters, PolicySetResultsStatus } from '../../../resources/policy-set'

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
        paddingBottom: 'var(--pf-global--spacer--md)',
        margin: '0 auto',
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
            key: t('Compliant'),
            value: clusterCompliantCount,
            isPrimary: true,
        },
        {
            key: t('Non-compliant'),
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
                right: 145,
                top: 20,
            }}
            title={`${((clusterCompliantCount / clusters.length) * 100).toFixed(1)}%`}
            width={400}
            height={200}
            colorScale={['#0066CC', '#C9190B']}
        />
    )
}

export function PolicySetSidebar(props: { policySet: PolicySet; policySetClusters: PolicySetResultClusters[] }) {
    const { policySet, policySetClusters } = props
    const classes = useStyles()
    const { t } = useTranslation()

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
            <AcmTable
                plural="Clusters"
                items={policySetClusters}
                initialSort={{
                    index: 0, // default to sorting by highest risk
                    direction: 'desc',
                }}
                columns={[
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
                            const violationCountA = policySetClusters.filter((c) => {
                                return c.clusterName === a.clusterName && c.compliant === 'NonCompliant'
                            }).length
                            const violationCountB = policySetClusters.filter((c) => {
                                return c.clusterName === b.clusterName && c.compliant === 'NonCompliant'
                            }).length
                            return compareNumbers(violationCountA, violationCountB)
                        },
                        cell: (cluster: PolicySetResultClusters) => {
                            let violationCount = 0
                            // Get total count of policy violations for a specific cluster
                            policySet.status?.results.forEach((result: PolicySetResultsStatus) => {
                                result?.clusters &&
                                    result.clusters.forEach((c: PolicySetResultClusters) => {
                                        if (
                                            c.clusterName === cluster.clusterName &&
                                            cluster.compliant === 'NonCompliant'
                                        ) {
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
                ]}
                keyFn={(item: any) => item.policy}
                tableActions={[]}
                rowActions={[]}
                gridBreakPoint={TableGridBreakpoint.none}
            />
        </div>
    )
}
