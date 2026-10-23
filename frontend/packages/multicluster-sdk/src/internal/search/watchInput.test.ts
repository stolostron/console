/* Copyright Contributors to the Open Cluster Management project */

import { SearchInput } from '../../types/search'
import { eventMatchesQueryClusterFilter, toWatchInput } from './watchInput'

function makeEvent(
  operation: 'INSERT' | 'UPDATE' | 'DELETE',
  uid: string,
  newData: object | null,
  oldData: object | null = null
) {
  return { uid, operation, newData, oldData, timestamp: new Date() } as any
}

const mockInput: SearchInput = {
  filters: [{ property: 'kind', values: ['Pod'] }],
}

describe('toWatchInput', () => {
  it('strips query-only pagination and sort fields', () => {
    expect(
      toWatchInput({
        filters: [{ property: 'kind', values: ['Pod'] }],
        keywords: ['web'],
        limit: 10,
        offset: 20,
        orderBy: 'name asc',
        relatedKinds: ['Pod'],
      })
    ).toEqual({
      filters: [{ property: 'kind', values: ['Pod'] }],
      keywords: ['web'],
    })
  })
})

describe('eventMatchesQueryClusterFilter', () => {
  it('accepts all events when the query has no cluster filter', () => {
    expect(eventMatchesQueryClusterFilter(makeEvent('UPDATE', 'other/uid', {}), mockInput)).toBe(true)
  })

  it('accepts events whose uid cluster prefix is in the query cluster filter', () => {
    const input: SearchInput = {
      filters: [
        { property: 'kind', values: ['Group'] },
        { property: 'cluster', values: ['local-cluster'] },
      ],
    }
    expect(eventMatchesQueryClusterFilter(makeEvent('UPDATE', 'local-cluster/uid-1', {}), input)).toBe(true)
  })

  it('rejects events whose uid cluster prefix is outside the query cluster filter', () => {
    const input: SearchInput = {
      filters: [
        { property: 'kind', values: ['Group'] },
        { property: 'cluster', values: ['local-cluster'] },
      ],
    }
    expect(eventMatchesQueryClusterFilter(makeEvent('INSERT', 'remote-cluster/uid-1', {}), input)).toBe(false)
  })

  it('accepts bare Kubernetes resource UIDs when the query filters by cluster', () => {
    const input: SearchInput = {
      filters: [
        { property: 'kind', values: ['Group'] },
        { property: 'cluster', values: ['local-cluster'] },
      ],
    }
    expect(eventMatchesQueryClusterFilter(makeEvent('UPDATE', 'd55b07ae-137f-4b39-8a85-8fd053f8e5e7', {}), input)).toBe(
      true
    )
  })
})
