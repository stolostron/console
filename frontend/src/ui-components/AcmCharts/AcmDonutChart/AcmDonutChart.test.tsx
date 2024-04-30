/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { createBrowserHistory } from 'history'
import { axe } from 'jest-axe'
import { Router } from 'react-router-dom-v5-compat'
import { createMemoryHistory } from 'history'
import { AcmDonutChart } from './AcmDonutChart'

const history = createMemoryHistory()

const complianceData = [
  { key: 'Compliant', value: 1, isPrimary: true, link: '/linkToCompiantResources' },
  { key: 'Non-compliant', value: 1, isDanger: true },
]
const zeroData = [
  { key: 'Key1', value: 0, isPrimary: true },
  { key: 'Key2', value: 0, isDanger: true },
]
const podData = [
  { key: 'Running', value: 90, isPrimary: true },
  { key: 'Pending', value: 8 },
  { key: 'Failed', value: 2, isDanger: true },
]

describe('AcmDonutChart', () => {
  test('renders', () => {
    const { getByRole, getByTestId } = render(
      <Router location={history.location} navigator={history}>
        <AcmDonutChart
          title="Cluster compliance"
          description="Overview of policy compliance status"
          data={complianceData}
        />
      </Router>
    )
    expect(getByTestId('cluster-compliance-chart')).toBeInTheDocument()
    expect(getByRole('link')).toBeInTheDocument()
  })

  test('renders skeleton', () => {
    const { queryByText } = render(
      <Router location={history.location} navigator={history}>
        <AcmDonutChart loading={true} title="Cluster compliance" description="Policy compliance" data={[]} />
      </Router>
    )
    expect(queryByText('Cluster compliance')).toBeInTheDocument()
  })

  test('renders with zero values state', () => {
    const { queryByRole, getByText } = render(
      <Router location={history.location} navigator={history}>
        <AcmDonutChart title="Some title" description="Some description" data={zeroData} />
      </Router>
    )
    expect(getByText('0%')).toBeInTheDocument()
    expect(getByText('0 Key1')).toBeInTheDocument()
    expect(getByText('0 Key2')).toBeInTheDocument()
    expect(queryByRole('link')).toBeNull() // zeroData doesn't declare links.
  })

  test('has zero accessibility defects', async () => {
    const { container } = render(
      <Router location={history.location} navigator={history}>
        <AcmDonutChart title="Pods" description="Overview of pod count and status" data={podData} />
      </Router>
    )
    expect(await axe(container)).toHaveNoViolations()
  })

  test('alternate donut title text', async () => {
    const { queryByText } = render(
      <Router location={history.location} navigator={history}>
        <AcmDonutChart
          title="Pods"
          description="Overview of pod count and status"
          data={podData}
          donutLabel={{
            title: '100',
            subTitle: 'total pods',
          }}
        />
      </Router>
    )
    expect(queryByText('total pods')).toBeInTheDocument()
  })
})
