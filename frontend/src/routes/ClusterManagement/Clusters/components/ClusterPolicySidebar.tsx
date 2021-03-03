import _ from 'lodash'
import { Tabs, Tab, TabTitleText } from '@patternfly/react-core'
import { TableGridBreakpoint } from '@patternfly/react-table'
import { ChartDonut, ChartLabel, ChartLegend } from '@patternfly/react-charts'
import { AcmLabels, AcmTable } from '@open-cluster-management/ui-components'
import React, { useState } from 'react'
import { makeStyles } from '@material-ui/styles'
import { useTranslation } from 'react-i18next'
import { ISearchResult } from '../../../../lib/search'
import { getPolicyReport } from '../../../../resources/policy-report'

const useStyles = makeStyles({
    sidebarBody: {
        position: 'relative',
        top: '-35px',
    },
    sidebarDescText: {
        fontSize: '14px',
        paddingBottom: '1rem',
    },
    donutContainer: {
        width: '400px',
        height: '200px',
        paddingBottom: '1rem',
        marginLeft: '-4rem',
    },
    sidebarTitleText: {
        fontSize: '20px',
        paddingBottom: '10px',
    },
    backAction: {
        border: 0,
        cursor: 'pointer',
        background: 'none',
        color: 'var(--pf-global--link--Color)',
    },
    tableTitleText: {
        fontWeight: 700,
        fontSize: '16px',
    },
    policyDetailLink: {
        border: 0,
        cursor: 'pointer',
        background: 'none',
        color: 'var(--pf-global--link--Color)',
        textAlign: 'unset',
        '&:hover': {
            textDecoration: 'underline',
        },
    },
})

function RenderDonutChart(data: any, innerText: string) {
    const clusterRiskScores = data.map((issue: any) => issue.risk)
    const formattedData = [
        {
            key: 'Critical',
            value: clusterRiskScores.filter((score: string) => score === '4').length,
            isPrimary: true,
        },
        {
            key: 'Major',
            value: clusterRiskScores.filter((score: string) => score === '3').length,
        },
        {
            key: 'Minor',
            value: clusterRiskScores.filter((score: string) => score === '2').length,
        },
        {
            key: 'Low',
            value: clusterRiskScores.filter((score: string) => score === '1').length,
        },
        {
            key: 'Warning',
            value: clusterRiskScores.filter((score: string) => score === '0').length,
        },
    ]
    const chartData = formattedData.map((d) => ({ x: d.key, y: d.value }))
    const legendData: Array<{ name?: string; link?: string }> = formattedData.map((d) => ({
        name: `${d.value} ${d.key}`,
    }))

    return (
        <ChartDonut
            ariaTitle={'cluster-violations'}
            ariaDesc={'cluster-violations-donut-chart'}
            legendOrientation="vertical"
            legendPosition="right"
            constrainToVisibleArea={true}
            data={chartData}
            legendData={legendData}
            legendComponent={
                <ChartLegend
                    data={legendData}
                    labelComponent={<ChartLabel />}
                    colorScale={['#E62325', '#EC7A08', '#F4C145', '#2B9AF3', '#72767B']}
                />
            }
            labels={({ datum }) => `${datum.x}: ${datum.y}`}
            padding={{
                bottom: 20,
                left: 20,
                right: 145,
                top: 20,
            }}
            title={data.length}
            subTitle={innerText}
            width={400}
            height={200}
            colorScale={['#E62325', '#EC7A08', '#F4C145', '#2B9AF3', '#72767B']}
        />
    )
}

function DetailsView(props: {
    setDetailsView: React.Dispatch<React.SetStateAction<boolean>>
    selectedPolicy: { name: string; namespace: string }
}) {
    const { setDetailsView, selectedPolicy } = props
    const { t } = useTranslation(['cluster'])
    const [tabState, setTabState] = useState<React.ReactText>(0)
    const [reportError, setReportError] = useState(null)
    const [reportData, setReportData] = useState({
        message: '',
        remediation: '',
        reason: '',
    })
    const classes = useStyles()

    if (!reportError && reportData.message === '') {
        getPolicyReport({ name: selectedPolicy.name, namespace: selectedPolicy.namespace })
            .promise.then((result) => {
                setReportData({
                    message: _.get(result, 'results[0].message', ''),
                    remediation: _.get(result, 'results[0].data.resolution', ''),
                    reason: _.get(result, 'results[0].data.reason', ''),
                })
            })
            .catch((e) => setReportError(e))
    }

    if (reportError) {
        return (
            <div className={classes.sidebarBody}>
                <div className={classes.sidebarTitleText}>
                    <button onClick={() => setDetailsView(false)} className={classes.backAction}>
                        {t('policy.report.flyout.back')}
                    </button>
                </div>
                <div className={classes.sidebarDescText}>{reportError}</div>
            </div>
        )
    }

    return (
        <div className={classes.sidebarBody}>
            <div className={classes.sidebarTitleText}>
                <button onClick={() => setDetailsView(false)} className={classes.backAction}>
                    {t('policy.report.flyout.back')}
                </button>
            </div>
            <div className={classes.sidebarDescText}>{reportData.message}</div>
            <Tabs activeKey={tabState} onSelect={(e, tabIndex) => setTabState(tabIndex)} isFilled={true}>
                <Tab
                    eventKey={0}
                    title={<TabTitleText>{t('policy.report.flyout.details.tab.remediation')}</TabTitleText>}
                >
                    {reportData.remediation}
                </Tab>
                <Tab eventKey={1} title={<TabTitleText>{t('policy.report.flyout.details.tab.reason')}</TabTitleText>}>
                    {reportData.reason}
                </Tab>
            </Tabs>
        </div>
    )
}

export function ClusterPolicySidebar(props: { data: ISearchResult[]; loading: boolean }) {
    const classes = useStyles()
    const { t } = useTranslation(['cluster'])
    const clusterIssues = _.get(props, 'data[0].data.searchResult[0].items', [])
    const [detailsView, setDetailsView] = useState<boolean>(false)
    const [selectedPolicy, setSelectedPolicy] = useState({ name: '', namespace: '' })
    // Need to get text here - getting it in RenderDonutChart causes react hook issues due to conditional below
    const donutChartInnerText = t('policy.report.flyout.donut.chart.text')

    return detailsView ? (
        <DetailsView setDetailsView={setDetailsView} selectedPolicy={selectedPolicy} />
    ) : (
        <div className={classes.sidebarBody}>
            <div className={classes.sidebarTitleText}>
                {t('policy.report.flyout.title', { count: clusterIssues.length })}
            </div>
            <div className={classes.sidebarDescText}>{t('policy.report.flyout.description')}</div>
            <div className={classes.donutContainer}>{RenderDonutChart(clusterIssues, donutChartInnerText)}</div>
            <div className={classes.tableTitleText}>{'Recommendations with remediation'}</div>
            <AcmTable
                plural="Recommendations"
                items={clusterIssues}
                columns={[
                    {
                        header: 'Description',
                        search: 'message',
                        sort: 'message',
                        cell: (item: any) => {
                            return (
                                <button
                                    className={classes.policyDetailLink}
                                    onClick={() => {
                                        setDetailsView(true)
                                        setSelectedPolicy({ name: item.name, namespace: item.namespace })
                                    }}
                                >
                                    {item.message}
                                </button>
                            )
                        },
                    },
                    {
                        header: 'Category',
                        sort: 'category',
                        cell: (item: any) => {
                            if (item.category && item.category !== '') {
                                const categories = item.category.split(',')
                                const categoriesToHide = categories.slice(1)
                                return <AcmLabels labels={categories} collapse={categoriesToHide} />
                            }
                            return '-'
                        },
                    },
                    {
                        header: 'Total risk',
                        search: 'risk',
                        sort: 'risk',
                        cell: 'risk',
                    },
                ]}
                keyFn={(item: any) => item._uid.toString()}
                tableActions={[]}
                bulkActions={[]}
                rowActions={[]}
                gridBreakPoint={TableGridBreakpoint.none}
            />
        </div>
    )
}
