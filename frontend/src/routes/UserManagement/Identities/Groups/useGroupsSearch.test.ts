/* Copyright Contributors to the Open Cluster Management project */
import { searchClient } from '../../../Search/search-sdk/search-client'
import { SearchResultItemsDocument } from '../../../Search/search-sdk/search-sdk'
import { findIndexedGroupName } from './useGroupsSearch'

jest.mock('../../../Search/search-sdk/search-client', () => ({
  searchClient: { query: jest.fn() },
}))

const mockSearchQuery = searchClient.query as jest.Mock

function mockSearchItems(items: Array<Record<string, unknown> | null | undefined>) {
  mockSearchQuery.mockResolvedValue({
    data: {
      searchResult: [{ items }],
    },
  })
}

describe('findIndexedGroupName', () => {
  beforeEach(() => {
    mockSearchQuery.mockReset()
    mockSearchQuery.mockResolvedValue({ data: { searchResult: [{ items: [] }] } })
  })

  test('queries Search for hub Groups with the uid lookup limit', async () => {
    await findIndexedGroupName('any-id', 'local-cluster')

    expect(mockSearchQuery).toHaveBeenCalledTimes(1)
    expect(mockSearchQuery).toHaveBeenCalledWith({
      query: SearchResultItemsDocument,
      variables: {
        input: [
          {
            filters: [
              { property: 'kind', values: ['Group'] },
              { property: 'apigroup', values: ['user.openshift.io'] },
              { property: 'cluster', values: ['local-cluster'] },
            ],
            limit: 10000,
          },
        ],
      },
    })
  })

  test('returns the group name when the route id matches item name', async () => {
    mockSearchItems([{ name: 'kubevirt-admins', _uid: 'local-cluster/other-uid' }])

    await expect(findIndexedGroupName('kubevirt-admins', 'local-cluster')).resolves.toBe('kubevirt-admins')
  })

  test('returns the group name when the route id matches item _uid exactly', async () => {
    mockSearchItems([{ name: 'kubevirt-admins', _uid: 'kubevirt-admins-uid' }])

    await expect(findIndexedGroupName('kubevirt-admins-uid', 'local-cluster')).resolves.toBe('kubevirt-admins')
  })

  test('returns the group name when the route id matches hub-prefixed _uid', async () => {
    mockSearchItems([{ name: 'kubevirt-admins', _uid: 'local-cluster/kubevirt-admins-uid' }])

    await expect(findIndexedGroupName('kubevirt-admins-uid', 'local-cluster')).resolves.toBe('kubevirt-admins')
  })

  test('returns the group name when item _uid ends with /id', async () => {
    mockSearchItems([{ name: 'ops-team', _uid: 'remote-hub/ops-team-uid' }])

    await expect(findIndexedGroupName('ops-team-uid', 'local-cluster')).resolves.toBe('ops-team')
  })

  test('skips items without a string name', async () => {
    mockSearchItems([
      { name: 123, _uid: 'local-cluster/bad-name' },
      { _uid: 'local-cluster/missing-name' },
      null,
      { name: 'good-group', _uid: 'local-cluster/good-uid' },
    ])

    await expect(findIndexedGroupName('good-uid', 'local-cluster')).resolves.toBe('good-group')
  })

  test('returns undefined when Search finds no matching group', async () => {
    mockSearchItems([{ name: 'other-group', _uid: 'local-cluster/other-uid' }])

    await expect(findIndexedGroupName('missing-uid', 'local-cluster')).resolves.toBeUndefined()
  })

  test('returns undefined when Search returns no items', async () => {
    mockSearchQuery.mockResolvedValue({ data: { searchResult: [] } })

    await expect(findIndexedGroupName('any-id', 'local-cluster')).resolves.toBeUndefined()
  })

  test('returns undefined when Search result data is missing', async () => {
    mockSearchQuery.mockResolvedValue({ data: undefined })

    await expect(findIndexedGroupName('any-id', 'local-cluster')).resolves.toBeUndefined()
  })
})
