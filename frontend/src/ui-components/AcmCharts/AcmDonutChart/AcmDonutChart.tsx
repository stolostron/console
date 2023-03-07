/* Copyright Contributors to the Open Cluster Management project */

import { makeStyles } from '@mui/styles'
import { ChartDonut, ChartLabel, ChartLegend } from '@patternfly/react-charts'
import { Badge, Card, CardTitle, Skeleton } from '@patternfly/react-core'

import { Link } from 'react-router-dom'
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
}
type LegendData = {
  name?: string
  link?: string
}

/* istanbul ignore next */
const useStyles = makeStyles({
  card: {
    maxHeight: '259px',
    minWidth: (props: StyleProps) => (props.viewWidth > 376 ? '376px' : undefined),
    maxWidth: (props: StyleProps) => (props.viewWidth < 376 ? '376px' : undefined),
    '& .pf-c-chart > svg g path:last-of-type': {
      fill: (props: StyleProps) => (props.danger ? '#E62325 !important' : undefined),
    },
  },
  cardTitle: {
    paddingBottom: 'unset !important',
  },
  chartContainer: {
    maxWidth: '376px',
  },
  skeleton: {
    margin: '0 0 20px 35px',
  },
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
      <ChartLabel {...props} />
    </Link>
  ) : (
    <ChartLabel {...props} />
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
  const legendData: Array<LegendData> = props.data.map((d) => ({ name: `${d.value} ${d.key}`, link: d.link }))
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

  const { viewWidth } = useViewport()
  const classes = useStyles({ ...props, danger: props.data.some((d) => d.isDanger), viewWidth } as StyleProps)

  if (props.loading) return loadingDonutChart(props.title, classes)
  return (
    <Card className={classes.card} id={`${props.title.toLowerCase().replace(/\s+/g, '-')}-chart`}>
      <CardTitle className={classes.cardTitle}>
        {props.title} <Badge isRead>{total}</Badge>
      </CardTitle>
      <div className={classes.chartContainer}>
        <ChartDonut
          ariaTitle={props.title}
          ariaDesc={props.description}
          legendOrientation="vertical"
          legendPosition="right"
          constrainToVisibleArea={true}
          data={chartData}
          legendData={legendData}
          legendComponent={buildLegendWithLinks(legendData, props.colorScale)}
          labels={({ datum }) => `${datum.x}: ${((datum.y / total) * 100).toFixed(2)}%`}
          padding={{
            bottom: 20,
            left: 20,
            right: 145,
            top: 20,
          }}
          title={donutLabel}
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

const criticalColorClass = 'var(--pf-chart-color-red-100)'
const importantColorClass = 'var(--pf-chart-color-orange-300)'
const moderateColorClass = 'var(--pf-chart-color-gold-300)'
const lowColorClass = 'var(--pf-chart-color-blue-200)'
const successColorClass = 'var(--pf-chart-color-black-100)'
const unknownColorClass = 'var(--pf-chart-color-black-300)'

export const colorThemes = {
  criticalImportantSuccess: [criticalColorClass, importantColorClass, successColorClass],
  criticalSuccess: [criticalColorClass, successColorClass],
  criticalLowSuccess: [criticalColorClass, moderateColorClass, successColorClass],
  criticalImportantModerateLow: [criticalColorClass, importantColorClass, moderateColorClass, lowColorClass],
  criticalLowUnknownSuccess: [criticalColorClass, lowColorClass, unknownColorClass, successColorClass],
}
