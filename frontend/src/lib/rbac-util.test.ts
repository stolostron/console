/* Copyright Contributors to the Open Cluster Management project */

import { Namespace, NamespaceDefinition } from '../resources'
import { nockIgnoreApiPaths, nockRBAC } from './nock-util'
import { areAllNamespacesUnauthorized, getAuthorizedNamespaces, isAnyNamespaceAuthorized } from './rbac-util'
import { waitForNocks } from './test-util'

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
