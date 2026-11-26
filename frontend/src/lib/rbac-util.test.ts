/* Copyright Contributors to the Open Cluster Management project */

import { act, renderHook, waitFor } from '@testing-library/react'
import { Namespace, NamespaceDefinition, ResourceAttributes } from '../resources'
import { nockAnyNamespaceRBAC, nockIgnoreApiPaths, nockRBAC } from './nock-util'
import {
  areAllNamespacesUnauthorized,
  getAuthorizedNamespaces,
  isAnyNamespaceAuthorized,
  useIsAnyNamespaceAuthorized,
} from './rbac-util'
import { waitForNocks } from './test-util'

// Mock the shared-atoms module
const mockNamespaces: Namespace[] = [
  {
    ...(NamespaceDefinition as Pick<Namespace, 'apiVersion' | 'kind'>),
    metadata: { name: 'test-namespace-1' },
  },
  {
    ...(NamespaceDefinition as Pick<Namespace, 'apiVersion' | 'kind'>),
    metadata: { name: 'test-namespace-2' },
  },
]
let mockNamespacesForRBAC = mockNamespaces

jest.mock('../shared-atoms', () => ({
  useSharedAtoms: () => ({
    namespacesState: 'namespacesState',
  }),
  useSharedValue: () => mockNamespacesForRBAC,
}))

const adminAccess = { name: '*', namespace: '*', resource: '*', verb: '*' }
const createDeployment = {
  name: 'new-cluster-deployment',
  resource: 'clusterdeployments',
  verb: 'create',
  group: 'hive.openshift.io',
}

describe('getAuthorizedNamespaces', () => {
  it('checks each namespace individually for non-admin users', async () => {
    nockIgnoreApiPaths()
    const nocks = [
      nockRBAC(adminAccess, false),
      nockRBAC({ ...createDeployment, namespace: 'test-namespace-1' }, false),
      nockRBAC({ ...createDeployment, namespace: 'test-namespace-2' }, true),
    ]
    expect(
      await getAuthorizedNamespaces(
        [createDeployment],
        [
          {
            ...(NamespaceDefinition as Pick<Namespace, 'apiVersion' | 'kind'>),
            metadata: { name: 'test-namespace-1' },
          },
          {
            ...(NamespaceDefinition as Pick<Namespace, 'apiVersion' | 'kind'>),
            metadata: { name: 'test-namespace-2' },
          },
        ]
      )
    ).toEqual(['test-namespace-2'])
    await waitForNocks(nocks)
  })
})

describe('isAnyNamespaceAuthorized', () => {
  it('checks all visible namespaces with one backend request', async () => {
    nockIgnoreApiPaths()
    const namespaces = ['test-namespace-1', 'test-namespace-2']
    const nock = nockAnyNamespaceRBAC(createDeployment, namespaces, true)
    expect(
      await isAnyNamespaceAuthorized(
        Promise.resolve(createDeployment),
        namespaces.map((name) => ({
          ...(NamespaceDefinition as Pick<Namespace, 'apiVersion' | 'kind'>),
          metadata: { name },
        }))
      ).promise
    ).toEqual(true)
    await waitForNocks([nock])
  })
  it('returns false for an empty namespace list', async () => {
    expect(await isAnyNamespaceAuthorized(Promise.resolve(createDeployment), []).promise).toEqual(false)
  })
  it('returns true when the backend reports authorization', async () => {
    nockIgnoreApiPaths()
    const nock = nockAnyNamespaceRBAC(createDeployment, ['test-namespace-1', 'test-namespace-2'], true)
    expect(
      await isAnyNamespaceAuthorized(Promise.resolve(createDeployment), [
        {
          ...(NamespaceDefinition as Pick<Namespace, 'apiVersion' | 'kind'>),
          metadata: { name: 'test-namespace-1' },
        },
        {
          ...(NamespaceDefinition as Pick<Namespace, 'apiVersion' | 'kind'>),
          metadata: { name: 'test-namespace-2' },
        },
      ]).promise
    ).toEqual(true)
    await waitForNocks([nock])
  })
  it('does not report authorization when the backend request fails', async () => {
    nockIgnoreApiPaths()
    const nock = nockAnyNamespaceRBAC(createDeployment, ['test-namespace-1'], false, 503)
    expect(await isAnyNamespaceAuthorized(Promise.resolve(createDeployment), [mockNamespaces[0]]).promise).toEqual(
      false
    )
    await waitForNocks([nock])
  })
})

describe('areAllNamespacesUnauthorized', () => {
  it('returns true only when every namespace is confirmed denied', async () => {
    nockIgnoreApiPaths()
    const nock = nockAnyNamespaceRBAC(createDeployment, ['test-namespace-1', 'test-namespace-2'], false)
    expect(
      await areAllNamespacesUnauthorized(Promise.resolve(createDeployment), [
        {
          ...(NamespaceDefinition as Pick<Namespace, 'apiVersion' | 'kind'>),
          metadata: { name: 'test-namespace-1' },
        },
        {
          ...(NamespaceDefinition as Pick<Namespace, 'apiVersion' | 'kind'>),
          metadata: { name: 'test-namespace-2' },
        },
      ]).promise
    ).toEqual(true)
    await waitForNocks([nock])
  })
  it('returns true for an empty namespace list', async () => {
    expect(await areAllNamespacesUnauthorized(Promise.resolve(createDeployment), []).promise).toEqual(true)
  })
  it('returns false when the backend reports authorization', async () => {
    nockIgnoreApiPaths()
    const nock = nockAnyNamespaceRBAC(createDeployment, ['test-namespace-1', 'test-namespace-2'], true)
    expect(
      await areAllNamespacesUnauthorized(Promise.resolve(createDeployment), [
        {
          ...(NamespaceDefinition as Pick<Namespace, 'apiVersion' | 'kind'>),
          metadata: { name: 'test-namespace-1' },
        },
        {
          ...(NamespaceDefinition as Pick<Namespace, 'apiVersion' | 'kind'>),
          metadata: { name: 'test-namespace-2' },
        },
      ]).promise
    ).toEqual(false)
    await waitForNocks([nock])
  })
  it('does not treat backend failures as confirmed denial', async () => {
    nockIgnoreApiPaths()
    const nock = nockAnyNamespaceRBAC(createDeployment, ['test-namespace-1'], false, 503)
    expect(await areAllNamespacesUnauthorized(Promise.resolve(createDeployment), [mockNamespaces[0]]).promise).toEqual(
      false
    )
    await waitForNocks([nock])
  })
})

describe('useIsAnyNamespaceAuthorized', () => {
  it('does not repeat RBAC network requests when resourceAttributes is a new object reference with the same values', async () => {
    nockIgnoreApiPaths()

    // Create initial resourceAttributes
    const resourceAttributes1: ResourceAttributes = {
      name: 'test-deployment',
      resource: 'clusterdeployments',
      verb: 'create',
      group: 'hive.openshift.io',
    }

    // Set up nocks for the initial request - should only be called once
    const nocks = [nockAnyNamespaceRBAC(resourceAttributes1, ['test-namespace-1', 'test-namespace-2'], true)]

    // Render the hook with the first resourceAttributes object
    const { result, rerender } = renderHook(
      ({ attrs }: { attrs: ResourceAttributes }) => useIsAnyNamespaceAuthorized(Promise.resolve(attrs)),
      { initialProps: { attrs: resourceAttributes1 } }
    )

    // Wait for the initial network requests to complete
    await waitFor(() => expect(result.current).toBe(true))
    await waitForNocks(nocks)

    // Create a NEW object with the SAME values (different object reference)
    // This simulates what happens when a component re-renders and creates a new
    // resourceAttributes object inline, even though the values haven't changed
    const resourceAttributes2: ResourceAttributes = {
      name: 'test-deployment',
      resource: 'clusterdeployments',
      verb: 'create',
      group: 'hive.openshift.io',
    }

    // Rerender with the new object that has the same values
    // This should NOT trigger new network requests because the hook uses
    // JSON.stringify to compare the resourceAttributes, preventing unnecessary re-fetches
    await act(async () => {
      rerender({ attrs: resourceAttributes2 })
      await Promise.resolve()
      await Promise.resolve()
    })

    // If additional network requests were made, the test would fail because
    // we haven't set up additional nock mocks for them
  })

  it('does not repeat RBAC network requests on multiple rerenders with new promise objects', async () => {
    nockIgnoreApiPaths()

    const resourceAttributes: ResourceAttributes = {
      name: 'test-deployment',
      resource: 'clusterdeployments',
      verb: 'create',
      group: 'hive.openshift.io',
    }

    // Set up nocks for the initial request - should only be called once across all rerenders
    const nocks = [nockAnyNamespaceRBAC(resourceAttributes, ['test-namespace-1', 'test-namespace-2'], true)]

    // The hook callback creates a new Promise on each render, simulating
    // a common pattern where Promise.resolve({...}) is called inline
    const { result, rerender } = renderHook(() =>
      useIsAnyNamespaceAuthorized(Promise.resolve({ ...resourceAttributes }))
    )

    await waitFor(() => expect(result.current).toBe(true))
    await waitForNocks(nocks)

    // Rerender multiple times - each creates a new Promise object
    // but should NOT trigger new network requests
    await act(async () => {
      rerender()
      rerender()
      rerender()
      await Promise.resolve()
      await Promise.resolve()
    })

    // If additional network requests were made, the test would fail because
    // we haven't set up additional nock mocks for them
  })

  it('preserves authorization on errors and revokes it after confirmed denial', async () => {
    nockIgnoreApiPaths()
    const namespaces = ['test-namespace-1', 'test-namespace-2']
    const extendedNamespaces = [
      ...mockNamespaces,
      {
        ...(NamespaceDefinition as Pick<Namespace, 'apiVersion' | 'kind'>),
        metadata: { name: 'test-namespace-3' },
      },
    ]
    mockNamespacesForRBAC = mockNamespaces
    const nocks = [
      nockAnyNamespaceRBAC(createDeployment, namespaces, true),
      nockAnyNamespaceRBAC(createDeployment, [...namespaces, 'test-namespace-3'], false, 503),
      nockAnyNamespaceRBAC(createDeployment, namespaces, false),
    ]
    const { result, rerender } = renderHook(() => useIsAnyNamespaceAuthorized(Promise.resolve(createDeployment)))

    await waitFor(() => expect(result.current).toBe(true))
    await waitForNocks([nocks[0]])

    mockNamespacesForRBAC = extendedNamespaces
    await act(async () => {
      rerender()
      await Promise.resolve()
    })
    await waitForNocks([nocks[1]])
    expect(result.current).toBe(true)

    mockNamespacesForRBAC = [...mockNamespaces]
    await act(async () => {
      rerender()
      await Promise.resolve()
    })
    await waitFor(() => expect(result.current).toBe(false))
    await waitForNocks([nocks[2]])
  })
})
