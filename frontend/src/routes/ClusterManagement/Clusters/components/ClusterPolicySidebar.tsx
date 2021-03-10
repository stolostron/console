/* Copyright Contributors to the Open Cluster Management project */

import _ from 'lodash'
import { Tabs, Tab, TabTitleText } from '@patternfly/react-core'
import { TableGridBreakpoint } from '@patternfly/react-table'
import { ChartDonut, ChartLabel, ChartLegend } from '@patternfly/react-charts'
import { AcmLabels, AcmTable, compareStrings, AcmDropdown } from '@open-cluster-management/ui-components'
import { AngleLeftIcon, ExternalLinkAltIcon, FlagIcon, ListIcon, OutlinedClockIcon } from '@patternfly/react-icons'
import React, { useState } from 'react'
import { makeStyles } from '@material-ui/styles'
import { useTranslation } from 'react-i18next'
import { PolicyReport } from '../../../../resources/policy-report'
import { Link } from 'react-router-dom'

const useStyles = makeStyles({
    body: {
        position: 'relative',
        top: '-35px',
        padding: '0 8px',
    },
    descText: {
        fontSize: '14px',
        paddingBottom: '1rem',
    },
    donutContainer: {
        width: '400px',
        height: '200px',
        paddingBottom: '1rem',
        marginLeft: '-4rem',
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
    backAction: {
        fontSize: '14px',
        color: 'var(--pf-global--Color--400)',
        paddingBottom: '16px',
        '& button': {
            border: 0,
            cursor: 'pointer',
            background: 'none',
            color: 'var(--pf-global--link--Color)',
        },
    },
    detailTitleGroup: {
        display: 'flex',
        justifyContent: 'space-between',
    },
    titleText: {
        fontSize: '20px',
        color: 'var(--pf-global--Color--100)',
    },
    detailActions: {
        '& button': {
            backgroundColor: 'transparent',
            fontSize: '16px',
            '&::before': {
                border: '0',
            },
            '& span': {
                color: 'var(--pf-global--Color--100)',
            },
        },
    },
    detailText: {
        fontSize: '16px',
        lineHeight: '21px',
        color: 'var(--pf-global--Color--200)',
        padding: '22px 0',
    },
    knowledgebaseLink: {
        paddingBottom: '27px',
    },
    subDetailContainer: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '27px 0 20px 0',
    },
    subDetail: {
        color: 'var(--pf-global--Color--100)',
        '& > div': {
            display: 'flex',
            '& h3': {
                fontSize: '14px',
                fontWeight: 700,
                lineHeight: '18px',
            },
            '& svg': {
                alignSelf: 'center',
                marginRight: '10px',
            },
        },
    },
})

function FormatText(text: string) {
    return text.split('\n').map((str: string) => {
        if (str === '') {
            return <br />
        }
        return <p>{str}</p>
    })
}

function RenderDonutChart(data: PolicyReport[], innerText: string) {
    const clusterRiskScores = data.map((issue: any) => issue.results[0].data.total_risk)
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
            title={`${data.length || 0}`}
            subTitle={innerText}
            width={400}
            height={200}
            colorScale={['#E62325', '#EC7A08', '#F4C145', '#2B9AF3', '#72767B']}
        />
    )
}

function DetailsView(props: {
    setDetailsView: React.Dispatch<React.SetStateAction<boolean>>
    selectedPolicy: PolicyReport | undefined
}) {
    const { setDetailsView, selectedPolicy } = props
    const { t } = useTranslation(['cluster'])
    const [tabState, setTabState] = useState<React.ReactText>(0)
    const classes = useStyles()

    const onSelect = (id: string) => {
        switch (id) {
            case 'action 1':
                console.log('perform action 1')
                break
            case 'action 2':
                console.log('perform action 2')
                break
        }
    }

    function matchedDate() {
        let d = new Date(_.get(selectedPolicy, 'results[0].data.created_at', '')).toDateString()
        return d
    }

    function categories() {
        let categories = _.get(selectedPolicy, 'results[0].category', '')
        if (categories && categories !== '') {
            const categoriesToHide = categories.slice(1)
            return <AcmLabels labels={categories.split(',')} collapse={categoriesToHide} />
        }
    }

    return (
        <div className={classes.body}>
            <div className={classes.backAction}>
                <AngleLeftIcon />
                <button onClick={() => setDetailsView(false)}>{t('policy.report.flyout.back')}</button>
            </div>
            <div className={classes.detailTitleGroup}>
                <div className={classes.titleText}>{_.get(selectedPolicy, 'results[0].message', '')}</div>
                <div className={classes.detailActions}>
                    <AcmDropdown
                        dropdownItems={[
                            {
                                id: 'action 1',
                                text: t('policy.report.flyout.details.action1'),
                            },
                            {
                                id: 'action 2',
                                text: t('policy.report.flyout.details.action2'),
                            },
                        ]}
                        text={t('policy.report.flyout.details.actions')}
                        onSelect={onSelect}
                        id="policy-actions"
                        isKebab={false}
                        isPrimary={false}
                    />
                </div>
            </div>
            <div className={classes.detailText}>{_.get(selectedPolicy, 'results[0].data.details', '')}</div>
            <Link className={classes.knowledgebaseLink} to="/">
                Knowledgebase article <ExternalLinkAltIcon />
            </Link>
            <div className={classes.subDetailContainer}>
                <div className={classes.subDetail}>
                    <div>
                        <FlagIcon />
                        <h3>{t('policy.report.flyout.risk')}</h3>
                    </div>
                </div>
                <div className={classes.subDetail}>
                    <div>
                        <ListIcon />
                        <h3>{t('policy.report.flyout.category')}</h3>
                    </div>
                    {categories()}
                </div>
                <div className={classes.subDetail}>
                    <div>
                        <OutlinedClockIcon />
                        <h3>{t('policy.report.flyout.matched')}</h3>
                    </div>
                    {matchedDate()}
                </div>
            </div>
            <Tabs activeKey={tabState} onSelect={(e, tabIndex) => setTabState(tabIndex)} isFilled={true}>
                <Tab
                    eventKey={0}
                    title={<TabTitleText>{t('policy.report.flyout.details.tab.remediation')}</TabTitleText>}
                >
                    {FormatText(_.get(selectedPolicy, 'results[0].data.resolution', ''))}
                </Tab>
                <Tab eventKey={1} title={<TabTitleText>{t('policy.report.flyout.details.tab.reason')}</TabTitleText>}>
                    {FormatText(_.get(selectedPolicy, 'results[0].data.reason', ''))}
                </Tab>
            </Tabs>
        </div>
    )
}

export function ClusterPolicySidebar(props: { data: PolicyReport[] }) {
    const classes = useStyles()
    const { t } = useTranslation(['cluster'])
    const [detailsView, setDetailsView] = useState<boolean>(false)
    const [selectedPolicy, setSelectedPolicy] = useState<PolicyReport>()
    // Need to get text here - getting it in RenderDonutChart causes react hook issues due to conditional below
    const donutChartInnerText = t('policy.report.flyout.donut.chart.text')

    return detailsView ? (
        <DetailsView setDetailsView={setDetailsView} selectedPolicy={selectedPolicy} />
    ) : (
        <div className={classes.body}>
            <div className={classes.titleText}>{t('policy.report.flyout.title', { count: props.data.length })}</div>
            <div className={classes.descText}>{t('policy.report.flyout.description')}</div>
            <div className={classes.donutContainer}>{RenderDonutChart(props.data, donutChartInnerText)}</div>
            <div className={classes.tableTitleText}>{t('policy.report.flyout.table.header')}</div>
            <AcmTable<PolicyReport>
                plural="Recommendations"
                items={props.data}
                columns={[
                    {
                        header: t('policy.report.flyout.table.description'),
                        search: (policyReport) => {
                            return policyReport.results[0].message
                        },
                        sort: (a: PolicyReport, b: PolicyReport) => {
                            return compareStrings(a.results[0].message, b.results[0].message)
                        },
                        cell: (item: PolicyReport) => {
                            return (
                                <button
                                    className={classes.policyDetailLink}
                                    onClick={() => {
                                        setDetailsView(true)
                                        setSelectedPolicy(item)
                                    }}
                                >
                                    {item.results[0].message}
                                </button>
                            )
                        },
                    },
                    {
                        header: t('policy.report.flyout.category'),
                        search: (policyReport) => {
                            if (policyReport.results[0].category && policyReport.results[0].category !== '') {
                                return policyReport.results[0].category.split(',')
                            }
                            return ''
                        },
                        cell: (item: PolicyReport) => {
                            if (item.results[0].category && item.results[0].category !== '') {
                                const categories = item.results[0].category.split(',')
                                const categoriesToHide = categories.slice(1)
                                return <AcmLabels labels={categories} collapse={categoriesToHide} />
                            }
                            return '-'
                        },
                    },
                    {
                        header: t('policy.report.flyout.risk'),
                        search: (policyReport) => {
                            return policyReport.results[0].data.total_risk
                        },
                        sort: (a: PolicyReport, b: PolicyReport) => {
                            return compareStrings(a.results[0].data.total_risk, b.results[0].data.total_risk)
                        },
                        cell: (item: PolicyReport) => {
                            return item.results[0].data.total_risk
                        },
                    },
                ]}
                keyFn={(item: any) => item.metadata.uid}
                tableActions={[]}
                bulkActions={[]}
                rowActions={[]}
                gridBreakPoint={TableGridBreakpoint.none}
            />
        </div>
    )
}
