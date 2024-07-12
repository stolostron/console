/* Copyright Contributors to the Open Cluster Management project */

import { BrowserRouter } from 'react-router-dom-v5-compat'
import { AcmChartGroup } from '../AcmChartGroup'
import { AcmDonutChart } from './AcmDonutChart'

export default {
  title: 'Charts',
  component: AcmDonutChart,
}

export const DonutChart = () => {
  const complianceData = [
    {
      key: 'Compliant',
      value: 1,
      isPrimary: true,
      link: '/search?filters={"textsearch":"kind%3Apolicy%20compliant%3Acompliant"}',
    },
    {
      key: 'Non-compliant',
      value: 1,
      isDanger: true,
      link: '/search?filters={"textsearch":"kind%3Apolicy%20compliant%3Anoncompliant"}',
    },
  ]
  const podData = [
    {
      key: 'Running',
      value: 90,
      isPrimary: true,
      link: '/search?filters={"textsearch":"kind%3Apod%20status%3ARunning"}',
    },
    { key: 'Pending', value: 8 },
    { key: 'Failed', value: 2, isDanger: true },
  ]
  const clusterData = [
    { key: 'Ready', value: 2, isPrimary: true },
    { key: 'Offline', value: 1, isDanger: true },
  ]
  const insightData = [
    { key: 'Critical', value: 1 },
    { key: 'Important', value: 1 },
    { key: 'Moderate', value: 1 },
    { key: 'Low', value: 1 },
  ]
  return (
    <BrowserRouter>
      <AcmChartGroup>
        <AcmDonutChart
          title="Cluster violations"
          description="Overview of policy compliance status"
          data={complianceData}
        />
        <AcmDonutChart title="Pods" description="Overview of pod count and status" data={podData} />
        <AcmDonutChart title="Cluster status" description="Overview of cluster status" data={clusterData} />
        <AcmDonutChart
          title="Cluster issues"
          description="Overview of cluster issues"
          data={insightData}
          donutLabel={{
            title: '1',
            subTitle: 'Clusters with issues',
          }}
          colorScale={['#E62325', '#EC7A08', '#F4C145', '#2B9AF3', '#72767B']}
        />
      </AcmChartGroup>
    </BrowserRouter>
  )
}

export const DonutChartSkeleton = () => {
  return (
    <AcmChartGroup>
      <AcmDonutChart loading={true} title="Cluster violations" description="Policy compliance" data={[]} />
      <AcmDonutChart loading={true} title="Pods" description="Overview of pod count and status" data={[]} />
      <AcmDonutChart loading={true} title="Cluster status" description="Overview of cluster status" data={[]} />
    </AcmChartGroup>
  )
}
