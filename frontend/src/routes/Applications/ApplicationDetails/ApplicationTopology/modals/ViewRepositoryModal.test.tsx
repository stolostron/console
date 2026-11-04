/* Copyright Contributors to the Open Cluster Management project */

import { render, screen, waitFor } from '@testing-library/react'
import type { GitBranchPathNode } from '~/resources'
import type { TopologyNode } from '../types'
import { ViewRepositoryModal } from './ViewRepositoryModal'

const mockGetGitBranchPathDetails = jest.fn()
const mockSecrets: never[] = []

jest.mock('~/resources', () => ({
  getGitBranchPathDetails: (...args: unknown[]) => mockGetGitBranchPathDetails(...args),
}))

jest.mock('~/shared-atoms', () => ({
  useSharedAtoms: () => ({ secretsState: {} }),
  useSharedValue: () => mockSecrets,
}))

jest.mock('~/components/SyncEditor/SyncEditor', () => ({
  SyncEditor: ({ editorTitle }: { editorTitle: string }) => <div id="sync-editor">{editorTitle}</div>,
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
  children: [{ type: 'file', path: 'apps/one.md', contents: 'One' }],
}

const twoTree: GitBranchPathNode = {
  type: 'tree',
  path: 'charts',
  children: [{ type: 'file', path: 'charts/two.md', contents: 'Two' }],
}

function renderModal() {
  return render(<ViewRepositoryModal open close={jest.fn()} node={repositoryNode} />)
}

describe('ViewRepositoryModal', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('shows navigator and editor spinners until every repository source loads', () => {
    mockGetGitBranchPathDetails.mockImplementation((repoURL: string) =>
      repoURL.includes('/one') ? Promise.resolve(oneTree) : new Promise<GitBranchPathNode>(() => {})
    )

    renderModal()

    expect(screen.getAllByLabelText('Loading')).toHaveLength(2)
    expect(screen.queryByTestId('sync-editor')).not.toBeInTheDocument()
  })

  it('shows the selected file after every repository source loads', async () => {
    mockGetGitBranchPathDetails.mockImplementation((repoURL: string) =>
      repoURL.includes('/one') ? Promise.resolve(oneTree) : Promise.resolve(twoTree)
    )

    renderModal()

    await screen.findByText('one.md')
    expect(await screen.findByTestId('sync-editor')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByLabelText('Loading')).not.toBeInTheDocument())
  })

  it('shows the empty state when loaded repositories contain no files', async () => {
    mockGetGitBranchPathDetails.mockResolvedValue({ type: 'tree', path: '', children: [] })

    renderModal()

    expect(await screen.findByText('No files found')).toBeInTheDocument()
    expect(screen.getByText('This repository does not contain any files to display.')).toBeInTheDocument()
    expect(screen.queryByLabelText('Loading')).not.toBeInTheDocument()
  })
})
