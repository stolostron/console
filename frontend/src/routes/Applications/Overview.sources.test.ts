/* Copyright Contributors to the Open Cluster Management project */

import {
  ArgoApplication,
  ArgoApplicationApiVersion,
  ArgoApplicationKind,
  ApplicationSet,
  ApplicationSetApiVersion,
  ApplicationSetKind,
} from '../../resources'
import { getApplicationSourceNames, getRepoProjectName, truncateSourceName } from './Overview'

describe('getRepoProjectName', () => {
  it('extracts the last path segment from an https git URL', () => {
    expect(getRepoProjectName('https://github.com/example/helloworld.git')).toBe('helloworld')
  })

  it('extracts the last path segment without .git suffix', () => {
    expect(getRepoProjectName('https://github.com/example/mortgage')).toBe('mortgage')
  })

  it('extracts the repo name from an SSH git URL', () => {
    expect(getRepoProjectName('git@github.com:example/helloworld.git')).toBe('helloworld')
  })

  it('returns empty string for hostname-only helm repos', () => {
    expect(getRepoProjectName('https://charts.example.com')).toBe('')
  })

  it('returns empty string for undefined or empty input', () => {
    expect(getRepoProjectName(undefined)).toBe('')
    expect(getRepoProjectName('')).toBe('')
  })
})

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

  it('returns a single project name for a git Argo application', () => {
    const gitApplication: ArgoApplication = {
      apiVersion: ArgoApplicationApiVersion,
      kind: ArgoApplicationKind,
      metadata: { name: 'git-app', namespace: 'test' },
      spec: {
        destination: { namespace: 'test', server: 'https://kubernetes.default.svc' },
        project: 'default',
        source: {
          repoURL: 'https://github.com/example/helloworld.git',
          path: 'manifests',
          targetRevision: 'HEAD',
        },
        syncPolicy: {},
      },
    }

    expect(getApplicationSourceNames(gitApplication, mockSubscriptions, mockChannels)).toEqual(['helloworld'])
  })

  it('falls back to chart name when the repo URL has no path segment', () => {
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

  it('returns unique names for multi-source ApplicationSets', () => {
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
                repoURL: 'https://github.com/example/helloworld.git',
                path: 'manifests',
                targetRevision: 'HEAD',
              },
              {
                repoURL: 'https://github.com/example/mortgage.git',
                path: 'apps',
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

  it('returns an empty array when there are no sources', () => {
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
