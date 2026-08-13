/* Copyright Contributors to the Open Cluster Management project */
import { render, waitFor } from '@testing-library/react'
import { axe } from 'jest-axe'
import { searchClient } from '~/routes/Search/search-sdk/search-client'
import SharedResourceWarning, { RESOURCE_TYPES } from './SharedResourceWarning'

jest.mock('~/routes/Search/search-sdk/search-client', () => ({
  searchClient: {
    query: jest.fn(),
  },
}))

const mockSearchQuery = searchClient.query as jest.Mock

const buildControl = () => ({
  editMode: true,
  hubClusterName: 'local-cluster',
  groupControlData: [
    {
      id: 'channel',
      content: [
        {
          id: 'selfLinks',
          active: {
            Subscription: '/apis/apps.open-cluster-management.io/v1/namespaces/test-ns/subscriptions/test-sub',
          },
        },
      ],
    },
  ],
})

const mockHostingSubscription = (name: string) => {
  mockSearchQuery.mockResolvedValue({
    data: {
      searchResult: [
        {
          items: [{ _hostingSubscription: `test-ns/${name}` }],
        },
      ],
    },
  })
}

describe('SharedResourceWarning', () => {
  beforeEach(() => {
    mockSearchQuery.mockReset()
  })

  it('escapes HTML in the deploying subscription name to prevent injection (ACM-38694)', async () => {
    mockHostingSubscription('<img src=x onerror="alert(1)">')

    const { container } = render(
      <SharedResourceWarning resourceType={RESOURCE_TYPES.HCM_SUBSCRIPTIONS} control={buildControl()} />
    )

    await waitFor(() => expect(container.querySelector('.shared-resource-warning')).toBeTruthy())

    // The subscription name must be rendered as React-escaped text, never as live
    // markup, so an injected payload cannot become a real DOM element (CWE-79).
    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('script')).toBeNull()
    expect(container.textContent).toContain('img src=x onerror')
  })

  it('has no accessibility violations for a benign subscription name', async () => {
    mockHostingSubscription('deploying-sub')

    const { container } = render(
      <SharedResourceWarning resourceType={RESOURCE_TYPES.HCM_SUBSCRIPTIONS} control={buildControl()} />
    )

    await waitFor(() => expect(container.querySelector('.shared-resource-warning')).toBeTruthy())

    expect(await axe(container)).toHaveNoViolations()
  })
})
