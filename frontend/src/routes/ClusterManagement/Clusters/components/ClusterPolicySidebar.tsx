/* Copyright Contributors to the Open Cluster Management project */

import _ from 'lodash'
import {
    Tabs,
    Tab,
    TabTitleText,
    Grid,
    GridItem,
    Flex,
    FlexItem,
    Text,
    TextContent,
    TextVariants,
    Button,
} from '@patternfly/react-core'
import { TableGridBreakpoint } from '@patternfly/react-table'
import { ChartDonut, ChartLabel, ChartLegend } from '@patternfly/react-charts'
import { AcmLabels, AcmTable, compareStrings } from '@open-cluster-management/ui-components'
import { CriticalRiskIcon, ModerateRiskIcon, ImportantRiskIcon, LowRiskIcon } from './ClusterPolicySidebarIcons'
import {
    AngleLeftIcon,
    /*ExternalLinkAltIcon,*/
    FlagIcon,
    ListIcon,
    OutlinedClockIcon,
    ExclamationTriangleIcon,
} from '@patternfly/react-icons'
import React, { useState } from 'react'
import { makeStyles } from '@material-ui/styles'
import { useTranslation } from 'react-i18next'
import { PolicyReport } from '../../../../resources/policy-report'

const useStyles = makeStyles({
    body: {
        position: 'relative',
        top: '-35px',
        padding: '0 8px',
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

    function riskLevel() {
        const riskScore = _.get(selectedPolicy, 'results[0].data.total_risk')
        let totalRisk, riskIcon

        const riskComponent = (totalRisk: string, riskIcon: any) => {
            return (
                <div>
                    {riskIcon}
                    <span>{totalRisk}</span>
                </div>
            )
        }

        switch (riskScore) {
            case '4':
                totalRisk = t('policy.report.flyout.details.risk.critical')
                riskIcon = <CriticalRiskIcon />
                return riskComponent(totalRisk, riskIcon)
            case '3':
                totalRisk = t('policy.report.flyout.details.risk.major')
                riskIcon = <ImportantRiskIcon />
                return riskComponent(totalRisk, riskIcon)
            case '2':
                totalRisk = t('policy.report.flyout.details.risk.minor')
                riskIcon = <ModerateRiskIcon />
                return riskComponent(totalRisk, riskIcon)
            case '1':
                totalRisk = t('policy.report.flyout.details.risk.low')
                riskIcon = <LowRiskIcon />
                return riskComponent(totalRisk, riskIcon)
            case '0':
                totalRisk = t('policy.report.flyout.details.risk.warning')
                riskIcon = <ExclamationTriangleIcon />
                return riskComponent(totalRisk, riskIcon)
            default:
                return null
        }
    }

    function categories() {
        let categories = _.get(selectedPolicy, 'results[0].category', '')
        if (categories && categories !== '') {
            const categoriesToHide = categories.slice(1)
            return <AcmLabels labels={categories.split(',')} collapse={categoriesToHide} />
        }
    }

    function matchedDate() {
        let d = new Date(_.get(selectedPolicy, 'results[0].data.created_at', '')).toDateString()
        return d
    }

    return (
        <div className={classes.body}>
            <Flex>
                <FlexItem spacer={{ default: 'spacerSm' }}>
                    <AngleLeftIcon fill={'var(--pf-global--palette--black-500)'} />
                </FlexItem>
                <FlexItem>
                    <Button variant="link" isInline component="span" onClick={() => setDetailsView(false)}>
                        {t('policy.report.flyout.back')}
                    </Button>
                </FlexItem>
            </Flex>
            <TextContent>
                <Text component={TextVariants.h2}>{_.get(selectedPolicy, 'results[0].message', '')}</Text>
            </TextContent>
            <TextContent>
                <Text component={TextVariants.p}>{_.get(selectedPolicy, 'results[0].data.details', '')}</Text>
            </TextContent>
            <Grid hasGutter>
                <GridItem span={5}>
                    <Flex>
                        <FlexItem>
                            <FlagIcon />
                        </FlexItem>
                        <FlexItem>
                            <TextContent>
                                <Text component={TextVariants.h4}>{t('policy.report.flyout.risk')}</Text>
                            </TextContent>
                        </FlexItem>
                    </Flex>
                    {riskLevel()}
                </GridItem>
                <GridItem span={4}>
                    <Flex>
                        <FlexItem>
                            <ListIcon />
                        </FlexItem>
                        <FlexItem>
                            <TextContent>
                                <Text component={TextVariants.h4}>{t('policy.report.flyout.category')}</Text>
                            </TextContent>
                        </FlexItem>
                    </Flex>
                    {categories()}
                </GridItem>
                <GridItem span={3}>
                    <Flex>
                        <FlexItem>
                            <OutlinedClockIcon />
                        </FlexItem>
                        <FlexItem>
                            <TextContent>
                                <Text component={TextVariants.h4}>{t('policy.report.flyout.matched')}</Text>
                            </TextContent>
                        </FlexItem>
                    </Flex>
                    {matchedDate()}
                </GridItem>
            </Grid>
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
            <TextContent>
                <Text component={TextVariants.h2}>{t('policy.report.flyout.title', { count: props.data.length })}</Text>
                <Text component={TextVariants.p}>{t('policy.report.flyout.description')}</Text>
            </TextContent>
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
