/* Copyright Contributors to the Open Cluster Management project */

import { render, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom-v5-compat'
import { SummaryClustersCard } from './SummaryClustersCard'

describe('SummaryClustersCard', () => {
  test('Renders SummaryClustersCard pie chart', async () => {
    const { getByText } = render(
      <BrowserRouter>
        <SummaryClustersCard
          isPieChart={true}
          title={'ClustersCardTitle'}
          data={[
            {
              key: 'item1',
              value: 1,
              link: '/item1/link',
            },
            {
              key: 'item2',
              value: 2,
            },
          ]}
          chartLabel={{
            title: 'chart-title',
            subTitle: 'chart-sub-title',
          }}
        />
      </BrowserRouter>
    )
    // check legend items
    await waitFor(() => expect(getByText(/1 item1/i)).toBeTruthy())
    await waitFor(() => expect(getByText(/2 item2/i)).toBeTruthy())
  })

  test('Renders SummaryClustersCard Donut chart', async () => {
    const { getByText } = render(
      <BrowserRouter>
        <SummaryClustersCard
          isPieChart={false}
          title={'ClustersCardTitle'}
          data={[1, 2, 3, 4, 5, 6, 7].map((index) => ({
            key: `item${index}`,
            value: index,
            link: `/item${index}/link`,
          }))}
          chartLabel={{
            title: 'chart-title',
            subTitle: 'chart-sub-title',
          }}
        />
      </BrowserRouter>
    )
    // Check title strings
    await waitFor(() => expect(getByText('chart-title')).toBeTruthy())
    await waitFor(() => expect(getByText('chart-sub-title')).toBeTruthy())
    // check legend items
    await waitFor(() => expect(getByText(/1 item1/i)).toBeTruthy())
    await waitFor(() => expect(getByText(/2 item2/i)).toBeTruthy())
  })
})
