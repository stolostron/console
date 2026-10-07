/* Copyright Contributors to the Open Cluster Management project */

import { renderHook, waitFor } from '@testing-library/react'
import nock from 'nock'
import type { PropsWithChildren } from 'react'
import { managedClusterSetsState } from '../../../../../atoms'
import { StateProvider } from '../../../../../lib/state-provider'
import { nockIgnoreApiPaths, nockIgnoreRBAC, nockRBAC } from '../../../../../lib/nock-util'
import { mockGlobalClusterSet, mockManagedClusterSet } from '../../../../../lib/test-metadata'
import {
  ManagedClusterSet,
  ManagedClusterSetApiVersion,
  ManagedClusterSetKind,
  SelfSubjectAccessReview,
} from '../../../../../resources'
import { useCanJoinClusterSets } from './useCanJoinClusterSets'

const mockManagedClusterSetTransfer: ManagedClusterSet = {
  apiVersion: ManagedClusterSetApiVersion,
  kind: ManagedClusterSetKind,
  metadata: {
    name: 'test-cluster-set-transfer',
  },
  spec: {},
}

function createWrapper(clusterSets: ManagedClusterSet[]) {
  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <StateProvider
        initializeStore={(store) => {
          store.set(managedClusterSetsState, clusterSets)
        }}
      >
        {children}
      </StateProvider>
    )
  }
}

function nockNonAdminAccess() {
  return nock(process.env.JEST_DEFAULT_HOST as string)
    .persist()
    .post('/apis/authorization.k8s.io/v1/selfsubjectaccessreviews', (body: SelfSubjectAccessReview) => {
      const resourceAttributes = body.spec?.resourceAttributes
      return resourceAttributes?.verb === '*' && resourceAttributes?.resource === '*'
    })
    .optionally()
    .reply(201, (_uri, requestBody: SelfSubjectAccessReview) => ({
      apiVersion: 'authorization.k8s.io/v1',
      kind: 'SelfSubjectAccessReview',
      metadata: {},
      spec: requestBody.spec,
      status: { allowed: false },
    }))
}

function nockJoinClusterSet(clusterSetName: string, allowed: boolean) {
  return nockRBAC(
    {
      name: clusterSetName,
      resource: 'managedclustersets',
      subresource: 'join',
      verb: 'create',
      group: 'cluster.open-cluster-management.io',
    },
    allowed
  )
}

describe('useCanJoinClusterSets', () => {
  beforeEach(() => {
    nockIgnoreApiPaths()
  })

  test('returns empty list when there are no managed cluster sets', async () => {
    const { result } = renderHook(() => useCanJoinClusterSets(), {
      wrapper: createWrapper([]),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.canJoinClusterSets).toEqual([])
    expect(result.current.canJoinGlobalClusterSet).toBe(false)
  })

  test('admin can join regular sets and global when global exists', async () => {
    nockIgnoreRBAC()

    const { result } = renderHook(() => useCanJoinClusterSets(), {
      wrapper: createWrapper([mockManagedClusterSet, mockGlobalClusterSet, mockManagedClusterSetTransfer]),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.canJoinClusterSets?.map((mcs) => mcs.metadata.name)).toEqual([
      mockManagedClusterSet.metadata.name,
      mockManagedClusterSetTransfer.metadata.name,
    ])
    expect(result.current.canJoinGlobalClusterSet).toBe(true)
  })

  test('admin canJoinGlobalClusterSet is false when global set is absent', async () => {
    nockIgnoreRBAC()

    const { result } = renderHook(() => useCanJoinClusterSets(), {
      wrapper: createWrapper([mockManagedClusterSet, mockManagedClusterSetTransfer]),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.canJoinClusterSets?.map((mcs) => mcs.metadata.name)).toEqual([
      mockManagedClusterSet.metadata.name,
      mockManagedClusterSetTransfer.metadata.name,
    ])
    expect(result.current.canJoinGlobalClusterSet).toBe(false)
  })

  test('non-admin with global join keeps canJoinGlobalClusterSet true and excludes global from destinations', async () => {
    nockNonAdminAccess()
    nockJoinClusterSet(mockManagedClusterSet.metadata.name!, true)
    nockJoinClusterSet(mockManagedClusterSetTransfer.metadata.name!, false)
    nockJoinClusterSet(mockGlobalClusterSet.metadata.name!, true)

    const { result } = renderHook(() => useCanJoinClusterSets(), {
      wrapper: createWrapper([mockManagedClusterSet, mockManagedClusterSetTransfer, mockGlobalClusterSet]),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.canJoinClusterSets?.map((mcs) => mcs.metadata.name)).toEqual([
      mockManagedClusterSet.metadata.name,
    ])
    expect(result.current.canJoinGlobalClusterSet).toBe(true)
  })

  test('non-admin without global join sets canJoinGlobalClusterSet false', async () => {
    nockNonAdminAccess()
    nockJoinClusterSet(mockManagedClusterSet.metadata.name!, true)
    nockJoinClusterSet(mockManagedClusterSetTransfer.metadata.name!, true)
    nockJoinClusterSet(mockGlobalClusterSet.metadata.name!, false)

    const { result } = renderHook(() => useCanJoinClusterSets(), {
      wrapper: createWrapper([mockManagedClusterSet, mockManagedClusterSetTransfer, mockGlobalClusterSet]),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.canJoinClusterSets?.map((mcs) => mcs.metadata.name)).toEqual([
      mockManagedClusterSet.metadata.name,
      mockManagedClusterSetTransfer.metadata.name,
    ])
    expect(result.current.canJoinGlobalClusterSet).toBe(false)
  })

  test('non-admin authorized only for global has empty destinations and canJoinGlobalClusterSet true', async () => {
    nockNonAdminAccess()
    nockJoinClusterSet(mockManagedClusterSet.metadata.name!, false)
    nockJoinClusterSet(mockGlobalClusterSet.metadata.name!, true)

    const { result } = renderHook(() => useCanJoinClusterSets(), {
      wrapper: createWrapper([mockManagedClusterSet, mockGlobalClusterSet]),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.canJoinClusterSets).toEqual([])
    expect(result.current.canJoinGlobalClusterSet).toBe(true)
  })
})
