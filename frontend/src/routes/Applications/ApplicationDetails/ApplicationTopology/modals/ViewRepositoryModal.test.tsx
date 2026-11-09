/* Copyright Contributors to the Open Cluster Management project */

import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import type { GitBranchPathNode, Secret } from '~/resources'
import type { TopologyNode } from '../types'
import { ViewRepositoryModal } from './ViewRepositoryModal'

const mockGetGitBranchPathDetails = jest.fn()
const mockGetGitBlobContents = jest.fn()
let mockSecrets: Secret[] = []

jest.mock('~/resources', () => ({
  getGitBranchPathDetails: (...args: unknown[]) => mockGetGitBranchPathDetails(...args),
  getGitBlobContents: (...args: unknown[]) => mockGetGitBlobContents(...args),
}))

jest.mock('~/shared-atoms', () => ({
  useSharedAtoms: () => ({ secretsState: {} }),
  useSharedValue: () => mockSecrets,
}))

jest.mock('~/components/SyncEditor/SyncEditor', () => ({
  SyncEditor: ({ editorTitle, code }: { editorTitle: string; code: string }) => (
    <div id="sync-editor">
      {editorTitle}
      <pre>{code}</pre>
    </div>
  ),
}))

jest.mock('@patternfly/react-code-editor', () => ({
  ...jest.requireActual('@patternfly/react-code-editor'),
  CodeEditor: ({ code, language }: { code: string; language: string }) => (
    <div id="code-editor">
      <span>{language}</span>
      <pre>{code}</pre>
    </div>
  ),
}))

jest.mock('./ResourceNavigator', () => ({
  ResourceKindDecorator: () => <div data-testid="resource-kind-icon" />,
}))

const repositoryNode = {
  id: 'repository-node',
  name: 'repository',
  namespace: 'default',
  type: 'git',
  specs: {
    resources: [
      { repoURL: 'https://github.com/example/one', path: 'apps', targetRevision: 'main' },
      { repoURL: 'https://github.com/example/two', path: 'charts', targetRevision: 'main' },
    ],
  },
} as unknown as TopologyNode

const oneTree: GitBranchPathNode = {
  type: 'tree',
  path: 'apps',
  children: [{ type: 'file', path: 'apps/one.md', url: 'https://api.github.com/repos/example/one/git/blobs/one' }],
}

const twoTree: GitBranchPathNode = {
  type: 'tree',
  path: 'charts',
  children: [{ type: 'file', path: 'charts/two.md', url: 'https://api.github.com/repos/example/two/git/blobs/two' }],
}

const yamlTree: GitBranchPathNode = {
  type: 'tree',
  path: 'apps',
  children: [{ type: 'file', path: 'apps/one.yaml', url: 'https://api.github.com/repos/example/one/git/blobs/one' }],
}

function renderModal() {
  return render(<ViewRepositoryModal open close={jest.fn()} node={repositoryNode} />)
}

describe('ViewRepositoryModal', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    mockSecrets = []
    mockGetGitBlobContents.mockImplementation((url: string) => Promise.resolve(url.endsWith('/one') ? 'One' : 'Two'))
  })

  it('shows navigator and editor spinners until every repository source loads', () => {
    mockGetGitBranchPathDetails.mockImplementation((repoURL: string) =>
      repoURL.includes('/one') ? Promise.resolve(oneTree) : new Promise<GitBranchPathNode>(() => {})
    )

    renderModal()

    expect(screen.getAllByLabelText('Loading')).toHaveLength(2)
    expect(screen.queryByTestId('sync-editor')).not.toBeInTheDocument()
  })

  it('shows a PatternFly code editor for a selected non-YAML file after every repository source loads', async () => {
    mockGetGitBranchPathDetails.mockImplementation((repoURL: string) =>
      repoURL.includes('/one') ? Promise.resolve(oneTree) : Promise.resolve(twoTree)
    )

    renderModal()

    await screen.findByText('one.md')
    expect(await screen.findByTestId('code-editor')).toHaveTextContent('markdown')
    expect(screen.getByTestId('code-editor')).toHaveTextContent('One')
    expect(screen.queryByTestId('sync-editor')).not.toBeInTheDocument()
    await waitFor(() => expect(screen.queryByLabelText('Loading')).not.toBeInTheDocument())
  })

  it('shows the synchronization editor for a selected YAML file', async () => {
    mockGetGitBranchPathDetails.mockImplementation((repoURL: string) =>
      repoURL.includes('/one')
        ? Promise.resolve(yamlTree)
        : Promise.resolve({ type: 'tree', path: 'charts', children: [] })
    )

    renderModal()

    await screen.findByText('one.yaml')
    expect(await screen.findByTestId('sync-editor')).toHaveTextContent('main: apps/one.yaml')
    expect(screen.getByTestId('sync-editor')).toHaveTextContent('One')
    expect(screen.queryByTestId('code-editor')).not.toBeInTheDocument()
  })

  it('loads only the selected blob and shows a spinner until its contents arrive', async () => {
    mockGetGitBranchPathDetails.mockImplementation((repoURL: string) =>
      Promise.resolve(repoURL.includes('/one') ? oneTree : twoTree)
    )
    let resolveContents!: (contents: string) => void
    mockGetGitBlobContents.mockReturnValue(
      new Promise<string>((resolve) => {
        resolveContents = resolve
      })
    )

    const { baseElement } = renderModal()

    await screen.findByText('two.md')
    expect(screen.getByLabelText('Loading')).toBeInTheDocument()
    expect(screen.queryByTestId('code-editor')).not.toBeInTheDocument()
    expect(mockGetGitBlobContents).toHaveBeenCalledTimes(1)
    expect(mockGetGitBlobContents).toHaveBeenCalledWith(
      'https://api.github.com/repos/example/one/git/blobs/one',
      undefined,
      undefined
    )
    await act(async () => resolveContents('Selected contents'))
    expect(screen.getByTestId('code-editor')).toHaveTextContent('Selected contents')
    expect(screen.queryByLabelText('Loading')).not.toBeInTheDocument()
    expect(await axe(baseElement)).toHaveNoViolations()
  })

  it('replaces previously loaded contents with a spinner and supports empty files', async () => {
    mockGetGitBranchPathDetails.mockImplementation((repoURL: string) =>
      Promise.resolve(repoURL.includes('/one') ? oneTree : twoTree)
    )
    const user = userEvent.setup()
    renderModal()
    expect(await screen.findByTestId('code-editor')).toHaveTextContent('One')
    let resolveContents!: (contents: string) => void
    mockGetGitBlobContents.mockReturnValueOnce(
      new Promise<string>((resolve) => {
        resolveContents = resolve
      })
    )

    await user.click(screen.getByText('two.md'))

    expect(screen.getByLabelText('Loading')).toBeInTheDocument()
    expect(screen.queryByTestId('code-editor')).not.toBeInTheDocument()
    await act(async () => resolveContents(''))
    expect(screen.getByTestId('code-editor')).toBeInTheDocument()
    expect(screen.getByTestId('code-editor')).not.toHaveTextContent('One')
    expect(screen.queryByLabelText('Loading')).not.toBeInTheDocument()
  })

  it('uses the selected file repository credentials when switching between sources', async () => {
    for (const name of ['one', 'two']) {
      mockSecrets.push({
        apiVersion: 'v1',
        kind: 'Secret',
        metadata: {
          name,
          namespace: 'argocd',
          labels: { 'argocd.argoproj.io/secret-type': 'repository' },
        },
        data: {
          url: Buffer.from(`https://github.com/example/${name}`).toString('base64'),
          username: Buffer.from(`user-${name}`).toString('base64'),
          password: Buffer.from(`token-${name}`).toString('base64'),
        },
      })
    }
    mockGetGitBranchPathDetails.mockImplementation((repoURL: string) =>
      Promise.resolve(repoURL.includes('/one') ? oneTree : twoTree)
    )
    const user = userEvent.setup()
    renderModal()
    await screen.findByTestId('code-editor')
    expect(mockGetGitBlobContents).toHaveBeenLastCalledWith(
      'https://api.github.com/repos/example/one/git/blobs/one',
      { secretRef: 'one', namespace: 'argocd' },
      { user: 'user-one', accessToken: 'token-one' }
    )

    await user.click(screen.getByText('two.md'))

    expect(await screen.findByText('Two')).toBeInTheDocument()
    expect(mockGetGitBlobContents).toHaveBeenLastCalledWith(
      'https://api.github.com/repos/example/two/git/blobs/two',
      { secretRef: 'two', namespace: 'argocd' },
      { user: 'user-two', accessToken: 'token-two' }
    )
  })

  it('does not reload the selected blob when unrelated secrets change', async () => {
    const matchingSecret: Secret = {
      apiVersion: 'v1',
      kind: 'Secret',
      metadata: {
        name: 'one',
        namespace: 'argocd',
        labels: { 'argocd.argoproj.io/secret-type': 'repository' },
      },
      data: {
        url: Buffer.from('https://github.com/example/one').toString('base64'),
        username: Buffer.from('user-one').toString('base64'),
        password: Buffer.from('token-one').toString('base64'),
      },
    }
    const unrelatedSecret: Secret = {
      apiVersion: 'v1',
      kind: 'Secret',
      metadata: { name: 'unrelated', namespace: 'other' },
      data: { value: Buffer.from('unrelated').toString('base64') },
    }
    mockSecrets = [matchingSecret]
    mockGetGitBranchPathDetails.mockImplementation((repoURL: string) =>
      Promise.resolve(repoURL.includes('/one') ? oneTree : twoTree)
    )
    const { rerender } = renderModal()

    await screen.findByTestId('code-editor')
    expect(mockGetGitBlobContents).toHaveBeenCalledTimes(1)

    mockSecrets = [matchingSecret, unrelatedSecret]
    rerender(<ViewRepositoryModal open close={jest.fn()} node={repositoryNode} />)
    await screen.findByTestId('code-editor')
    expect(mockGetGitBlobContents).toHaveBeenCalledTimes(1)

    mockSecrets = [
      {
        ...matchingSecret,
        data: { ...matchingSecret.data, password: Buffer.from('token-two').toString('base64') },
      },
    ]
    rerender(<ViewRepositoryModal open close={jest.fn()} node={repositoryNode} />)
    await waitFor(() => expect(mockGetGitBlobContents).toHaveBeenCalledTimes(2))
    expect(mockGetGitBlobContents).toHaveBeenLastCalledWith(
      'https://api.github.com/repos/example/one/git/blobs/one',
      { secretRef: 'one', namespace: 'argocd' },
      { user: 'user-one', accessToken: 'token-two' }
    )
  })

  it.each(['resolve', 'reject'])('ignores a stale blob %s after selecting another file', async (outcome) => {
    mockGetGitBranchPathDetails.mockImplementation((repoURL: string) =>
      Promise.resolve(repoURL.includes('/one') ? oneTree : twoTree)
    )
    let resolveFirst!: (contents: string) => void
    let rejectFirst!: (error: Error) => void
    mockGetGitBlobContents.mockReturnValueOnce(
      new Promise<string>((resolve, reject) => {
        resolveFirst = resolve
        rejectFirst = reject
      })
    )
    const user = userEvent.setup()
    renderModal()
    await user.click(await screen.findByText('two.md'))
    expect(await screen.findByTestId('code-editor')).toHaveTextContent('Two')
    await act(async () => {
      if (outcome === 'resolve') resolveFirst('Stale contents')
      else rejectFirst(new Error('Stale error'))
    })
    expect(screen.getByTestId('code-editor')).toHaveTextContent('Two')
    expect(screen.queryByText('Failed to load repository file.')).not.toBeInTheDocument()
    expect(mockGetGitBlobContents).toHaveBeenCalledTimes(2)
  })

  it('keeps the tree visible after a blob fails and can load another file', async () => {
    mockGetGitBranchPathDetails.mockImplementation((repoURL: string) =>
      Promise.resolve(repoURL.includes('/one') ? oneTree : twoTree)
    )
    mockGetGitBlobContents.mockRejectedValueOnce(new Error('Rate limit exceeded'))
    const user = userEvent.setup()
    renderModal()
    expect(await screen.findByText('Failed to load repository file.')).toBeInTheDocument()
    expect(screen.getByLabelText('Repository files')).toBeInTheDocument()
    expect(screen.queryByText('No files found')).not.toBeInTheDocument()
    await user.click(screen.getByText('two.md'))
    expect(await screen.findByTestId('code-editor')).toHaveTextContent('Two')
    expect(screen.queryByText('Failed to load repository file.')).not.toBeInTheDocument()
  })

  it('shows the empty state when loaded repositories contain no files', async () => {
    mockGetGitBranchPathDetails.mockResolvedValue({ type: 'tree', path: '', children: [] })

    renderModal()

    expect(await screen.findByText('No files found')).toBeInTheDocument()
    expect(screen.getByText('This repository does not contain any files to display.')).toBeInTheDocument()
    expect(screen.queryByLabelText('Loading')).not.toBeInTheDocument()
  })
})
