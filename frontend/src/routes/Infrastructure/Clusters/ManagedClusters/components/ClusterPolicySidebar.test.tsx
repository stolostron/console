/* Copyright Contributors to the Open Cluster Management project */

import {
  t_color_blue_10,
  t_color_blue_50,
  t_color_orange_40,
  t_color_red_60,
  t_color_yellow_40,
} from '@patternfly/react-tokens'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { MemoryRouter } from 'react-router'
import { StateProvider } from '~/lib/state-provider'
import { clickByText, waitForText } from '../../../../../lib/test-util'
import { PolicyReport } from '../../../../../resources'
import { ClusterPolicySidebar } from './ClusterPolicySidebar'

const mockPolicyReports: PolicyReport = {
  apiVersion: 'wgpolicyk8s.io/v1alpha2',
  kind: 'PolicyReport',
  metadata: {
    name: 'test-cluster',
    namespace: 'test-cluster',
    uid: 'uid.report.risk.1',
  },
  results: [
    {
      category: 'category,category1,category2',
      scored: false,
      source: 'insights',
      properties: {
        created_at: '2021-03-02T21:26:04Z',
        total_risk: '1',
        component: 'rule.id.1',
        reason: 'testing-reason',
        resolution: 'testing-resolution',
      },
      message: 'policyreport testing risk 1: details',
      policy: 'insights.example.advisor-policy-prefix',
      result: 'policyreport testing risk 1 result',
    },
    {
      category: 'category,category1,category2',
      scored: false,
      source: 'insights',
      properties: {
        created_at: '2021-03-02T21:26:04Z',
        total_risk: '2',
        component: 'rule.id.2',
      },
      message: 'policyreport testing risk 2',
      policy: 'policyreport testing risk 2 policy',
      result: 'policyreport testing risk 2 result',
    },
    {
      category: 'category,category1,category2',
      scored: false,
      source: 'insights',
      properties: {
        created_at: '2021-04-02T21:26:04Z',
        total_risk: '3',
        component: 'rule.id.3',
        reason: 'testing-reason',
        resolution: 'testing-resolution',
      },
      message: 'policyreport testing risk 3',
      policy: 'policyreport testing risk 3 policy',
      result: 'policyreport testing risk 3 result',
    },
    {
      category: 'category,category1,category2',
      scored: false,
      source: 'insights',
      properties: {
        created_at: '2021-03-02T21:26:04Z',
        total_risk: '4',
        component: 'rule.id.4',
        reason: 'testing-reason',
        resolution: 'testing-resolution',
      },
      message: 'policyreport testing risk 4',
      policy: 'policyreport testing risk 4 policy',
      result: 'policyreport testing risk 4 result',
    },
    {
      category: 'category,category1,category2',
      scored: false,
      source: 'grc',
      properties: {
        created_at: '2021-03-02T21:26:04Z',
        total_risk: '4',
        component: 'rule.id.4',
        reason: 'testing-reason',
        resolution: 'testing-resolution',
      },
      message: 'policyreport testing risk 4',
      policy: 'policyreport testing risk 4 policy',
      result: 'policyreport testing risk 4 result',
    },
  ],
}

describe('ClusterPolicySidebar', () => {
  const Component = () => (
    <StateProvider>
      <MemoryRouter>
        <ClusterPolicySidebar data={mockPolicyReports} />
      </MemoryRouter>
    </StateProvider>
  )

  test('has no accessibility violations in the recommendation description cell', async () => {
    render(<Component />)
    const description = await screen.findByRole('cell', { name: 'policyreport testing risk 1: details' })
    expect(await axe(description)).toHaveNoViolations()
  })

  test('shows the issue count with an ordered heading structure in the summary', async () => {
    const { container } = render(<Component />)

    expect(await screen.findByRole('heading', { name: 'Issues Identified: 4', level: 2 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Recommendations with remediation', level: 3 })).toBeInTheDocument()
    expect(await axe(container, { runOnly: ['heading-order'] })).toHaveNoViolations()
  })

  test('uses text rather than a heading for the severity in recommendation details', async () => {
    const { container } = render(<Component />)
    await clickByText('policyreport testing risk 2')

    expect(await screen.findByRole('heading', { name: 'policyreport testing risk 2', level: 2 })).toBeInTheDocument()
    expect(screen.getByText('Moderate')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Moderate' })).not.toBeInTheDocument()
    expect(await axe(container, { runOnly: ['heading-order'] })).toHaveNoViolations()
  })

  test('uses the OpenShift Insights palette for the donut and severity icons', async () => {
    render(<Component />)

    const chart = (await screen.findByText('Total issues')).closest('svg')
    for (const severity of ['Critical', 'Important', 'Moderate', 'Low']) {
      expect(await screen.findByText(`1 ${severity}`)).toBeInTheDocument()
    }
    const icons = Array.from(chart?.querySelectorAll<SVGSVGElement>('g[aria-hidden="true"] > svg.pf-v6-svg') ?? [])
    const slices = Array.from(chart?.querySelectorAll<SVGPathElement>('path[style*="fill"]') ?? [])
    expect(icons).toHaveLength(4)
    expect(slices).toHaveLength(4)

    // Normalize the fills through a color property so hex and rgb compare equally.
    const color = document.createElement('span').style
    const normalizeColor = (value: string) => {
      color.color = value
      return color.color
    }
    const sharedColors = [t_color_red_60.value, t_color_orange_40.value, t_color_yellow_40.value]
    expect(slices.map((slice) => normalizeColor(slice.style.fill))).toEqual(
      [...sharedColors, t_color_blue_10.value].map(normalizeColor)
    )
    expect(icons.map((icon) => normalizeColor(icon.style.color))).toEqual(
      [...sharedColors, t_color_blue_50.value].map(normalizeColor)
    )
  })

  test.each([
    ['Critical', 'policyreport testing risk 4', 0],
    ['Important', 'policyreport testing risk 3', 1],
    ['Moderate', 'policyreport testing risk 2', 2],
    ['Low', 'policyreport testing risk 1: details', 3],
  ])('uses the %s legend icon and color in the recommendation details', async (severity, message, legendIndex) => {
    const { container } = render(<Component />)
    const chart = (await screen.findByText('Total issues')).closest('svg')
    const legendIcon = chart?.querySelectorAll<SVGSVGElement>('g[aria-hidden="true"] > svg.pf-v6-svg')[legendIndex]
    const iconPath = legendIcon?.querySelector('path')?.getAttribute('d')
    expect(iconPath).toBeTruthy()

    await clickByText(message)

    expect(await screen.findByText(severity)).toBeInTheDocument()
    const detailIcon = Array.from(container.querySelectorAll('svg[aria-hidden="true"]')).find(
      (icon) => icon.querySelector('path')?.getAttribute('d') === iconPath
    )
    expect(detailIcon).toBeInTheDocument()
    expect(detailIcon).toHaveStyle({ color: legendIcon?.style.color })
  })

  test('can search by the hidden policy identifier', async () => {
    const user = userEvent.setup()
    render(<Component />)
    await screen.findByText('policyreport testing risk 2')

    await user.type(screen.getByPlaceholderText('Search'), 'insights.example.advisor-policy-prefix')

    await waitFor(() => expect(screen.queryByText('policyreport testing risk 2')).not.toBeInTheDocument())
    expect(screen.getByText('policyreport testing risk 1: details')).toBeInTheDocument()
  })

  test('renders', async () => {
    render(<Component />)
    // Check the sidebar has loaded with static text
    await waitForText(
      'Identified issues from your cluster in different categories. We Identify and prioritize risks and issues to security, configuration, health, performance, availability, and stability of your clusters.'
    )

    // Show the full message, including its colon, without the policy name.
    await clickByText('policyreport testing risk 1: details')

    // wait for drilldown risk subdetail component
    await waitForText('Low')

    // wait for resolution
    await waitForText('testing-resolution')

    // wait for reason
    await clickByText('Reason')
    await waitForText('testing-reason')

    // Click back button and wait for static text
    await clickByText('Back')
    await waitForText(
      'Identified issues from your cluster in different categories. We Identify and prioritize risks and issues to security, configuration, health, performance, availability, and stability of your clusters.'
    )

    // Click the moderate recommendation.
    await clickByText('policyreport testing risk 2')
    // wait for drilldown risk subdetail component
    await waitForText('Moderate')

    // check reason and resolution not present
    expect(screen.queryByText('testing-resolution')).not.toBeInTheDocument()
    await clickByText('Reason')
    expect(screen.queryByText('testing-reason')).not.toBeInTheDocument()

    // Click back button and wait for static text
    await clickByText('Back')

    // Click the important recommendation.
    await clickByText('policyreport testing risk 3')
    // wait for drilldown risk subdetail component
    await waitForText('Important')
    // Click back button and wait for static text
    await clickByText('Back')

    // Click the critical recommendation.
    await clickByText('policyreport testing risk 4')
    // wait for drilldown risk subdetail component
    await waitForText('Critical')
    // Click back button and wait for static text
    await clickByText('Back')
  })
})
