/* Copyright Contributors to the Open Cluster Management project */

import { render, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom-v5-compat'
import { SummaryStatusCard } from './SummaryStatusCard'

describe('SummaryStatusCard', () => {
  test('Renders SummaryStatusCard pie chart', async () => {
    const { getByText } = render(
      <BrowserRouter>
        <SummaryStatusCard
          key={'summary-status-card-test'}
          title={'Status-Test'}
          data={{
            mainSection: {
              title: 'status-card-title',
              description: 'status-card-desc',
              link: '/testlink',
            },
            statusSection: [
              {
                title: 'item1',
                count: 1,
              },
              {
                title: 'item2',
                count: 2,
                link: '/item2/link',
                icon: <>icon</>,
              },
            ],
          }}
        />
      </BrowserRouter>
    )
    // check card title
    await waitFor(() => expect(getByText('Status-Test')).toBeTruthy())
    await waitFor(() => expect(getByText('status-card-title')).toBeTruthy())
    await waitFor(() => expect(getByText('status-card-desc')).toBeTruthy())
    // check legend items
    await waitFor(() => expect(getByText('item1')).toBeTruthy())
  })
})
