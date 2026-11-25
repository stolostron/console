/* Copyright Contributors to the Open Cluster Management project */

import { ChartDonut, ChartLabel, ChartLegend } from '@patternfly/react-charts/victory'
import {
  Button,
  Flex,
  FlexItem,
  Grid,
  GridItem,
  Tab,
  Tabs,
  TabTitleText,
  Content,
  ContentVariants,
} from '@patternfly/react-core'
import {
  AngleLeftIcon,
  FlagIcon,
  ListIcon,
  OutlinedClockIcon,
  RhUiSeverityCriticalFillIcon,
  RhUiSeverityImportantFillIcon,
  RhUiSeverityMinorFillIcon,
  RhUiSeverityModerateFillIcon,
} from '@patternfly/react-icons'
import { TableGridBreakpoint } from '@patternfly/react-table'
import {
  t_color_blue_10,
  t_color_blue_50,
  t_color_orange_40,
  t_color_red_60,
  t_color_yellow_40,
} from '@patternfly/react-tokens'
import { Markdown } from '@redhat-cloud-services/rule-components/Markdown'
import _ from 'lodash'
import { useState } from 'react'
import type { TFunction } from 'i18next'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { PolicyReport, PolicyReportResults } from '../../../../../resources'
import { AcmEmptyState, AcmLabels, AcmTable, compareStrings } from '../../../../../ui-components'
import { getTextWidth } from '../../../../../ui-components/utils'
import {
  backAction,
  body,
  donutContainer,
  riskSubDetail,
  subDetailComponents,
  tableTitle,
  titleText,
} from '../../../../Governance/common/policySidebarStyles'

const RISK_STYLES = {
  critical: { Icon: RhUiSeverityCriticalFillIcon, color: t_color_red_60.value },
  important: { Icon: RhUiSeverityImportantFillIcon, color: t_color_orange_40.value },
  moderate: { Icon: RhUiSeverityModerateFillIcon, color: t_color_yellow_40.value },
  low: { Icon: RhUiSeverityMinorFillIcon, color: t_color_blue_50.value },
}

type RiskLevel = keyof typeof RISK_STYLES

// The OpenShift Insights popup uses a lighter blue for the Low slice than for its icon.
const LOW_RISK_SLICE_COLOR = t_color_blue_10.value

function getRiskLevels(t: TFunction): { risk: RiskLevel; label: string; score: string }[] {
  return [
    { risk: 'critical', label: t('Critical'), score: '4' },
    { risk: 'important', label: t('Important'), score: '3' },
    { risk: 'moderate', label: t('Moderate'), score: '2' },
    { risk: 'low', label: t('Low'), score: '1' },
  ]
}

function RiskIcon({ risk }: { risk: RiskLevel }) {
  const { Icon, color } = RISK_STYLES[risk]
  return <Icon style={{ color }} />
}

function RiskLegendSymbol({ datum, x = 0, y = 0 }: { datum?: { risk: RiskLevel }; x?: number; y?: number }) {
  if (!datum) return null
  return (
    <g aria-hidden="true" transform={`translate(${x}, ${y - 5})`}>
      <RiskIcon risk={datum.risk} />
    </g>
  )
}

function renderDonutChart(data: PolicyReportResults[], t: TFunction) {
  const clusterRiskScores = data.map((issue) => issue.properties.total_risk)
  const counts = getRiskLevels(t).map(({ risk, label, score }) => ({
    risk,
    label,
    count: clusterRiskScores.filter((riskScore) => riskScore === score).length,
  }))
  const innerRadius = 67
  const subtitleText = t('Total issues')
  const shouldPlaceSubtitleAtBottom = getTextWidth(subtitleText) > 2 * innerRadius - 12

  return (
    <ChartDonut
      ariaTitle={t('Cluster violations')}
      ariaDesc={t('Donut chart of cluster violations')}
      legendOrientation="vertical"
      constrainToVisibleArea
      data={counts.map(({ label, count }) => ({ x: label, y: count }))}
      legendData={counts.map(({ risk, label, count }) => ({ risk, name: `${count} ${label}` }))}
      legendComponent={
        <ChartLegend
          title={t('Total risk')}
          titleComponent={<ChartLabel dx={13} dy={-10} style={{ fontWeight: 'bold', fontSize: '14px' }} />}
          dataComponent={<RiskLegendSymbol />}
          labelComponent={<ChartLabel />}
          x={-10}
          rowGutter={-3}
        />
      }
      labels={({ datum }) => `${datum.x}: ${datum.y}`}
      padding={{
        bottom: shouldPlaceSubtitleAtBottom ? 36 : 0,
        left: 135,
        right: 10,
        top: 0,
      }}
      title={`${data.length}`}
      subTitle={subtitleText}
      subTitleComponent={<ChartLabel style={{ fill: 'var(--pf-t--chart--color--black--500)' }} />}
      subTitlePosition={shouldPlaceSubtitleAtBottom ? 'bottom' : undefined}
      width={320}
      height={shouldPlaceSubtitleAtBottom ? 216 : 180}
      radius={80}
      innerRadius={innerRadius}
      padAngle={0}
      colorScale={counts.map(({ risk }) => (risk === 'low' ? LOW_RISK_SLICE_COLOR : RISK_STYLES[risk].color))}
    />
  )
}

function DetailsView(props: {
  setDetailsView: React.Dispatch<React.SetStateAction<boolean>>
  selectedReport: PolicyReportResults | undefined
}) {
  const { setDetailsView, selectedReport } = props
  const { t } = useTranslation()
  const [tabState, setTabState] = useState<string | number>(0)

  function renderRiskLevel() {
    const level = getRiskLevels(t).find(({ score }) => score === selectedReport?.properties?.total_risk)
    if (!level) return null

    return (
      <Flex className={riskSubDetail} direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsNone' }}>
        <FlexItem>
          <Flex alignItems={{ default: 'alignItemsCenter' }}>
            <FlexItem>
              <RiskIcon risk={level.risk} />
            </FlexItem>
            <FlexItem>
              <strong>{level.label}</strong>
            </FlexItem>
          </Flex>
        </FlexItem>
        <FlexItem>
          <Content>
            <Content component={ContentVariants.p}>
              {t('The impact of the problem would be {{totalRisk}} if it occurred', { totalRisk: level.label })}
            </Content>
          </Content>
        </FlexItem>
      </Flex>
    )
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
    <div className={body}>
      <Flex className={backAction}>
        <FlexItem spacer={{ default: 'spacerSm' }}>
          <AngleLeftIcon />
        </FlexItem>
        <FlexItem>
          <Button variant="link" isInline component="span" onClick={() => setDetailsView(false)}>
            {t('Back')}
          </Button>
        </FlexItem>
      </Flex>
      <Content className={titleText}>
        <Content component={ContentVariants.h2}>{_.get(selectedReport, 'message', '')}</Content>
      </Content>
      <Grid className={subDetailComponents} hasGutter>
        <GridItem span={5}>
          <Flex>
            <FlexItem>
              <FlagIcon />
            </FlexItem>
            <FlexItem>
              <Content>
                <Content component={ContentVariants.small}>{t('Total risk')}</Content>
              </Content>
            </FlexItem>
          </Flex>
          {renderRiskLevel()}
        </GridItem>
        <GridItem span={4}>
          <Flex>
            <FlexItem>
              <ListIcon />
            </FlexItem>
            <FlexItem>
              <Content>
                <Content component={ContentVariants.small}>{t('Category')}</Content>
              </Content>
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
              <Content>
                <Content component={ContentVariants.small}>{t('Matched on')}</Content>
              </Content>
            </FlexItem>
          </Flex>
          {matchedDate()}
        </GridItem>
      </Grid>
      <Tabs activeKey={tabState} onSelect={(_e, tabIndex) => setTabState(tabIndex)} isFilled={true}>
        <Tab eventKey={0} title={<TabTitleText>{t('How to remediate')}</TabTitleText>}>
          <Content>
            <Markdown template={selectedReport?.properties?.resolution ?? ''} definitions={getExtraData()} />
          </Content>
        </Tab>
        <Tab eventKey={1} title={<TabTitleText>{t('Reason')}</TabTitleText>}>
          <Content>
            <Markdown template={selectedReport?.properties?.reason ?? ''} definitions={getExtraData()} />
          </Content>
        </Tab>
      </Tabs>
    </div>
  )
}

export function ClusterPolicySidebar(props: { data: PolicyReport }) {
  const { t } = useTranslation()
  const [detailsView, setDetailsView] = useState<boolean>(false)
  const [selectedReport, setSelectedReport] = useState<PolicyReportResults>()
  const policyReportViolations = props.data?.results?.filter((violation) => violation.source === 'insights')
  return detailsView ? (
    <DetailsView setDetailsView={setDetailsView} selectedReport={selectedReport} />
  ) : (
    <div className={body}>
      <Content className={titleText}>
        <Content component={ContentVariants.h2}>
          {t('Issues Identified: {{issueCount}}', { issueCount: policyReportViolations.length })}
        </Content>
        <Content component={ContentVariants.p}>
          {t(
            'Identified issues from your cluster in different categories. We Identify and prioritize risks and issues to security, configuration, health, performance, availability, and stability of your clusters.'
          )}
        </Content>
      </Content>
      <div className={donutContainer}>{renderDonutChart(policyReportViolations, t)}</div>
      <Content className={tableTitle}>
        <Content component={ContentVariants.h3}>{t('Recommendations with remediation')}</Content>
      </Content>
      <AcmTable<PolicyReportResults>
        aria-label={t('Cluster policy reports table')}
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
