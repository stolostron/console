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
  name: string
  link?: string
}

const LegendLabel = ({ ...props }) => {
  const link = props.datum?.link
  const chartLabel = <ChartLabel {...props} style={{ fill: 'var(--pf-v5-global--Color--100)' }} />
  return link ? <Link to={link}>{chartLabel}</Link> : chartLabel
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

  const chart = useMemo(() => {
    const commonProps = {
      ariaTitle: title,
      data: chartData,
      colorScale: colorScale,
      name: title,
      width: 150,
      height: 150,
      constrainToVisibleArea: true,
    }
    const component = isPieChart ? (
      <ChartPie
        {...commonProps}
        padding={{
          bottom: 15,
          left: 24,
          top: 15,
        }}
      />
    ) : (
      <ChartDonut
        {...commonProps}
        subTitle={chartLabel?.subTitle ?? ''}
        subTitlePosition={(chartLabel?.subTitle ?? '').length > 14 ? 'bottom' : undefined}
        padding={{
          bottom: (chartLabel?.subTitle ?? '').length > 14 ? 25 : 15,
          left: 24,
          top: 15,
        }}
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

  const FONT_SIZE = 12
  const FONT_FAMILY = 'RedHatText'
  const ITEMS_PER_COLUMN = 6
  const GUTTER = 10
  const ROW_GUTTER = -5
  const SYMBOL = 8
  const SYMBOL_SPACER = 8
  const ROW_HEIGHT = 18.5

  const getLabelWidth = (legendData: string) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.font = `${FONT_SIZE}px ${FONT_FAMILY}`
      const width = ctx.measureText(legendData).width
      return width
    } else return 150
  }

  const legendWidth = useMemo(() => {
    const totalLabels = legendData.length
    const columns = Math.ceil(totalLabels / ITEMS_PER_COLUMN)
    let cumulativeLongestLabelWidth = 0
    for (let i = 0; i < columns; i++) {
      const longest = Math.max(
        ...legendData.slice(i * ITEMS_PER_COLUMN, (i + 1) * ITEMS_PER_COLUMN).map((item) => getLabelWidth(item.name))
      )
      cumulativeLongestLabelWidth += longest
    }
    return cumulativeLongestLabelWidth + columns * (SYMBOL + SYMBOL_SPACER + GUTTER)
  }, [legendData])

  const legendHeight = useMemo(() => {
    return (legendData.length < ITEMS_PER_COLUMN ? legendData.length : ITEMS_PER_COLUMN) * ROW_HEIGHT
  }, [legendData])

  return (
    <div>
      <Card
        id={`${title.toLowerCase().replace(/\s+/g, '-')}-chart`}
        isRounded
        style={{ height: '200px', ['--pf-v5-c-card__title--not--last-child--PaddingBottom' as any]: 0 }}
      >
        <CardTitle>{title}</CardTitle>
        <div style={{ display: 'flex', height: '150px', alignItems: 'center' }}>
          <div style={{ width: '150px', marginRight: '16px' }}>{chart}</div>
          <div>
            <ChartLegend
              labelComponent={<LegendLabel />}
              data={legendData}
              itemsPerRow={ITEMS_PER_COLUMN}
              rowGutter={ROW_GUTTER}
              gutter={GUTTER}
              symbolSpacer={SYMBOL_SPACER}
              height={legendHeight}
              width={legendWidth}
              orientation={'vertical'}
              style={{ labels: { fontSize: FONT_SIZE, fontFamily: FONT_FAMILY } }}
            />
          </div>
        </div>
      </Card>
    </div>
  )
}
