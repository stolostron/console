/* Copyright Contributors to the Open Cluster Management project */

import { css } from '@emotion/css'
import { ChartDonut, ChartLabel, ChartLegend } from '@patternfly/react-charts'
import { Badge, Card, CardTitle, Skeleton } from '@patternfly/react-core'

import { Link } from 'react-router-dom-v5-compat'
import { useViewport } from '../AcmChartGroup'

type StyleProps = {
  danger?: boolean
  viewWidth: number
}
type Data = {
  key: string
  value: number
  isPrimary?: boolean
  isDanger?: boolean
  link?: string
  useForTitleCount?: boolean
}
type LegendData = {
  name?: string
  link?: string
}

/* istanbul ignore next */
const getStyles = (props: StyleProps) => ({
  card: css({
    maxHeight: '259px',
    minWidth: props.viewWidth > 376 ? '376px' : undefined,
    maxWidth: props.viewWidth < 376 ? '376px' : undefined,
    '& .pf-c-chart > svg g path:last-of-type': {
      fill: props.danger ? '#E62325 !important' : undefined,
    },
  }),
  cardTitle: css({
    paddingBottom: 'unset !important',
  }),
  chartContainer: css({
    maxWidth: '376px',
  }),
  skeleton: css({
    margin: '0 0 20px 35px',
  }),
})

export const loadingDonutChart = (
  title: string,
  classes: Record<'card' | 'cardTitle' | 'chartContainer' | 'skeleton', string>
) => {
  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      <div className={classes.chartContainer}>
        <Skeleton shape="circle" width="45%" className={classes.skeleton} />
      </div>
    </Card>
  )
}

const LegendLabel = ({ ...props }: { datum?: Data }) => {
  /*istanbul ignore next */
  const link = props.datum?.link
  return link ? (
    <Link to={link}>
      <ChartLabel {...props} style={{ fill: 'var(--pf-v5-global--Color--100)' }} />
    </Link>
  ) : (
    <ChartLabel {...props} style={{ fill: 'var(--pf-v5-global--Color--100)' }} />
  )
}

function buildLegendWithLinks(legendData: Array<LegendData>, colorScale?: string[]) {
  return <ChartLegend data={legendData} labelComponent={<LegendLabel />} colorScale={colorScale} />
}

export function AcmDonutChart(props: {
  title: string
  description: string
  data: Array<Data>
  loading?: boolean
  colorScale?: string[]
  donutLabel?: {
    title: string
    subTitle: string
  }
}) {
  const chartData = props.data.map((d) => ({ x: d.key, y: d.value }))
  const legendData: Array<LegendData> = props.data.map((d) => ({
    name: `${d.value} ${d.key}`,
    link: d.link,
  }))
  const total = props.data.reduce((a, b) => a + b.value, 0)
  /* istanbul ignore next */
  const primary = props.data.find((d) => d.isPrimary) || { key: '', value: 0 }
  let donutLabel = ''
  if (props.donutLabel) {
    donutLabel = props.donutLabel.title
  } else if (total === 0) {
    donutLabel = '0%'
  } else {
    donutLabel = `${Math.round((primary.value / total) * 100)}%`
  }

  let badgeTotal = total

  for (const val of props.data) {
    if (val.useForTitleCount) {
      badgeTotal = val.value

      break
    }
  }

  const { viewWidth } = useViewport()
  const classes = getStyles({ ...props, danger: props.data.some((d) => d.isDanger), viewWidth } as StyleProps)

  if (props.loading) return loadingDonutChart(props.title, classes)
  return (
    <Card className={classes.card} id={`${props.title.toLowerCase().replace(/\s+/g, '-')}-chart`}>
      <CardTitle className={classes.cardTitle}>
        {props.title} <Badge isRead>{badgeTotal}</Badge>
      </CardTitle>
      <div className={classes.chartContainer}>
        <ChartDonut
          ariaTitle={props.title}
          ariaDesc={props.description}
          legendOrientation="vertical"
          legendPosition="right"
          constrainToVisibleArea={true}
          data={chartData}
          legendComponent={buildLegendWithLinks(legendData, props.colorScale)}
          labels={({ datum }) => `${datum.x}: ${((datum.y / total) * 100).toFixed(2)}%`}
          padding={{
            bottom: 20,
            left: 20,
            right: 145,
            top: 20,
          }}
          title={donutLabel}
          titleComponent={
            <ChartLabel
              style={[
                {
                  fontSize: '24px',
                  fill: 'var(--pf-v5-global--Color--100)', // title color
                },
                {
                  fill: 'var(--pf-v5-chart-donut--label--subtitle--Fill)', // subtitle color
                },
              ]}
            />
          }
          subTitle={props.donutLabel?.subTitle ?? primary.key}
          width={/* istanbul ignore next */ viewWidth < 376 ? viewWidth : 376}
          height={/* istanbul ignore next */ viewWidth < 376 ? 150 : 200}
          // Devs can supply an array of colors the donut chart will use ex: ['#E62325', '#EC7A08', '#F4C145', '#2B9AF3', '#72767B']
          // Defaults to blue theme
          colorScale={props.colorScale}
        />
      </div>
    </Card>
  )
}

const criticalColorClass = 'var(--pf-v5-global--palette--red-200)'
const importantColorClass = 'var(--pf-v5-global--palette--orange-400)'
const moderateColorClass = 'var(--pf-v5-global--palette--gold-400)'
const lowColorClass = 'var(--pf-v5-global--palette--black-500)'
const successColorClass = 'var(--pf-v5-global--palette--blue-300)'
const unknownColorClass = 'var(--pf-v5-global--palette--black-300)'

export const colorThemes = {
  criticalImportantSuccess: [criticalColorClass, importantColorClass, successColorClass],
  criticalSuccess: [criticalColorClass, successColorClass],
  criticalLowSuccess: [criticalColorClass, lowColorClass, successColorClass],
  criticalImportantModerateLow: [criticalColorClass, importantColorClass, moderateColorClass, lowColorClass],
  criticalLowUnknownSuccess: [criticalColorClass, lowColorClass, unknownColorClass, successColorClass],
  criticalSuccessUnknown: [criticalColorClass, successColorClass, unknownColorClass],
}
