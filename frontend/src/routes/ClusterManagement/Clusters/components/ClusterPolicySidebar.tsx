/* Copyright Contributors to the Open Cluster Management project */

import { useState } from 'react'
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
import { Markdown } from '@redhat-cloud-services/rule-components/Markdown'
import { useRecoilState } from 'recoil'
import { configMapsState } from '../../../../atoms'
import { CriticalRiskIcon, ModerateRiskIcon, ImportantRiskIcon, LowRiskIcon } from './ClusterPolicySidebarIcons'
import { AngleLeftIcon, FlagIcon, ListIcon, OutlinedClockIcon } from '@patternfly/react-icons'
import { makeStyles } from '@material-ui/styles'
import { useTranslation, TFunction } from 'react-i18next'
import { PolicyReport, PolicyReportResults } from '../../../../resources/policy-report'

const useStyles = makeStyles({
    body: {
        position: 'relative',
        top: '-35px',
        padding: '0 8px',
        '& h2, h4, p, span, thead': {
            fontFamily: 'RedHatText-Regular',
        },
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
    donutContainer: {
        maxWidth: '450px',
        paddingBottom: 'var(--pf-global--spacer--md)',
        marginLeft: '-4rem',
    },
    tableTitle: {
        paddingBottom: 'var(--pf-global--spacer--md)',
        '& h4': {
            fontFamily: 'RedHatText-Medium',
        },
    },
    backAction: {
        paddingBottom: 'var(--pf-global--spacer--lg)',
    },
    subDetailComponents: {
        paddingBottom: 'var(--pf-global--spacer--xl)',
        '& small': {
            fontFamily: 'RedHatText-Medium',
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

function renderDonutChart(data: PolicyReport, t: TFunction<string[]>) {
    const clusterRiskScores = data.results.map((issue) => issue.properties.total_risk)
    const formattedData = [
        {
            key: t('policy.report.critical'),
            value: clusterRiskScores.filter((score: string) => score === '4').length,
            isPrimary: true,
        },
        {
            key: t('policy.report.important'),
            value: clusterRiskScores.filter((score: string) => score === '3').length,
        },
        {
            key: t('policy.report.moderate'),
            value: clusterRiskScores.filter((score: string) => score === '2').length,
        },
        {
            key: t('policy.report.low'),
            value: clusterRiskScores.filter((score: string) => score === '1').length,
        },
    ]
    const chartData = formattedData.map((d) => ({ x: d.key, y: d.value }))
    const legendData: Array<{ name?: string; link?: string }> = formattedData.map((d) => ({
        name: `${d.value} ${d.key}`,
    }))

    return (
        <ChartDonut
            ariaTitle={t('policy.report.flyout.donut.chart.ariaTitle')}
            ariaDesc={t('policy.report.flyout.donut.chart.ariaDesc')}
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
            title={`${data.results.length}`}
            subTitle={t('policy.report.flyout.donut.chart.text')}
            width={400}
            height={200}
            colorScale={['#E62325', '#EC7A08', '#F4C145', '#2B9AF3', '#72767B']}
        />
    )
}

function DetailsView(props: {
    setDetailsView: React.Dispatch<React.SetStateAction<boolean>>
    selectedReport: PolicyReportResults | undefined
}) {
    const { setDetailsView, selectedReport } = props
    const [configmaps] = useRecoilState(configMapsState)
    const contentMap = configmaps.find((cm) => cm.metadata.name === 'insight-content-data')
    let policyContentData = contentMap?.data && contentMap?.data[selectedReport?.policy ?? '']
    policyContentData = policyContentData && JSON.parse(policyContentData)
    const { t } = useTranslation(['cluster'])
    const [tabState, setTabState] = useState<React.ReactText>(0)
    const classes = useStyles()

    function riskLevel() {
        const riskScore = _.get(selectedReport, 'properties.total_risk')
        let totalRisk, riskIcon

        const riskComponent = (totalRisk: string, riskIcon: any) => {
            return (
                <Flex
                    className={classes.riskSubDetail}
                    direction={{ default: 'column' }}
                    spaceItems={{ default: 'spaceItemsNone' }}
                >
                    <FlexItem>
                        <Flex>
                            <FlexItem>{riskIcon}</FlexItem>
                            <FlexItem>
                                <TextContent>
                                    <Text component={TextVariants.h4}>{totalRisk}</Text>
                                </TextContent>
                            </FlexItem>
                        </Flex>
                    </FlexItem>
                    <FlexItem>
                        <TextContent>
                            <Text component={TextVariants.p}>
                                {t('policy.report.riskLevel', { totalRisk: totalRisk })}
                            </Text>
                        </TextContent>
                    </FlexItem>
                </Flex>
            )
        }

        switch (riskScore) {
            case '4':
                totalRisk = t('policy.report.critical')
                riskIcon = <CriticalRiskIcon />
                return riskComponent(totalRisk, riskIcon)
            case '3':
                totalRisk = t('policy.report.important')
                riskIcon = <ImportantRiskIcon />
                return riskComponent(totalRisk, riskIcon)
            case '2':
                totalRisk = t('policy.report.moderate')
                riskIcon = <ModerateRiskIcon />
                return riskComponent(totalRisk, riskIcon)
            case '1':
                totalRisk = t('policy.report.low')
                riskIcon = <LowRiskIcon />
                return riskComponent(totalRisk, riskIcon)
            default:
                return null
        }
    }

    function categories() {
        const categories = _.get(selectedReport, 'category', '')
        if (categories && categories !== '') {
            const categoriesToHide = categories.split(',').slice(1)
            return <AcmLabels labels={categories.split(',')} collapse={categoriesToHide} />
        }
        return <AcmLabels labels={[]} />
    }

    function matchedDate() {
        const d = new Date(_.get(selectedReport, 'properties.created_at', '')).toDateString()
        return d
    }

    return (
        <div className={classes.body}>
            <Flex className={classes.backAction}>
                <FlexItem spacer={{ default: 'spacerSm' }}>
                    <AngleLeftIcon color={'var(--pf-global--palette--black-500)'} />
                </FlexItem>
                <FlexItem>
                    <Button variant="link" isInline component="span" onClick={() => setDetailsView(false)}>
                        {t('policy.report.flyout.back')}
                    </Button>
                </FlexItem>
            </Flex>
            <TextContent className={classes.titleText}>
                <Text component={TextVariants.h2}>{_.get(selectedReport, 'message', '')}</Text>
            </TextContent>
            <Grid className={classes.subDetailComponents} hasGutter>
                <GridItem span={5}>
                    <Flex>
                        <FlexItem>
                            <FlagIcon />
                        </FlexItem>
                        <FlexItem>
                            <TextContent>
                                <Text component={TextVariants.small}>{t('policy.report.table.totalRisk')}</Text>
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
                                <Text component={TextVariants.small}>{t('policy.report.table.category')}</Text>
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
                                <Text component={TextVariants.small}>{t('policy.report.flyout.matched')}</Text>
                            </TextContent>
                        </FlexItem>
                    </Flex>
                    {matchedDate()}
                </GridItem>
            </Grid>
            <Tabs activeKey={tabState} onSelect={(_e, tabIndex) => setTabState(tabIndex)} isFilled={true}>
                <Tab
                    eventKey={0}
                    title={<TabTitleText>{t('policy.report.flyout.details.tab.remediation')}</TabTitleText>}
                >
                    <TextContent>
                        <Markdown
                            template={policyContentData?.resolution ?? ''}
                            definitions={_.get(selectedReport, 'properties.extra_data', '')}
                        />
                    </TextContent>
                </Tab>
                <Tab eventKey={1} title={<TabTitleText>{t('policy.report.flyout.details.tab.reason')}</TabTitleText>}>
                    <TextContent>
                        <Markdown
                            template={policyContentData?.reason ?? ''}
                            definitions={_.get(selectedReport, 'properties.extra_data', '')}
                        />
                    </TextContent>
                </Tab>
            </Tabs>
        </div>
    )
}

export function ClusterPolicySidebar(props: { data: PolicyReport }) {
    const classes = useStyles()
    const { t } = useTranslation(['cluster'])
    const [detailsView, setDetailsView] = useState<boolean>(false)
    const [selectedReport, setSelectedReport] = useState<PolicyReportResults>()

    return detailsView ? (
        <DetailsView setDetailsView={setDetailsView} selectedReport={selectedReport} />
    ) : (
        <div className={classes.body}>
            <TextContent className={classes.titleText}>
                <Text component={TextVariants.h2}>
                    {t('policy.report.flyout.title', { count: props.data.results.length })}
                </Text>
                <Text component={TextVariants.p}>{t('policy.report.flyout.description')}</Text>
            </TextContent>
            <div className={classes.donutContainer}>{renderDonutChart(props.data, t)}</div>
            <TextContent className={classes.tableTitle}>
                <Text component={TextVariants.h4}>{t('policy.report.flyout.table.header')}</Text>
            </TextContent>
            <AcmTable<PolicyReportResults>
                plural="Recommendations"
                items={props.data.results}
                columns={[
                    {
                        header: t('policy.report.table.description'),
                        search: (report) => report.message,
                        sort: (a: PolicyReportResults, b: PolicyReportResults) => compareStrings(a.message, b.message),
                        cell: (item: PolicyReportResults) => (
                            <Button
                                variant="link"
                                onClick={() => {
                                    setDetailsView(true)
                                    setSelectedReport(item)
                                }}
                                isInline
                                component="span"
                            >
                                {item.message}
                            </Button>
                        ),
                    },
                    {
                        header: t('policy.report.table.category'),
                        search: (policyReport) => {
                            if (policyReport.category && policyReport.category !== '') {
                                return policyReport.category.split(',')
                            }
                            return ''
                        },
                        cell: (item: PolicyReportResults) => {
                            if (item.category && item.category !== '') {
                                const categories = item.category.split(',')
                                const categoriesToHide = categories.slice(1)
                                return <AcmLabels labels={categories} collapse={categoriesToHide} />
                            }
                            return '-'
                        },
                    },
                    {
                        header: t('policy.report.table.totalRisk'),
                        search: (policyReport) => policyReport.properties.total_risk,
                        sort: (a: PolicyReportResults, b: PolicyReportResults) =>
                            compareStrings(a.properties.total_risk, b.properties.total_risk),
                        cell: (item: PolicyReportResults) => item.properties.total_risk,
                    },
                ]}
                keyFn={(item: any) => item.policy}
                tableActions={[]}
                bulkActions={[]}
                rowActions={[]}
                gridBreakPoint={TableGridBreakpoint.none}
            />
        </div>
    )
}
