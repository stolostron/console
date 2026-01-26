/* Copyright Contributors to the Open Cluster Management project */

import { renderHook } from '@testing-library/react-hooks'
import { Namespace, NamespaceDefinition, ResourceAttributes } from '../resources'
import { nockIgnoreApiPaths, nockRBAC } from './nock-util'
import {
  areAllNamespacesUnauthorized,
  getAuthorizedNamespaces,
  isAnyNamespaceAuthorized,
  useIsAnyNamespaceAuthorized,
} from './rbac-util'
import { waitForNocks } from './test-util'

// Mock the shared-recoil module
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

jest.mock('../shared-recoil', () => ({
  useSharedAtoms: () => ({
    namespacesState: 'namespacesState',
  }),
  useRecoilValue: () => mockNamespaces,
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
  it('checks each namespace individually for non-admin users', async () => {
    nockIgnoreApiPaths()
    const nocks = [
      nockRBAC(adminAccess, false),
      nockRBAC({ ...createDeployment, namespace: 'test-namespace-1' }, false),
      nockRBAC({ ...createDeployment, namespace: 'test-namespace-2' }, true),
    ]
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
    await waitForNocks(nocks)
  })
  it('returns false for an empty namespace list', async () => {
    expect(await isAnyNamespaceAuthorized(Promise.resolve(createDeployment), []).promise).toEqual(false)
  })
  it('returns true without checking namespaces for an admin user', async () => {
    nockIgnoreApiPaths()
    const nocks = [nockRBAC(adminAccess, true)]
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
    await waitForNocks(nocks)
  })
})

describe('areAllNamespacesUnauthorized', () => {
  it('checks each namespace individually for non-admin users', async () => {
    nockIgnoreApiPaths()
    const nocks = [
      nockRBAC(adminAccess, false),
      nockRBAC({ ...createDeployment, namespace: 'test-namespace-1' }, false),
      nockRBAC({ ...createDeployment, namespace: 'test-namespace-2' }, true),
    ]
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
    await waitForNocks(nocks)
  })
  it('returns true for an empty namespace list', async () => {
    expect(await areAllNamespacesUnauthorized(Promise.resolve(createDeployment), []).promise).toEqual(true)
  })
  it('returns false without checking namespaces for an admin user', async () => {
    nockIgnoreApiPaths()
    const nocks = [nockRBAC(adminAccess, true)]
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
    await waitForNocks(nocks)
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
    const nocks = [
      nockRBAC(adminAccess, false),
      nockRBAC({ ...resourceAttributes1, namespace: 'test-namespace-1' }, false),
      nockRBAC({ ...resourceAttributes1, namespace: 'test-namespace-2' }, true),
    ]

    // Render the hook with the first resourceAttributes object
    const { rerender, waitForNextUpdate } = renderHook(
      ({ attrs }: { attrs: ResourceAttributes }) => useIsAnyNamespaceAuthorized(Promise.resolve(attrs)),
      { initialProps: { attrs: resourceAttributes1 } }
    )

    // Wait for the initial network requests to complete
    await waitForNextUpdate()
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
    rerender({ attrs: resourceAttributes2 })

    // If additional network requests were made, the test would fail because
    // we haven't set up additional nock mocks for them
    // Give it a moment to ensure no additional requests are made
    await new Promise((resolve) => setTimeout(resolve, 100))
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
    const nocks = [
      nockRBAC(adminAccess, false),
      nockRBAC({ ...resourceAttributes, namespace: 'test-namespace-1' }, false),
      nockRBAC({ ...resourceAttributes, namespace: 'test-namespace-2' }, true),
    ]

    // The hook callback creates a new Promise on each render, simulating
    // a common pattern where Promise.resolve({...}) is called inline
    const { rerender, waitForNextUpdate } = renderHook(() =>
      useIsAnyNamespaceAuthorized(Promise.resolve({ ...resourceAttributes }))
    )

    await waitForNextUpdate()
    await waitForNocks(nocks)

    // Rerender multiple times - each creates a new Promise object
    // but should NOT trigger new network requests
    rerender()
    rerender()
    rerender()

    // If additional network requests were made, the test would fail because
    // we haven't set up additional nock mocks for them
    await new Promise((resolve) => setTimeout(resolve, 100))
  })
})
