/* Copyright Contributors to the Open Cluster Management project */

import {
  ArgoApplication,
  ArgoApplicationApiVersion,
  ArgoApplicationKind,
  ApplicationSet,
  ApplicationSetApiVersion,
  ApplicationSetKind,
} from '../../resources'
import { getApplicationRepos } from './Overview'

describe('getApplicationRepos', () => {
  const mockSubscriptions: any[] = []
  const mockChannels: any[] = []

  describe('Argo Applications', () => {
    it('should return git type for application with path property', () => {
      const gitApplication: ArgoApplication = {
        apiVersion: ArgoApplicationApiVersion,
        kind: ArgoApplicationKind,
        metadata: { name: 'git-app', namespace: 'test' },
        spec: {
          destination: { namespace: 'test', server: 'https://kubernetes.default.svc' },
          project: 'default',
          source: {
            repoURL: 'https://github.com/example/repo.git',
            path: 'manifests',
            targetRevision: 'HEAD',
          },
          syncPolicy: {},
        },
      }

      const result = getApplicationRepos(gitApplication, mockSubscriptions, mockChannels)

      expect(result).toHaveLength(1)
      expect(result![0].type).toBe('git')
      expect(result![0].pathName).toBe('https://github.com/example/repo.git')
      expect(result![0].gitPath).toBe('manifests')
      expect(result![0].chart).toBeUndefined()
    })

    it('should return helmrepo type for application with chart property', () => {
      const helmApplication: ArgoApplication = {
        apiVersion: ArgoApplicationApiVersion,
        kind: ArgoApplicationKind,
        metadata: { name: 'helm-app', namespace: 'test' },
        spec: {
          destination: { namespace: 'test', server: 'https://kubernetes.default.svc' },
          project: 'default',
          source: {
            repoURL: 'https://charts.example.com',
            chart: 'my-chart',
            targetRevision: '1.0.0',
          },
          syncPolicy: {},
        },
      }

      const result = getApplicationRepos(helmApplication, mockSubscriptions, mockChannels)

      expect(result).toHaveLength(1)
      expect(result![0].type).toBe('helmrepo')
      expect(result![0].pathName).toBe('https://charts.example.com')
      expect(result![0].chart).toBe('my-chart')
      expect(result![0].gitPath).toBeUndefined()
    })

    it('should return helmrepo type for application with both chart and path (chart takes precedence)', () => {
      const mixedApplication: ArgoApplication = {
        apiVersion: ArgoApplicationApiVersion,
        kind: ArgoApplicationKind,
        metadata: { name: 'mixed-app', namespace: 'test' },
        spec: {
          destination: { namespace: 'test', server: 'https://kubernetes.default.svc' },
          project: 'default',
          source: {
            repoURL: 'https://github.com/example/helm-charts.git',
            path: 'charts/my-chart',
            chart: 'my-chart',
            targetRevision: 'HEAD',
          },
          syncPolicy: {},
        },
      }

      const result = getApplicationRepos(mixedApplication, mockSubscriptions, mockChannels)

      expect(result).toHaveLength(1)
      expect(result![0].type).toBe('helmrepo')
      expect(result![0].pathName).toBe('https://github.com/example/helm-charts.git')
      expect(result![0].chart).toBe('my-chart')
      expect(result![0].gitPath).toBe('charts/my-chart')
    })

    it('should return git type for application with neither chart nor path (default)', () => {
      const defaultApplication: ArgoApplication = {
        apiVersion: ArgoApplicationApiVersion,
        kind: ArgoApplicationKind,
        metadata: { name: 'default-app', namespace: 'test' },
        spec: {
          destination: { namespace: 'test', server: 'https://kubernetes.default.svc' },
          project: 'default',
          source: {
            repoURL: 'https://github.com/example/repo.git',
            targetRevision: 'HEAD',
          },
          syncPolicy: {},
        },
      }

      const result = getApplicationRepos(defaultApplication, mockSubscriptions, mockChannels)

      expect(result).toHaveLength(1)
      expect(result![0].type).toBe('git')
      expect(result![0].pathName).toBe('https://github.com/example/repo.git')
    })

    it('should return empty array for application without source', () => {
      const noSourceApplication: ArgoApplication = {
        apiVersion: ArgoApplicationApiVersion,
        kind: ArgoApplicationKind,
        metadata: { name: 'no-source-app', namespace: 'test' },
        spec: {
          destination: { namespace: 'test', server: 'https://kubernetes.default.svc' },
          project: 'default',
          syncPolicy: {},
        },
      }

      const result = getApplicationRepos(noSourceApplication, mockSubscriptions, mockChannels)

      expect(result).toHaveLength(0)
    })
  })

  describe('ApplicationSets', () => {
    it('should return git type for ApplicationSet with path property', () => {
      const gitApplicationSet: ApplicationSet = {
        apiVersion: ApplicationSetApiVersion,
        kind: ApplicationSetKind,
        metadata: { name: 'git-appset', namespace: 'test' },
        spec: {
          generators: [],
          template: {
            spec: {
              destination: { namespace: 'test', server: 'https://kubernetes.default.svc' },
              project: 'default',
              source: {
                repoURL: 'https://github.com/example/repo.git',
                path: 'apps',
                targetRevision: 'main',
              },
            },
          },
        },
      }

      const result = getApplicationRepos(gitApplicationSet, mockSubscriptions, mockChannels)

      expect(result).toHaveLength(1)
      expect(result![0].type).toBe('git')
      expect(result![0].pathName).toBe('https://github.com/example/repo.git')
      expect(result![0].gitPath).toBe('apps')
    })

    it('should return helmrepo type for ApplicationSet with chart property', () => {
      const helmApplicationSet: ApplicationSet = {
        apiVersion: ApplicationSetApiVersion,
        kind: ApplicationSetKind,
        metadata: { name: 'helm-appset', namespace: 'test' },
        spec: {
          generators: [],
          template: {
            spec: {
              destination: { namespace: 'test', server: 'https://kubernetes.default.svc' },
              project: 'default',
              source: {
                repoURL: 'https://charts.example.com',
                chart: 'my-helm-chart',
                targetRevision: '2.0.0',
              },
            },
          },
        },
      }

      const result = getApplicationRepos(helmApplicationSet, mockSubscriptions, mockChannels)

      expect(result).toHaveLength(1)
      expect(result![0].type).toBe('helmrepo')
      expect(result![0].pathName).toBe('https://charts.example.com')
      expect(result![0].chart).toBe('my-helm-chart')
    })

    it('should handle ApplicationSet with multiple sources correctly', () => {
      const multiSourceApplicationSet: ApplicationSet = {
        apiVersion: ApplicationSetApiVersion,
        kind: ApplicationSetKind,
        metadata: { name: 'multi-appset', namespace: 'test' },
        spec: {
          generators: [],
          template: {
            spec: {
              destination: { namespace: 'test', server: 'https://kubernetes.default.svc' },
              project: 'default',
              sources: [
                {
                  repoURL: 'https://github.com/example/repo.git',
                  path: 'manifests',
                  targetRevision: 'HEAD',
                },
                {
                  repoURL: 'https://charts.example.com',
                  chart: 'dependency-chart',
                  targetRevision: '1.5.0',
                },
              ],
            },
          },
        },
      }

      const result = getApplicationRepos(multiSourceApplicationSet, mockSubscriptions, mockChannels)

      expect(result).toHaveLength(2)
      expect(result![0].type).toBe('git')
      expect(result![0].pathName).toBe('https://github.com/example/repo.git')
      expect(result![0].gitPath).toBe('manifests')

      expect(result![1].type).toBe('helmrepo')
      expect(result![1].pathName).toBe('https://charts.example.com')
      expect(result![1].chart).toBe('dependency-chart')
    })

    it('should handle ApplicationSet with source that has neither path nor chart (defaults to git)', () => {
      const defaultSourceApplicationSet: ApplicationSet = {
        apiVersion: ApplicationSetApiVersion,
        kind: ApplicationSetKind,
        metadata: { name: 'default-appset', namespace: 'test' },
        spec: {
          generators: [],
          template: {
            spec: {
              destination: { namespace: 'test', server: 'https://kubernetes.default.svc' },
              project: 'default',
              sources: [
                {
                  repoURL: 'https://github.com/example/repo.git',
                  targetRevision: 'HEAD',
                },
              ],
            },
          },
        },
      }

      const result = getApplicationRepos(defaultSourceApplicationSet, mockSubscriptions, mockChannels)

      expect(result).toHaveLength(1)
      expect(result![0].type).toBe('git')
      expect(result![0].pathName).toBe('https://github.com/example/repo.git')
    })
  })

  describe('Edge Cases', () => {
    it('should return undefined for non-Argo resources', () => {
      const nonArgoResource = {
        apiVersion: 'apps/v1',
        kind: 'Deployment',
        metadata: { name: 'test-deployment', namespace: 'test' },
      }

      const result = getApplicationRepos(nonArgoResource as any, mockSubscriptions, mockChannels)

      expect(result).toBeUndefined()
    })
  })
})
