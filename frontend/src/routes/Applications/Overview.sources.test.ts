/* Copyright Contributors to the Open Cluster Management project */

import {
  ArgoApplication,
  ArgoApplicationApiVersion,
  ArgoApplicationKind,
  ApplicationSet,
  ApplicationSetApiVersion,
  ApplicationSetKind,
} from '../../resources'
import { getApplicationSourceNames, truncateSourceName } from './Overview'

describe('truncateSourceName', () => {
  it('returns short names unchanged', () => {
    expect(truncateSourceName('helloworld')).toBe('helloworld')
  })

  it('truncates names longer than the max length', () => {
    expect(truncateSourceName('this-is-a-very-long-repo-name')).toBe('this-is-a-very-long-…')
    expect(truncateSourceName('this-is-a-very-long-repo-name').length).toBe(21)
  })

  it('does not truncate names at exactly the max length', () => {
    const exact = 'a'.repeat(20)
    expect(truncateSourceName(exact)).toBe(exact)
  })
})

describe('getApplicationSourceNames', () => {
  const mockSubscriptions: any[] = []
  const mockChannels: any[] = []

  it('returns the Argo source path for a git application', () => {
    const gitApplication: ArgoApplication = {
      apiVersion: ArgoApplicationApiVersion,
      kind: ArgoApplicationKind,
      metadata: { name: 'git-app', namespace: 'test' },
      spec: {
        destination: { namespace: 'test', server: 'https://kubernetes.default.svc' },
        project: 'default',
        source: {
          repoURL: 'https://github.com/example/repo.git',
          path: 'helloworld',
          targetRevision: 'HEAD',
        },
        syncPolicy: {},
      },
    }

    expect(getApplicationSourceNames(gitApplication, mockSubscriptions, mockChannels)).toEqual(['helloworld'])
  })

  it('falls back to chart name when path is not set', () => {
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

    expect(getApplicationSourceNames(helmApplication, mockSubscriptions, mockChannels)).toEqual(['my-chart'])
  })

  it('returns unique path names for multi-source ApplicationSets', () => {
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
                path: 'helloworld',
                targetRevision: 'HEAD',
              },
              {
                repoURL: 'https://github.com/example/repo.git',
                path: 'mortgage',
                targetRevision: 'main',
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

    expect(getApplicationSourceNames(multiSourceApplicationSet, mockSubscriptions, mockChannels)).toEqual([
      'helloworld',
      'mortgage',
      'dependency-chart',
    ])
  })

  it('returns an empty array when there are no source paths', () => {
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

    expect(getApplicationSourceNames(noSourceApplication, mockSubscriptions, mockChannels)).toEqual([])
  })
})
