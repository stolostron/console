/* Copyright Contributors to the Open Cluster Management project */

import { makeStyles } from '@mui/styles'
import { ChartDonut, ChartLabel, ChartLegend } from '@patternfly/react-charts'
import {
  Button,
  Flex,
  FlexItem,
  Grid,
  GridItem,
  Tab,
  Tabs,
  TabTitleText,
  Text,
  TextContent,
  TextVariants,
} from '@patternfly/react-core'
import { AngleLeftIcon, FlagIcon, ListIcon, OutlinedClockIcon } from '@patternfly/react-icons'
import { TableGridBreakpoint } from '@patternfly/react-table'
import { Markdown } from '@redhat-cloud-services/rule-components/Markdown'
import { AcmEmptyState, AcmLabels, AcmTable, colorThemes, compareStrings } from '../../../../../ui-components'
import { TFunction } from 'i18next'
import _ from 'lodash'
import { useState } from 'react'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { PolicyReport, PolicyReportResults } from '../../../../../resources'
import { CriticalRiskIcon, ImportantRiskIcon, LowRiskIcon, ModerateRiskIcon } from './ClusterPolicySidebarIcons'
import { useSharedAtoms, useRecoilState } from '../../../../../shared-recoil'

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
  donutContainer: {
    maxWidth: '450px',
    paddingBottom: 'var(--pf-global--spacer--md)',
    marginLeft: '-4rem',
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

function renderDonutChart(data: PolicyReportResults[], t: TFunction) {
  const clusterRiskScores = data.map((issue) => issue.properties.total_risk)
  const formattedData = [
    {
      key: t('Critical'),
      value: clusterRiskScores.filter((score: string) => score === '4').length,
      isPrimary: true,
    },
    {
      key: t('Important'),
      value: clusterRiskScores.filter((score: string) => score === '3').length,
    },
    {
      key: t('Moderate'),
      value: clusterRiskScores.filter((score: string) => score === '2').length,
    },
    {
      key: t('Low'),
      value: clusterRiskScores.filter((score: string) => score === '1').length,
    },
  ]
  const chartData = formattedData.map((d) => ({ x: d.key, y: d.value }))
  const legendData: Array<{ name?: string; link?: string }> = formattedData.map((d) => ({
    name: `${d.value} ${d.key}`,
  }))

  return (
    <ChartDonut
      ariaTitle={t('Cluster violations')}
      ariaDesc={t('Donut chart of cluster violations')}
      legendOrientation="vertical"
      legendPosition="right"
      constrainToVisibleArea={true}
      data={chartData}
      legendData={legendData}
      legendComponent={
        <ChartLegend
          data={legendData}
          labelComponent={<ChartLabel />}
          colorScale={colorThemes.criticalImportantModerateLow}
        />
      }
      labels={({ datum }) => `${datum.x}: ${datum.y}`}
      padding={{
        bottom: 20,
        left: 20,
        right: 145,
        top: 20,
      }}
      title={`${data.length}`}
      subTitle={t('Total issues')}
      width={400}
      height={200}
      colorScale={colorThemes.criticalImportantModerateLow}
    />
  )
}

function DetailsView(props: {
  setDetailsView: React.Dispatch<React.SetStateAction<boolean>>
  selectedReport: PolicyReportResults | undefined
}) {
  const { setDetailsView, selectedReport } = props
  const { configMapsState } = useSharedAtoms()
  const [configmaps] = useRecoilState(configMapsState)
  const contentMap = configmaps.find((cm) => cm.metadata.name === 'insight-content-data')
  let policyContentData = contentMap?.data && contentMap?.data[selectedReport?.policy ?? '']
  policyContentData = policyContentData && JSON.parse(policyContentData)
  const { t } = useTranslation()
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
                {t('The impact of the problem would be {{totalRisk}} if it occurred').replace(
                  '{{totalRisk}}',
                  totalRisk
                )}
              </Text>
            </TextContent>
          </FlexItem>
        </Flex>
      )
    }

    switch (riskScore) {
      case '4':
        totalRisk = t('Critical')
        riskIcon = <CriticalRiskIcon />
        return riskComponent(totalRisk, riskIcon)
      case '3':
        totalRisk = t('Important')
        riskIcon = <ImportantRiskIcon />
        return riskComponent(totalRisk, riskIcon)
      case '2':
        totalRisk = t('Moderate')
        riskIcon = <ModerateRiskIcon />
        return riskComponent(totalRisk, riskIcon)
      case '1':
        totalRisk = t('Low')
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

  function getExtraData() {
    const extraData = _.get(selectedReport, 'properties.extra_data', {})
    if (typeof extraData === 'string') {
      try {
        return JSON.parse(extraData)
      } catch (err) {
        console.error(err)
        return {}
      }
    }
    return extraData
  }

  return (
    <div className={classes.body}>
      <Flex className={classes.backAction}>
        <FlexItem spacer={{ default: 'spacerSm' }}>
          <AngleLeftIcon color={'var(--pf-global--palette--black-500)'} />
        </FlexItem>
        <FlexItem>
          <Button variant="link" isInline component="span" onClick={() => setDetailsView(false)}>
            {t('Back')}
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
                <Text component={TextVariants.small}>{t('Total risk')}</Text>
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
                <Text component={TextVariants.small}>{t('Category')}</Text>
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
                <Text component={TextVariants.small}>{t('Matched on')}</Text>
              </TextContent>
            </FlexItem>
          </Flex>
          {matchedDate()}
        </GridItem>
      </Grid>
      <Tabs activeKey={tabState} onSelect={(_e, tabIndex) => setTabState(tabIndex)} isFilled={true}>
        <Tab eventKey={0} title={<TabTitleText>{t('How to remediate')}</TabTitleText>}>
          <TextContent>
            <Markdown template={policyContentData?.resolution ?? ''} definitions={getExtraData()} />
          </TextContent>
        </Tab>
        <Tab eventKey={1} title={<TabTitleText>{t('Reason')}</TabTitleText>}>
          <TextContent>
            <Markdown template={policyContentData?.reason ?? ''} definitions={getExtraData()} />
          </TextContent>
        </Tab>
      </Tabs>
    </div>
  )
}

export function ClusterPolicySidebar(props: { data: PolicyReport }) {
  const classes = useStyles()
  const { t } = useTranslation()
  const [detailsView, setDetailsView] = useState<boolean>(false)
  const [selectedReport, setSelectedReport] = useState<PolicyReportResults>()
  const policyReportViolations = props.data?.results?.filter((violation) => violation.source === 'insights')
  return detailsView ? (
    <DetailsView setDetailsView={setDetailsView} selectedReport={selectedReport} />
  ) : (
    <div className={classes.body}>
      <TextContent className={classes.titleText}>
        <Text component={TextVariants.h2}>
          {t('policy.identified.issues', { count: policyReportViolations.length })}
        </Text>
        <Text component={TextVariants.p}>
          {t(
            'Identified issues from your cluster in different categories. We Identify and prioritize risks and issues to security, configuration, health, performance, availability, and stability of your clusters.'
          )}
        </Text>
      </TextContent>
      <div className={classes.donutContainer}>{renderDonutChart(policyReportViolations, t)}</div>
      <TextContent className={classes.tableTitle}>
        <Text component={TextVariants.h4}>{t('Recommendations with remediation')}</Text>
      </TextContent>
      <AcmTable<PolicyReportResults>
        items={policyReportViolations}
        emptyState={
          <AcmEmptyState
            title={t('No recommendations found')}
            message={t('You do not have any recommendations yet.')}
          />
        }
        initialSort={{
          index: 2, // default to sorting by highest risk
          direction: 'desc',
        }}
        columns={[
          {
            header: t('Description'),
            search: (report) => report.policy + ': ' + report.message,
            sort: (a: PolicyReportResults, b: PolicyReportResults) =>
              compareStrings(a.policy + ': ' + a.message, b.policy + ': ' + b.message),
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
                {item.policy + ': ' + item.message}
              </Button>
            ),
          },
          {
            header: t('Category'),
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
            header: t('Total risk'),
            search: (policyReport) => policyReport.properties.total_risk,
            sort: (a: PolicyReportResults, b: PolicyReportResults) =>
              compareStrings(a.properties.total_risk, b.properties.total_risk),
            cell: (item: PolicyReportResults) => item.properties.total_risk,
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
