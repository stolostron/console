/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import { repositoryTypeToSource, sourceToRepositoryType } from './SourceSelector'

const mockUpdate = jest.fn()
let mockAppSetData: any = {}

jest.mock('../../lib/acm-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

jest.mock('../../resources', () => ({
  getGitChannelBranches: jest.fn(() => Promise.resolve(['main', 'develop'])),
  getGitChannelPaths: jest.fn(() => Promise.resolve(['/', '/charts'])),
}))

jest.mock('./ArgoWizard', () => ({
  getGitBranchList: jest.fn(() => Promise.resolve(['main'])),
  getGitPathList: jest.fn(() => Promise.resolve(['/'])),
}))

jest.mock('../../components/usePrevious', () => ({
  usePrevious: () => undefined,
}))

jest.mock('../../lib/validation', () => ({
  validateWebURL: jest.fn(),
}))

jest.mock('@patternfly-labs/react-form-wizard', () => {
  const React = require('react')
  return {
    ItemContext: React.createContext({}),
    useItem: () => mockAppSetData,
    useData: () => ({ update: mockUpdate }),
    WizAsyncSelect: ({ label }: any) => <div id={`async-select-${label}`} />,
    WizSelect: ({ label, options }: any) => (
      <div id={`select-${label}`}>
        {options?.map((opt: string) => (
          <span key={opt} id={`option-${opt}`}>
            {opt}
          </span>
        ))}
      </div>
    ),
    WizHidden: ({ children }: any) => <>{children}</>,
    WizTiles: ({ label }: any) => <div id={`tiles-${label}`} />,
    WizTextInput: ({ label }: any) => <div id={`text-input-${label}`} />,
    Tile: () => null,
  }
})

jest.mock('./logos/HelmIcon.svg', () => () => null)

import { SourceSelector } from './SourceSelector'
import { Channel } from './ArgoWizard'
import { Secret } from '../../resources'

const toBase64 = (str: string) => Buffer.from(str).toString('base64')

function setSourceData(source: Record<string, unknown>) {
  mockAppSetData = { spec: { template: { spec: { source } } } }
}

const mockChannels: Channel[] = [
  {
    metadata: { name: 'git-channel', namespace: 'ch-ns' },
    spec: { pathname: 'https://github.com/org/repo', type: 'git' },
  },
]

const mockGitSecret: Secret = {
  apiVersion: 'v1',
  kind: 'Secret',
  metadata: {
    name: 'git-secret',
    namespace: 'argocd',
    labels: { 'argocd.argoproj.io/secret-type': 'repository' },
  },
  data: {
    type: toBase64('git'),
    url: toBase64('https://github.com/private/repo'),
    username: toBase64('user1'),
    password: toBase64('token123'),
  },
}

const mockHelmSecret: Secret = {
  apiVersion: 'v1',
  kind: 'Secret',
  metadata: {
    name: 'helm-secret',
    namespace: 'argocd',
    labels: { 'argocd.argoproj.io/secret-type': 'repository' },
  },
  data: {
    type: toBase64('helm'),
    url: toBase64('https://charts.example.com/stable'),
    username: toBase64('helmuser'),
    password: toBase64('helmtoken'),
  },
}

const mockNonRepoSecret: Secret = {
  apiVersion: 'v1',
  kind: 'Secret',
  metadata: {
    name: 'other-secret',
    namespace: 'argocd',
    labels: { 'argocd.argoproj.io/secret-type': 'cluster' },
  },
  data: {
    url: toBase64('https://github.com/ignored/repo'),
  },
}

describe('SourceSelector', () => {
  beforeEach(() => {
    mockAppSetData = {}
    mockUpdate.mockClear()
    jest.clearAllMocks()
  })

  describe('repositoryTypeToSource', () => {
    test('repositoryTypeToSource should render the expected output for git', () => {
      expect(repositoryTypeToSource('Git')).toEqual({ repoURL: '', targetRevision: '', path: '' })
    })
    test('repositoryTypeToSource should render the expected output for helm', () => {
      expect(repositoryTypeToSource('Helm')).toEqual({ repoURL: '', chart: '', targetRevision: '' })
    })
    test('repositoryTypeToSource should render the expected output for other values', () => {
      expect(repositoryTypeToSource('any')).toEqual('any')
    })
  })

  describe('sourceToRepositoryType', () => {
    test('sourceToRepositoryType should render the expected output for Git', () => {
      expect(sourceToRepositoryType({ repoURL: 'test.com', path: 'abc', targetRevision: 'efg' })).toEqual('Git')
    })
    test('sourceToRepositoryType should render the expected output for Helm', () => {
      expect(sourceToRepositoryType({ repoURL: 'test.com', chart: 'abc', targetRevision: 'efg' })).toEqual('Helm')
    })
    test('sourceToRepositoryType should render the expected output for other values', () => {
      expect(sourceToRepositoryType('any')).toEqual(undefined)
    })
  })

  describe('secrets passed to Git RepoURL', () => {
    test('includes decoded git secret URLs in options alongside channel URLs', () => {
      setSourceData({ path: '', repoURL: '' })
      render(
        <SourceSelector
          gitChannels={['https://github.com/org/repo']}
          channels={mockChannels}
          helmChannels={[]}
          secrets={[mockGitSecret]}
        />
      )
      const selects = screen.getAllByTestId('select-URL')
      const gitSelect = selects[0]
      expect(gitSelect).toBeInTheDocument()
      expect(screen.getByTestId('option-https://github.com/org/repo')).toBeInTheDocument()
      expect(screen.getByTestId('option-https://github.com/private/repo')).toBeInTheDocument()
    })

    test('does not include secrets without repository label', () => {
      setSourceData({ path: '', repoURL: '' })
      render(
        <SourceSelector
          gitChannels={['https://github.com/org/repo']}
          channels={mockChannels}
          helmChannels={[]}
          secrets={[mockNonRepoSecret]}
        />
      )
      expect(screen.queryByTestId('option-https://github.com/ignored/repo')).not.toBeInTheDocument()
    })

    test('does not include helm-type secrets in Git URL options', () => {
      setSourceData({ path: '', repoURL: '' })
      render(
        <SourceSelector
          gitChannels={['https://github.com/org/repo']}
          channels={mockChannels}
          helmChannels={[]}
          secrets={[mockHelmSecret]}
        />
      )
      const selects = screen.getAllByTestId('select-URL')
      const gitSelect = selects[0]
      expect(gitSelect.querySelector('#option-https\\:\\/\\/charts\\.example\\.com\\/stable')).toBeNull()
    })

    test('deduplicates URLs from channels and secrets', () => {
      setSourceData({ path: '', repoURL: '' })
      const duplicateSecret: Secret = {
        apiVersion: 'v1',
        kind: 'Secret',
        metadata: {
          name: 'dup-secret',
          namespace: 'argocd',
          labels: { 'argocd.argoproj.io/secret-type': 'repository' },
        },
        data: {
          type: toBase64('git'),
          url: toBase64('https://github.com/org/repo'),
        },
      }
      render(
        <SourceSelector
          gitChannels={['https://github.com/org/repo']}
          channels={mockChannels}
          helmChannels={[]}
          secrets={[duplicateSecret]}
        />
      )
      const options = screen.getAllByTestId('option-https://github.com/org/repo')
      expect(options).toHaveLength(1)
    })

    test('renders with only channel URLs when no secrets are provided', () => {
      setSourceData({ path: '', repoURL: '' })
      render(
        <SourceSelector
          gitChannels={['https://github.com/org/repo']}
          channels={mockChannels}
          helmChannels={[]}
          secrets={[]}
        />
      )
      expect(screen.getByTestId('option-https://github.com/org/repo')).toBeInTheDocument()
    })

    test('filters correctly with multiple secret types', () => {
      setSourceData({ path: '', repoURL: '' })
      render(
        <SourceSelector
          gitChannels={[]}
          channels={mockChannels}
          helmChannels={[]}
          secrets={[mockGitSecret, mockHelmSecret, mockNonRepoSecret]}
        />
      )
      const selects = screen.getAllByTestId('select-URL')
      const gitSelect = selects[0]
      expect(gitSelect).toBeInTheDocument()
      expect(screen.getByTestId('option-https://github.com/private/repo')).toBeInTheDocument()
      expect(screen.queryByTestId('option-https://github.com/ignored/repo')).not.toBeInTheDocument()
    })
  })

  describe('secrets passed to Helm RepoURL', () => {
    test('includes decoded helm secret URLs in options alongside channel URLs', () => {
      setSourceData({ chart: '', repoURL: '' })
      render(
        <SourceSelector
          gitChannels={[]}
          channels={mockChannels}
          helmChannels={['https://charts.bitnami.com']}
          secrets={[mockHelmSecret]}
        />
      )
      expect(screen.getByTestId('option-https://charts.bitnami.com')).toBeInTheDocument()
      expect(screen.getByTestId('option-https://charts.example.com/stable')).toBeInTheDocument()
    })

    test('does not include git-type secrets in Helm URL options', () => {
      setSourceData({ chart: '', repoURL: '' })
      render(
        <SourceSelector
          gitChannels={[]}
          channels={mockChannels}
          helmChannels={['https://charts.bitnami.com']}
          secrets={[mockGitSecret]}
        />
      )
      const selects = screen.getAllByTestId('select-URL')
      const helmSelect = selects[1]
      expect(helmSelect.querySelector('#option-https\\:\\/\\/github\\.com\\/private\\/repo')).toBeNull()
    })
  })

  describe('secrets passed to GitRevisionSelect and GitPathSelect', () => {
    test('renders revision and path selects that receive secrets', () => {
      setSourceData({ path: '', repoURL: 'https://github.com/org/repo' })
      render(
        <SourceSelector
          gitChannels={['https://github.com/org/repo']}
          channels={mockChannels}
          helmChannels={[]}
          secrets={[mockGitSecret]}
        />
      )
      expect(screen.getByTestId('async-select-Revision')).toBeInTheDocument()
      expect(screen.getByTestId('async-select-Path')).toBeInTheDocument()
    })

    test('renders Helm chart and version inputs', () => {
      setSourceData({ chart: '', repoURL: 'https://charts.example.com/stable' })
      render(<SourceSelector gitChannels={[]} channels={mockChannels} helmChannels={[]} secrets={[mockHelmSecret]} />)
      expect(screen.getByTestId('text-input-Chart name')).toBeInTheDocument()
      expect(screen.getByTestId('text-input-Package version')).toBeInTheDocument()
    })
  })
})
