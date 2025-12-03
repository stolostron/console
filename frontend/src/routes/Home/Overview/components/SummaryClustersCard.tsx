/* Copyright Contributors to the Open Cluster Management project */

import { ChartDonut, ChartLabel, ChartLegend, ChartPie } from '@patternfly/react-charts'
import { Card, CardTitle } from '@patternfly/react-core'
import { useMemo } from 'react'
import { Link } from 'react-router-dom-v5-compat'
import { Truncate } from '../../../../components/Truncate'
import { getTextWidth } from '../../../../ui-components/utils'

type Data = {
  key: string
  value: number
  link?: string
}
type LegendData = {
  name: string
  link?: string
}

const LegendLabel = ({
  maxWidth,
  ...props
}: {
  maxWidth?: number
  datum?: { name?: string; link?: string }
  x?: number
  y?: number
  style?: React.CSSProperties
}) => {
  const link = props.datum?.link
  const name = props.datum?.name ?? ''

  // Use foreignObject to render HTML content (Truncate component) inside SVG
  const content = (
    <foreignObject x={props.x} y={(props.y ?? 0) - 10} width={maxWidth ?? 150} height={20}>
      <div
        style={{
          color: 'var(--pf-v5-global--Color--100)',
        }}
      >
        {link ? (
          <Link to={link} style={{ color: 'inherit' }}>
            <Truncate content={name} position="end" tooltipPosition="top" style={{ textDecoration: 'underline' }} />
          </Link>
        ) : (
          <Truncate content={name} position="end" tooltipPosition="top" />
        )}
      </div>
    </foreignObject>
  )

  return content
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

  const chartWidth = 150
  const availableWidth = 0.8 * chartWidth
  const subtitleText = chartLabel?.subTitle ?? ''
  const subtitleWidth = getTextWidth(subtitleText)
  const shouldPlaceSubtitleAtBottom = subtitleWidth > availableWidth

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
        subTitlePosition={shouldPlaceSubtitleAtBottom ? 'bottom' : undefined}
        padding={{
          bottom: shouldPlaceSubtitleAtBottom ? 25 : 15,
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
  }, [chartData, chartLabel?.subTitle, chartLabel?.title, colorScale, isPieChart, title, shouldPlaceSubtitleAtBottom])

  const FONT_SIZE = 12
  const FONT_FAMILY = 'RedHatText'
  const ITEMS_PER_COLUMN = 6
  const GUTTER = 16
  const ROW_GUTTER = -5
  const SYMBOL = 8
  const SYMBOL_SPACER = 8
  const ROW_HEIGHT = 18.5
  const MAX_LABEL_WIDTH = 140 // Maximum width for each label before truncation

  // Split legend data into columns
  const legendColumns = useMemo(() => {
    const columns: Array<LegendData>[] = []
    for (let i = 0; i < legendData.length; i += ITEMS_PER_COLUMN) {
      columns.push(legendData.slice(i, i + ITEMS_PER_COLUMN))
    }
    return columns
  }, [legendData])

  const columnWidth = MAX_LABEL_WIDTH + SYMBOL + SYMBOL_SPACER
  const columnHeight = ITEMS_PER_COLUMN * ROW_HEIGHT

  return (
    <Card
      id={`${title.toLowerCase().replace(/\s+/g, '-')}-chart`}
      isRounded
      style={{
        height: '200px',
        overflow: 'hidden',
        ['--pf-v5-c-card__title--not--last-child--PaddingBottom' as any]: 0,
      }}
    >
      <CardTitle>{title}</CardTitle>
      <div style={{ display: 'flex', height: '150px', alignItems: 'center', overflow: 'hidden' }}>
        <div style={{ width: '150px', minWidth: '100px', marginRight: '16px', flexShrink: 1 }}>{chart}</div>
        <div style={{ display: 'flex', gap: `${GUTTER}px`, flexShrink: 1, overflow: 'hidden' }}>
          {legendColumns.map((columnData) => (
            <ChartLegend
              key={`legend-col-${columnData[0]?.name}`}
              labelComponent={<LegendLabel maxWidth={MAX_LABEL_WIDTH} />}
              data={columnData}
              rowGutter={ROW_GUTTER}
              symbolSpacer={SYMBOL_SPACER}
              height={columnHeight}
              width={columnWidth}
              orientation={'vertical'}
              style={{ labels: { fontSize: FONT_SIZE, fontFamily: FONT_FAMILY } }}
            />
          ))}
        </div>
      </div>
    </Card>
  )
}
