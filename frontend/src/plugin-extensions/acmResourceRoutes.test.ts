/* Copyright Contributors to the Open Cluster Management project */

// mock react-router-dom-v5-compat
jest.mock('react-router-dom-v5-compat', () => ({
  generatePath: jest.fn(),
}))

// mock query-string
jest.mock('query-string', () => ({
  stringify: jest.fn(),
}))

import { acmResourceRouteHandler } from './acmResourceRoutes'
import { NavigationPath } from '../NavigationPath'
import { generatePath } from 'react-router-dom-v5-compat'
import * as queryString from 'query-string'

// get the mocked functions
const mockGeneratePath = generatePath as jest.MockedFunction<typeof generatePath>
const mockQueryStringStringify = queryString.stringify as jest.MockedFunction<typeof queryString.stringify>

describe('acmResourceRouteHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGeneratePath.mockImplementation((path: string, params: any) => {
      // simple mock implementation that replaces :param with actual values
      let result = path
      Object.keys(params).forEach((key) => {
        result = result.replace(`:${key}`, params[key])
      })
      return result
    })
    mockQueryStringStringify.mockImplementation((params: any) => {
      return Object.keys(params)
        .map((key) => `${key}=${params[key]}`)
        .join('&')
    })
  })

  describe('ManagedCluster routing', () => {
    it('routes to cluster overview page', () => {
      const result = acmResourceRouteHandler({
        cluster: 'test-cluster',
        namespace: undefined,
        name: 'my-cluster',
        resource: { cluster: 'test-cluster', metadata: { name: 'my-cluster' } },
        model: {
          group: 'cluster.open-cluster-management.io',
          kind: 'ManagedCluster',
          version: 'v1',
        },
      })

      expect(mockGeneratePath).toHaveBeenCalledWith(NavigationPath.clusterOverview, {
        namespace: 'my-cluster',
        name: 'my-cluster',
      })
      expect(result).toBe('/multicloud/infrastructure/clusters/details/my-cluster/my-cluster/overview')
    })

    it('uses name from resource metadata when parameter is missing', () => {
      const result = acmResourceRouteHandler({
        cluster: 'test-cluster',
        namespace: undefined,
        name: 'resource-cluster',
        resource: { cluster: 'test-cluster', metadata: { name: 'resource-cluster' } },
        model: {
          group: 'cluster.open-cluster-management.io',
          kind: 'ManagedCluster',
          version: 'v1',
        },
      })

      expect(mockGeneratePath).toHaveBeenCalledWith(NavigationPath.clusterOverview, {
        namespace: 'resource-cluster',
        name: 'resource-cluster',
      })
      expect(result).toBe('/multicloud/infrastructure/clusters/details/resource-cluster/resource-cluster/overview')
    })

    it('returns undefined when name is not provided', () => {
      const result = acmResourceRouteHandler({
        cluster: 'test-cluster',
        namespace: undefined,
        name: '',
        resource: { cluster: 'test-cluster', metadata: {} },
        model: {
          group: 'cluster.open-cluster-management.io',
          kind: 'ManagedCluster',
          version: 'v1',
        },
      })

      expect(result).toBeUndefined()
      expect(mockGeneratePath).not.toHaveBeenCalled()
    })
  })

  describe('Application routing', () => {
    it('routes app.k8s.io applications to overview page', () => {
      const result = acmResourceRouteHandler({
        cluster: 'test-cluster',
        namespace: 'app-namespace',
        name: 'my-app',
        resource: { cluster: 'test-cluster', metadata: { namespace: 'app-namespace', name: 'my-app' } },
        model: {
          group: 'app.k8s.io',
          kind: 'Application',
          version: 'v1beta1',
        },
      })

      expect(mockGeneratePath).toHaveBeenCalledWith(NavigationPath.applicationOverview, {
        namespace: 'app-namespace',
        name: 'my-app',
      })
      expect(mockQueryStringStringify).toHaveBeenCalledWith({
        apiVersion: 'application.app.k8s.io',
        cluster: 'test-cluster',
      })
      expect(result).toBe(
        '/multicloud/applications/details/app-namespace/my-app/details?apiVersion=application.app.k8s.io&cluster=test-cluster'
      )
    })

    it('routes argoproj.io applications to overview page', () => {
      const result = acmResourceRouteHandler({
        cluster: 'argo-cluster',
        namespace: 'argo-namespace',
        name: 'argo-app',
        resource: { cluster: 'argo-cluster', metadata: { namespace: 'argo-namespace', name: 'argo-app' } },
        model: {
          group: 'argoproj.io',
          kind: 'Application',
          version: 'v1alpha1',
        },
      })

      expect(mockGeneratePath).toHaveBeenCalledWith(NavigationPath.applicationOverview, {
        namespace: 'argo-namespace',
        name: 'argo-app',
      })
      expect(mockQueryStringStringify).toHaveBeenCalledWith({
        apiVersion: 'application.argoproj.io',
        cluster: 'argo-cluster',
      })
      expect(result).toBe(
        '/multicloud/applications/details/argo-namespace/argo-app/details?apiVersion=application.argoproj.io&cluster=argo-cluster'
      )
    })

    it('uses namespace from resource metadata when parameter is missing', () => {
      const result = acmResourceRouteHandler({
        cluster: 'test-cluster',
        namespace: undefined,
        name: 'my-app',
        resource: {
          cluster: 'test-cluster',
          metadata: { namespace: 'resource-namespace', name: 'my-app' },
        },
        model: {
          group: 'app.k8s.io',
          kind: 'Application',
          version: 'v1beta1',
        },
      })

      expect(mockGeneratePath).toHaveBeenCalledWith(NavigationPath.applicationOverview, {
        namespace: 'resource-namespace',
        name: 'my-app',
      })
      expect(result).toBe(
        '/multicloud/applications/details/resource-namespace/my-app/details?apiVersion=application.app.k8s.io&cluster=test-cluster'
      )
    })

    it('returns undefined when namespace is not provided', () => {
      const result = acmResourceRouteHandler({
        cluster: 'test-cluster',
        namespace: undefined,
        name: 'my-app',
        resource: { cluster: 'test-cluster', metadata: { name: 'my-app' } },
        model: {
          group: 'app.k8s.io',
          kind: 'Application',
          version: 'v1beta1',
        },
      })

      expect(result).toBeUndefined()
      expect(mockGeneratePath).not.toHaveBeenCalled()
    })

    it('uses cluster from resource when parameter is missing', () => {
      const result = acmResourceRouteHandler({
        cluster: 'resource-cluster',
        namespace: 'app-namespace',
        name: 'my-app',
        resource: { cluster: 'resource-cluster', metadata: { namespace: 'app-namespace', name: 'my-app' } },
        model: {
          group: 'app.k8s.io',
          kind: 'Application',
          version: 'v1beta1',
        },
      })

      expect(mockQueryStringStringify).toHaveBeenCalledWith({
        apiVersion: 'application.app.k8s.io',
        cluster: 'resource-cluster',
      })
      expect(result).toBe(
        '/multicloud/applications/details/app-namespace/my-app/details?apiVersion=application.app.k8s.io&cluster=resource-cluster'
      )
    })
  })

  describe('Policy routing', () => {
    it('routes to policy details page', () => {
      const result = acmResourceRouteHandler({
        cluster: 'test-cluster',
        namespace: 'policy-namespace',
        name: 'my-policy',
        resource: { cluster: 'test-cluster', metadata: { namespace: 'policy-namespace', name: 'my-policy' } },
        model: {
          group: 'policy.open-cluster-management.io',
          kind: 'Policy',
          version: 'v1',
        },
      })

      expect(mockGeneratePath).toHaveBeenCalledWith(NavigationPath.policyDetails, {
        namespace: 'policy-namespace',
        name: 'my-policy',
      })
      expect(result).toBe('/multicloud/governance/policies/details/policy-namespace/my-policy')
    })

    it('uses namespace from resource metadata', () => {
      const result = acmResourceRouteHandler({
        cluster: 'test-cluster',
        namespace: undefined,
        name: 'my-policy',
        resource: {
          cluster: 'test-cluster',
          metadata: { namespace: 'resource-namespace', name: 'my-policy' },
        },
        model: {
          group: 'policy.open-cluster-management.io',
          kind: 'Policy',
          version: 'v1',
        },
      })

      expect(mockGeneratePath).toHaveBeenCalledWith(NavigationPath.policyDetails, {
        namespace: 'resource-namespace',
        name: 'my-policy',
      })
      expect(result).toBe('/multicloud/governance/policies/details/resource-namespace/my-policy')
    })

    it('returns undefined when namespace is not provided', () => {
      const result = acmResourceRouteHandler({
        cluster: 'test-cluster',
        namespace: undefined,
        name: 'my-policy',
        resource: { cluster: 'test-cluster', metadata: { name: 'my-policy' } },
        model: {
          group: 'policy.open-cluster-management.io',
          kind: 'Policy',
          version: 'v1',
        },
      })

      expect(result).toBeUndefined()
      expect(mockGeneratePath).not.toHaveBeenCalled()
    })
  })

  describe('PolicyReport routing', () => {
    it('routes to cluster overview with cluster issues flag', () => {
      const result = acmResourceRouteHandler({
        cluster: 'test-cluster',
        namespace: 'report-namespace',
        name: 'my-report',
        resource: { cluster: 'test-cluster', metadata: { namespace: 'report-namespace', name: 'my-report' } },
        model: {
          group: 'wgpolicyk8s.io',
          kind: 'PolicyReport',
          version: 'v1alpha2',
        },
      })

      expect(mockGeneratePath).toHaveBeenCalledWith(NavigationPath.clusterOverview, {
        namespace: 'report-namespace',
        name: 'report-namespace',
      })
      expect(result).toBe(
        '/multicloud/infrastructure/clusters/details/report-namespace/report-namespace/overview?showClusterIssues%3Dtrue'
      )
    })

    it('uses namespace from resource metadata', () => {
      const result = acmResourceRouteHandler({
        cluster: 'test-cluster',
        namespace: undefined,
        name: 'my-report',
        resource: {
          cluster: 'test-cluster',
          metadata: { namespace: 'resource-namespace', name: 'my-report' },
        },
        model: {
          group: 'wgpolicyk8s.io',
          kind: 'PolicyReport',
          version: 'v1alpha2',
        },
      })

      expect(mockGeneratePath).toHaveBeenCalledWith(NavigationPath.clusterOverview, {
        namespace: 'resource-namespace',
        name: 'resource-namespace',
      })
      expect(result).toBe(
        '/multicloud/infrastructure/clusters/details/resource-namespace/resource-namespace/overview?showClusterIssues%3Dtrue'
      )
    })

    it('returns undefined when namespace is not provided', () => {
      const result = acmResourceRouteHandler({
        cluster: 'test-cluster',
        namespace: undefined,
        name: 'my-report',
        resource: { cluster: 'test-cluster', metadata: { name: 'my-report' } },
        model: {
          group: 'wgpolicyk8s.io',
          kind: 'PolicyReport',
          version: 'v1alpha2',
        },
      })

      expect(result).toBeUndefined()
      expect(mockGeneratePath).not.toHaveBeenCalled()
    })
  })

  describe('parameter handling', () => {
    it('prefers direct parameters over resource metadata', () => {
      const result = acmResourceRouteHandler({
        cluster: 'param-cluster',
        namespace: 'param-namespace',
        name: 'param-name',
        resource: {
          cluster: 'resource-cluster',
          metadata: { namespace: 'resource-namespace', name: 'resource-name' },
        },
        model: {
          group: 'app.k8s.io',
          kind: 'Application',
          version: 'v1beta1',
        },
      })

      expect(mockGeneratePath).toHaveBeenCalledWith(NavigationPath.applicationOverview, {
        namespace: 'param-namespace',
        name: 'param-name',
      })
      expect(mockQueryStringStringify).toHaveBeenCalledWith({
        apiVersion: 'application.app.k8s.io',
        cluster: 'param-cluster',
      })
      expect(result).toBe(
        '/multicloud/applications/details/param-namespace/param-name/details?apiVersion=application.app.k8s.io&cluster=param-cluster'
      )
    })

    it('falls back to resource metadata when parameters are not provided', () => {
      const result = acmResourceRouteHandler({
        cluster: 'resource-cluster',
        namespace: 'resource-namespace',
        name: 'resource-name',
        resource: {
          cluster: 'resource-cluster',
          metadata: { namespace: 'resource-namespace', name: 'resource-name' },
        },
        model: {
          group: 'app.k8s.io',
          kind: 'Application',
          version: 'v1beta1',
        },
      })

      expect(mockGeneratePath).toHaveBeenCalledWith(NavigationPath.applicationOverview, {
        namespace: 'resource-namespace',
        name: 'resource-name',
      })
      expect(mockQueryStringStringify).toHaveBeenCalledWith({
        apiVersion: 'application.app.k8s.io',
        cluster: 'resource-cluster',
      })
      expect(result).toBe(
        '/multicloud/applications/details/resource-namespace/resource-name/details?apiVersion=application.app.k8s.io&cluster=resource-cluster'
      )
    })
  })
})
