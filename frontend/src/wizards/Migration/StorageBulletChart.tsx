/* Copyright Contributors to the Open Cluster Management project */
import { Chart, ChartBar, ChartStack, ChartContainer } from '@patternfly/react-charts'
import { Divider, Flex, FlexItem, Text, TextContent } from '@patternfly/react-core'

interface StorageBulletChartProps {
  used: number
  reserved: number
  total: number
}

export function StorageBulletChart(props: StorageBulletChartProps) {
  const { used, reserved, total } = props
  const free = total - used - reserved

  return (
    <div style={{ width: 300, marginRight: '2rem', marginTop: '1rem' }}>
      <TextContent>
        <Text component="p">Storage: {total} GB</Text>
      </TextContent>

      <Chart
        domain={{ y: [0, total] }}
        domainPadding={0}
        height={20}
        padding={{ top: 0, bottom: 0, left: 0, right: 0 }}
        containerComponent={<ChartContainer />}
      >
        <ChartStack horizontal>
          <ChartBar data={[{ x: 1, y: used }]} style={{ data: { fill: 'black' } }} />
          <ChartBar data={[{ x: 1, y: reserved }]} style={{ data: { fill: '#06c' } }} />
          <ChartBar data={[{ x: 1, y: free }]} style={{ data: { fill: '#f0f0f0' } }} />
        </ChartStack>
      </Chart>
      <Divider />
      <Flex style={{ marginTop: '0.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <FlexItem style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 10, height: 10, background: 'black' }} />
          <Text component="small">{used} GB used</Text>
        </FlexItem>
        <FlexItem style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 10, height: 10, background: '#f0f0f0' }} />
          <Text component="small">{free} GB free</Text>
        </FlexItem>
      </Flex>
    </div>
  )
}
