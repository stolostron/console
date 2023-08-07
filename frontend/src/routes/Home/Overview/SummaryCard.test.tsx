/* Copyright Contributors to the Open Cluster Management project */

import { CriticalRiskIcon } from '@patternfly/react-icons'
import { render, waitFor } from '@testing-library/react'
import { axe } from 'jest-axe'
import { BrowserRouter } from 'react-router-dom'
import SummaryCard from './SummaryCard'

describe('SummaryCard', () => {
  const ValidSummaryCardWithLink = () => {
    return (
      <BrowserRouter>
        <SummaryCard
          title={'Cluster recommendations'}
          summaryTotalHeader={'1 cluster affected'}
          summaryData={[
            { icon: undefined, label: 'Critical', count: 10 },
            { icon: undefined, label: 'Important', count: 11 },
            { icon: undefined, label: 'Moderate', count: 12 },
            { icon: undefined, label: 'Low', count: 13 },
          ].map((sevRating) => {
            return {
              label: sevRating.label,
              count: sevRating.count,
              link: {
                type: 'link',
                path: '/test/path',
              },
              icon: sevRating.icon,
            }
          })}
          insights
        />
      </BrowserRouter>
    )
  }
  const ValidSummaryCardWithButton = () => {
    return (
      <BrowserRouter>
        <SummaryCard
          title={'Cluster recommendations'}
          summaryData={[
            { icon: <CriticalRiskIcon />, label: 'Critical', count: 5 },
            { icon: undefined, label: 'Important', count: 0 },
            { icon: undefined, label: 'Moderate', count: 0 },
            { icon: undefined, label: 'Low', count: 0 },
          ].map((sevRating) => {
            return {
              label: sevRating.label,
              count: sevRating.count,
              link: {
                type: 'button',
                path: '/test/path',
              },
              icon: sevRating.icon,
            }
          })}
        />
      </BrowserRouter>
    )
  }

  test('has zero accessibility defects', async () => {
    const { container } = render(<ValidSummaryCardWithLink />)
    expect(await axe(container)).toHaveNoViolations()
  })

  test('Renders correctly', async () => {
    const { getByText } = render(<ValidSummaryCardWithLink />)

    await waitFor(() => expect(getByText('Cluster recommendations')).toBeTruthy())
    await waitFor(() => expect(getByText('1 cluster affected')).toBeTruthy())
    await waitFor(() => expect(getByText('Powered by Insights')).toBeTruthy())
    await waitFor(() => expect(getByText('11')).toBeTruthy())
  })

  test('Renders correctly with button', async () => {
    const { getByText } = render(<ValidSummaryCardWithButton />)

    await waitFor(() => expect(getByText('Cluster recommendations')).toBeTruthy())
    await waitFor(() => expect(getByText('Insights data coming soon')).toBeTruthy())
    await waitFor(() => expect(getByText('5')).toBeTruthy())
  })
})
