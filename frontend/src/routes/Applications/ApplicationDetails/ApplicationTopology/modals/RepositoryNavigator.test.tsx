/* Copyright Contributors to the Open Cluster Management project */

import { render, screen, waitFor } from '@testing-library/react'
import type { GitBranchPathNode } from '~/resources'
import type { TopologyNode } from '../types'
import { RepositoryNavigator } from './RepositoryNavigator'

const mockGetGitBranchPathDetails = jest.fn()
const mockSecrets: never[] = []

jest.mock('~/resources', () => ({
  getGitBranchPathDetails: (...args: unknown[]) => mockGetGitBranchPathDetails(...args),
}))

jest.mock('~/shared-atoms', () => ({
  useSharedAtoms: () => ({ secretsState: {} }),
  useSharedValue: () => mockSecrets,
}))

const repositoryNode = {
  id: 'repository-node',
  name: 'repository',
  namespace: 'default',
  type: 'git',
  specs: {
    resources: [{ repoURL: 'https://github.com/example/repository', path: 'apps', targetRevision: 'main' }],
  },
} as unknown as TopologyNode

const loadedTree: GitBranchPathNode = {
  type: 'tree',
  path: 'apps',
  children: [{ type: 'file', path: 'apps/README.md', contents: '# Repository' }],
}

describe('RepositoryNavigator', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('shows a spinner instead of the tree until all sources are loaded', () => {
    const onLoadingChange = jest.fn()
    mockGetGitBranchPathDetails.mockReturnValue(new Promise<GitBranchPathNode>(() => {}))

    render(<RepositoryNavigator node={repositoryNode} onSelectItem={jest.fn()} onLoadingChange={onLoadingChange} />)

    expect(screen.getByLabelText('Loading')).toBeInTheDocument()
    expect(screen.queryByLabelText('Repository files')).not.toBeInTheDocument()
    expect(onLoadingChange).toHaveBeenCalledWith(true)
  })

  it('shows the tree and reports loading complete after all sources resolve', async () => {
    const onSelectItem = jest.fn()
    const onLoadingChange = jest.fn()
    mockGetGitBranchPathDetails.mockResolvedValue(loadedTree)

    render(<RepositoryNavigator node={repositoryNode} onSelectItem={onSelectItem} onLoadingChange={onLoadingChange} />)

    expect(await screen.findByLabelText('Repository files')).toBeInTheDocument()
    expect(screen.queryByLabelText('Loading')).not.toBeInTheDocument()
    await waitFor(() => expect(onLoadingChange).toHaveBeenLastCalledWith(false))
    await waitFor(() => expect(onSelectItem).toHaveBeenCalled())
  })
})
