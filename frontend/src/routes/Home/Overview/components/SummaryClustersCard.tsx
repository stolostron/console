/* Copyright Contributors to the Open Cluster Management project */

import { ChartDonut, ChartLabel, ChartLegend, ChartPie } from '@patternfly/react-charts'
import { Card, CardTitle } from '@patternfly/react-core'
import { useMemo } from 'react'
import { Link } from 'react-router-dom-v5-compat'

type Data = {
  key: string
  value: number
  link?: string
}
type LegendData = {
  name?: string
  link?: string
}

const LegendLabel = ({ ...props }) => {
  const link = props.datum?.link
  return link ? (
    <Link to={link}>
      <ChartLabel {...props} style={{ fontSize: 12, fill: 'var(--pf-v5-global--Color--100)' }} />
    </Link>
  ) : (
    <ChartLabel {...props} style={{ fontSize: 12, fill: 'var(--pf-v5-global--Color--100)' }} />
  )
}

export function SummaryClustersCard(props: {
  isPieChart?: boolean
  title: string
  data: Array<Data>
  colorScale?: string[]
  chartLabel?: {
    title: string
    subTitle?: string
  }
}) {
  const { isPieChart, title, data, chartLabel, colorScale } = props
  const chartData = data.map((d) => ({ x: d.key, y: d.value, link: d.link }))
  const legendData: Array<LegendData> = chartData.map((d) => ({
    name: `${d.y} ${d.x}`,
    link: d.link,
  }))

  const offset = useMemo(
    () => (legendData.length < 6 ? (150 - legendData.length * 16) / 2 - legendData.length : (150 - 6 * 16) / 2 - 10),
    [legendData]
  )

  const chart = useMemo(() => {
    const commonProps = {
      ariaTitle: title,
      data: chartData,
      colorScale: colorScale,
      name: title,
      width: 150,
      height: 150,
      padding: {
        bottom: 15,
        left: 24,
        top: 15,
      },
      constrainToVisibleArea: true,
    }
    const component = isPieChart ? (
      <ChartPie {...commonProps} />
    ) : (
      <ChartDonut
        {...commonProps}
        subTitle={chartLabel?.subTitle ?? ''}
        title={chartLabel?.title}
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
      />
    )

    return component
  }, [chartData, chartLabel?.subTitle, chartLabel?.title, colorScale, isPieChart, title])

  const legendWidth = useMemo(() => {
    const columns = Math.trunc(legendData.length / 6)
    const remainder = legendData.length % 6 > 0 ? 150 : 0
    return columns * 150 + remainder
  }, [legendData])

  const legend = useMemo(() => {
    return (
      <div>
        <ChartLegend
          labelComponent={<LegendLabel />}
          data={legendData}
          itemsPerRow={6}
          rowGutter={-5}
          gutter={10}
          symbolSpacer={8}
          height={150}
          width={legendWidth}
          orientation={'vertical'}
          y={offset}
        />
      </div>
    )
  }, [legendData, legendWidth, offset])

  return (
    <div>
      <Card
        id={`${title.toLowerCase().replace(/\s+/g, '-')}-chart`}
        isRounded
        style={{ height: '200px', ['--pf-v5-c-card__title--not--last-child--PaddingBottom' as any]: 0 }}
      >
        <CardTitle>{title}</CardTitle>
        <div style={{ display: 'flex', height: '150px' }}>
          <div style={{ width: '150px', marginRight: '16px' }}>{chart}</div>
          {legend}
        </div>
      </Card>
    </div>
  )
}
