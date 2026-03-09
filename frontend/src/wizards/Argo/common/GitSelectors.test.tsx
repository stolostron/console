/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { act } from 'react-dom/test-utils'
import { Channel } from '../ArgoWizard'

// Mock wizard hooks - declare before jest.mock to avoid hoisting issues
const mockState = {
  wizardData: {} as any,
  update: jest.fn(),
}

// Mock dependencies
jest.mock('../../../lib/acm-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

jest.mock('../../../resources', () => ({
  getGitChannelBranches: jest.fn(() => Promise.resolve(['main', 'develop'])),
  getGitChannelPaths: jest.fn(() => Promise.resolve(['/', '/charts', '/manifests'])),
}))

jest.mock('../ArgoWizard', () => ({
  getGitBranchList: jest.fn((channel: any, getGitChannelBranches: any) =>
    getGitChannelBranches(channel).then((branches: string[]) => branches)
  ),
  getGitPathList: jest.fn((channel: any, revision: any, getGitChannelPaths: any) =>
    getGitChannelPaths(channel, revision).then((paths: string[]) => paths)
  ),
}))

let capturedAsyncCallback: (() => Promise<any>) | null = null

jest.mock('@patternfly-labs/react-form-wizard', () => ({
  ...jest.requireActual('@patternfly-labs/react-form-wizard'),
  useItem: (key: string) => mockState.wizardData[key],
  useData: () => ({ wizardData: mockState.wizardData, update: mockState.update }),
  WizAsyncSelect: ({ asyncCallback }: any) => {
    capturedAsyncCallback = asyncCallback
    return null
  },
}))

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useContext: () => mockState.wizardData,
}))

// Import components after mocks
import { GitRevisionSelect } from './GitRevisionSelect'
import { GitPathSelect } from './GitPathSelect'
import { getGitChannelBranches, getGitChannelPaths } from '../../../resources'
import { Secret } from '../../../resources'

const toBase64 = (str: string) => Buffer.from(str).toString('base64')

const mockChannels: Channel[] = [
  {
    metadata: { name: 'test-channel', namespace: 'test-ns' },
    spec: { pathname: 'https://github.com/test/repo', type: 'git' },
  },
]

const mockRepoSecret: Secret = {
  apiVersion: 'v1',
  kind: 'Secret',
  metadata: {
    name: 'repo-secret',
    namespace: 'argocd',
    labels: { 'argocd.argoproj.io/secret-type': 'repository' },
  },
  data: {
    url: toBase64('https://github.com/test/repo'),
    username: toBase64('myuser'),
    password: toBase64('mytoken'),
  },
}

const mockRepoSecretWithGitSuffix: Secret = {
  apiVersion: 'v1',
  kind: 'Secret',
  metadata: {
    name: 'repo-secret-git',
    namespace: 'argocd',
    labels: { 'argocd.argoproj.io/secret-type': 'repository' },
  },
  data: {
    url: toBase64('https://github.com/test/repo.git'),
    username: toBase64('gituser'),
    password: toBase64('gittoken'),
  },
}

const mockClusterSecret: Secret = {
  apiVersion: 'v1',
  kind: 'Secret',
  metadata: {
    name: 'cluster-secret',
    namespace: 'argocd',
    labels: { 'argocd.argoproj.io/secret-type': 'cluster' },
  },
  data: {
    url: toBase64('https://github.com/test/repo'),
  },
}

const mockUnlabeledSecret: Secret = {
  apiVersion: 'v1',
  kind: 'Secret',
  metadata: {
    name: 'no-label-secret',
    namespace: 'argocd',
  },
  data: {
    url: toBase64('https://github.com/test/repo'),
  },
}

describe('GitRevisionSelect', () => {
  beforeEach(() => {
    mockState.wizardData = {}
    mockState.update = jest.fn()
    jest.clearAllMocks()
  })

  test('should clear targetRevision and path when repoURL changes', () => {
    mockState.wizardData = { repoURL: 'https://github.com/test/repo', targetRevision: 'main', path: '/charts' }
    const { rerender } = render(<GitRevisionSelect channels={mockChannels} secrets={[]} />)

    act(() => {
      mockState.wizardData = { ...mockState.wizardData, repoURL: 'https://github.com/test/new-repo' }
    })
    rerender(<GitRevisionSelect channels={mockChannels} secrets={[]} />)

    expect(mockState.update).toHaveBeenCalled()
  })

  test('should clear only targetRevision when path is not set', () => {
    mockState.wizardData = { repoURL: 'https://github.com/test/repo', targetRevision: 'main' }
    const { rerender } = render(<GitRevisionSelect channels={mockChannels} secrets={[]} />)

    act(() => {
      mockState.wizardData = { ...mockState.wizardData, repoURL: 'https://github.com/test/new-repo' }
    })
    rerender(<GitRevisionSelect channels={mockChannels} secrets={[]} />)

    expect(mockState.update).toHaveBeenCalled()
  })

  test('should clear only path when targetRevision is not set', () => {
    mockState.wizardData = { repoURL: 'https://github.com/test/repo', path: '/charts' }
    const { rerender } = render(<GitRevisionSelect channels={mockChannels} secrets={[]} />)

    act(() => {
      mockState.wizardData = { ...mockState.wizardData, repoURL: 'https://github.com/test/new-repo' }
    })
    rerender(<GitRevisionSelect channels={mockChannels} secrets={[]} />)

    expect(mockState.update).toHaveBeenCalled()
  })

  test('should not clear on initial mount', () => {
    mockState.wizardData = { repoURL: 'https://github.com/test/repo', targetRevision: 'main' }
    render(<GitRevisionSelect channels={mockChannels} secrets={[]} />)
    expect(mockState.update).not.toHaveBeenCalled()
  })

  test('should not clear when repoURL stays the same', () => {
    mockState.wizardData = { repoURL: 'https://github.com/test/repo', targetRevision: 'main' }
    const { rerender } = render(<GitRevisionSelect channels={mockChannels} secrets={[]} />)

    rerender(<GitRevisionSelect channels={mockChannels} secrets={[]} />)
    expect(mockState.update).not.toHaveBeenCalled()
  })

  test('should not clear when values are empty', () => {
    mockState.wizardData = { repoURL: 'https://github.com/test/repo' }
    const { rerender } = render(<GitRevisionSelect channels={mockChannels} secrets={[]} />)

    act(() => {
      mockState.wizardData = { ...mockState.wizardData, repoURL: 'https://github.com/test/new-repo' }
    })
    rerender(<GitRevisionSelect channels={mockChannels} secrets={[]} />)

    expect(mockState.update).not.toHaveBeenCalled()
  })
})

describe('GitRevisionSelect secret matching and branch fetching', () => {
  beforeEach(() => {
    mockState.wizardData = {}
    mockState.update = jest.fn()
    capturedAsyncCallback = null
    jest.clearAllMocks()
  })

  test('should use getGitChannelBranches with decoded credentials when a matching secret is found', async () => {
    mockState.wizardData = { repoURL: 'https://github.com/test/repo' }
    render(<GitRevisionSelect channels={mockChannels} secrets={[mockRepoSecret]} />)

    expect(capturedAsyncCallback).not.toBeNull()
    const result = await capturedAsyncCallback!()

    expect(getGitChannelBranches).toHaveBeenCalledWith(
      'https://github.com/test/repo',
      { secretRef: 'repo-secret', namespace: 'argocd' },
      { user: 'myuser', accessToken: 'mytoken' }
    )
    expect(result).toEqual(['main', 'develop'])
  })

  test('should match secret URL after stripping .git suffix from both URLs', async () => {
    mockState.wizardData = { repoURL: 'https://github.com/test/repo.git' }
    render(<GitRevisionSelect channels={mockChannels} secrets={[mockRepoSecret]} />)

    await capturedAsyncCallback!()

    expect(getGitChannelBranches).toHaveBeenCalledWith(
      'https://github.com/test/repo.git',
      { secretRef: 'repo-secret', namespace: 'argocd' },
      { user: 'myuser', accessToken: 'mytoken' }
    )
  })

  test('should match when secret URL has .git suffix but repoURL does not', async () => {
    mockState.wizardData = { repoURL: 'https://github.com/test/repo' }
    render(<GitRevisionSelect channels={mockChannels} secrets={[mockRepoSecretWithGitSuffix]} />)

    await capturedAsyncCallback!()

    expect(getGitChannelBranches).toHaveBeenCalledWith(
      'https://github.com/test/repo',
      { secretRef: 'repo-secret-git', namespace: 'argocd' },
      { user: 'gituser', accessToken: 'gittoken' }
    )
  })

  test('should not match secrets without the repository label', async () => {
    mockState.wizardData = { repoURL: 'https://github.com/test/repo' }
    render(<GitRevisionSelect channels={mockChannels} secrets={[mockClusterSecret]} />)

    await capturedAsyncCallback!()

    expect(getGitChannelBranches).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({ user: expect.anything() })
    )
  })

  test('should not match secrets without any labels', async () => {
    mockState.wizardData = { repoURL: 'https://github.com/test/repo' }
    render(<GitRevisionSelect channels={mockChannels} secrets={[mockUnlabeledSecret]} />)

    await capturedAsyncCallback!()

    expect(getGitChannelBranches).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({ user: expect.anything() })
    )
  })

  test('should skip secret matching when repoURL is empty', async () => {
    mockState.wizardData = { repoURL: '' }
    render(<GitRevisionSelect channels={mockChannels} secrets={[mockRepoSecret]} />)

    await capturedAsyncCallback!()

    expect(getGitChannelBranches).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({ user: expect.anything() })
    )
  })

  test('should fall back to getGitBranchList when no matching secret is found', async () => {
    mockState.wizardData = { repoURL: 'https://github.com/test/repo' }
    const unrelatedSecret: Secret = {
      apiVersion: 'v1',
      kind: 'Secret',
      metadata: {
        name: 'other-secret',
        namespace: 'argocd',
        labels: { 'argocd.argoproj.io/secret-type': 'repository' },
      },
      data: {
        url: toBase64('https://github.com/other/repo'),
      },
    }
    render(<GitRevisionSelect channels={mockChannels} secrets={[unrelatedSecret]} />)

    const result = await capturedAsyncCallback!()

    expect(getGitChannelBranches).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({ user: expect.anything() })
    )
    expect(result).toEqual(['main', 'develop'])
  })

  test('should prepend provided revisions to branch results when secret matches', async () => {
    mockState.wizardData = { repoURL: 'https://github.com/test/repo' }
    render(<GitRevisionSelect channels={mockChannels} secrets={[mockRepoSecret]} revisions={['HEAD', 'v1.0']} />)

    const result = await capturedAsyncCallback!()

    expect(result).toEqual(['HEAD', 'v1.0', 'main', 'develop'])
  })

  test('should prepend provided revisions to branch results when falling back to channel', async () => {
    mockState.wizardData = { repoURL: 'https://github.com/test/repo' }
    render(<GitRevisionSelect channels={mockChannels} secrets={[]} revisions={['HEAD']} />)

    const result = await capturedAsyncCallback!()

    expect(result).toEqual(['HEAD', 'main', 'develop'])
  })

  test('should decode credentials with empty data fields gracefully', async () => {
    mockState.wizardData = { repoURL: 'https://github.com/test/repo' }
    const secretNoCredentials: Secret = {
      apiVersion: 'v1',
      kind: 'Secret',
      metadata: {
        name: 'no-creds',
        namespace: 'argocd',
        labels: { 'argocd.argoproj.io/secret-type': 'repository' },
      },
      data: {
        url: toBase64('https://github.com/test/repo'),
      },
    }
    render(<GitRevisionSelect channels={mockChannels} secrets={[secretNoCredentials]} />)

    await capturedAsyncCallback!()

    expect(getGitChannelBranches).toHaveBeenCalledWith(
      'https://github.com/test/repo',
      { secretRef: 'no-creds', namespace: 'argocd' },
      { user: '', accessToken: '' }
    )
  })
})

describe('GitPathSelect', () => {
  beforeEach(() => {
    mockState.wizardData = {}
    mockState.update = jest.fn()
    jest.clearAllMocks()
  })

  test('should clear path when repoURL changes', () => {
    mockState.wizardData = { repoURL: 'https://github.com/test/repo', targetRevision: 'main', path: '/charts' }
    const { rerender } = render(<GitPathSelect channels={mockChannels} secrets={[]} />)

    act(() => {
      mockState.wizardData = { ...mockState.wizardData, repoURL: 'https://github.com/test/new-repo' }
    })
    rerender(<GitPathSelect channels={mockChannels} secrets={[]} />)

    expect(mockState.update).toHaveBeenCalled()
  })

  test('should clear path when revision changes', () => {
    mockState.wizardData = { repoURL: 'https://github.com/test/repo', targetRevision: 'main', path: '/charts' }
    const { rerender } = render(<GitPathSelect channels={mockChannels} secrets={[]} />)

    act(() => {
      mockState.wizardData = { ...mockState.wizardData, targetRevision: 'develop' }
    })
    rerender(<GitPathSelect channels={mockChannels} secrets={[]} />)

    expect(mockState.update).toHaveBeenCalled()
  })

  test('should clear path only once when both repoURL and revision change', () => {
    mockState.wizardData = { repoURL: 'https://github.com/test/repo', targetRevision: 'main', path: '/charts' }
    const { rerender } = render(<GitPathSelect channels={mockChannels} secrets={[]} />)

    act(() => {
      mockState.wizardData = {
        ...mockState.wizardData,
        repoURL: 'https://github.com/test/new-repo',
        targetRevision: 'develop',
      }
    })
    rerender(<GitPathSelect channels={mockChannels} secrets={[]} />)

    expect(mockState.update).toHaveBeenCalledTimes(1)
  })

  test('should not clear on initial mount', () => {
    mockState.wizardData = { repoURL: 'https://github.com/test/repo', targetRevision: 'main', path: '/charts' }
    render(<GitPathSelect channels={mockChannels} secrets={[]} />)
    expect(mockState.update).not.toHaveBeenCalled()
  })

  test('should not clear when values unchanged', () => {
    mockState.wizardData = { repoURL: 'https://github.com/test/repo', targetRevision: 'main', path: '/charts' }
    const { rerender } = render(<GitPathSelect channels={mockChannels} secrets={[]} />)

    rerender(<GitPathSelect channels={mockChannels} secrets={[]} />)
    expect(mockState.update).not.toHaveBeenCalled()
  })

  test('should not clear when path is empty', () => {
    mockState.wizardData = { repoURL: 'https://github.com/test/repo', targetRevision: 'main' }
    const { rerender } = render(<GitPathSelect channels={mockChannels} secrets={[]} />)

    act(() => {
      mockState.wizardData = { ...mockState.wizardData, repoURL: 'https://github.com/test/new-repo' }
    })
    rerender(<GitPathSelect channels={mockChannels} secrets={[]} />)

    expect(mockState.update).not.toHaveBeenCalled()
  })
})

describe('GitPathSelect secret matching and path fetching', () => {
  beforeEach(() => {
    mockState.wizardData = {}
    mockState.update = jest.fn()
    capturedAsyncCallback = null
    jest.clearAllMocks()
  })

  test('should return empty array when revision is not set', async () => {
    mockState.wizardData = { repoURL: 'https://github.com/test/repo', targetRevision: '' }
    render(<GitPathSelect channels={mockChannels} secrets={[mockRepoSecret]} />)

    const result = await capturedAsyncCallback!()

    expect(result).toEqual([])
    expect(getGitChannelPaths).not.toHaveBeenCalled()
  })

  test('should use getGitChannelPaths with decoded credentials when a matching secret is found', async () => {
    mockState.wizardData = { repoURL: 'https://github.com/test/repo', targetRevision: 'main' }
    render(<GitPathSelect channels={mockChannels} secrets={[mockRepoSecret]} />)

    const result = await capturedAsyncCallback!()

    expect(getGitChannelPaths).toHaveBeenCalledWith(
      'https://github.com/test/repo',
      'main',
      { secretRef: 'repo-secret', namespace: 'argocd' },
      { user: 'myuser', accessToken: 'mytoken' }
    )
    expect(result).toEqual(['/', '/charts', '/manifests'])
  })

  test('should match secret URL after stripping .git suffix from both URLs', async () => {
    mockState.wizardData = { repoURL: 'https://github.com/test/repo.git', targetRevision: 'main' }
    render(<GitPathSelect channels={mockChannels} secrets={[mockRepoSecret]} />)

    await capturedAsyncCallback!()

    expect(getGitChannelPaths).toHaveBeenCalledWith(
      'https://github.com/test/repo.git',
      'main',
      { secretRef: 'repo-secret', namespace: 'argocd' },
      { user: 'myuser', accessToken: 'mytoken' }
    )
  })

  test('should match when secret URL has .git suffix but repoURL does not', async () => {
    mockState.wizardData = { repoURL: 'https://github.com/test/repo', targetRevision: 'develop' }
    render(<GitPathSelect channels={mockChannels} secrets={[mockRepoSecretWithGitSuffix]} />)

    await capturedAsyncCallback!()

    expect(getGitChannelPaths).toHaveBeenCalledWith(
      'https://github.com/test/repo',
      'develop',
      { secretRef: 'repo-secret-git', namespace: 'argocd' },
      { user: 'gituser', accessToken: 'gittoken' }
    )
  })

  test('should not match secrets without the repository label', async () => {
    mockState.wizardData = { repoURL: 'https://github.com/test/repo', targetRevision: 'main' }
    render(<GitPathSelect channels={mockChannels} secrets={[mockClusterSecret]} />)

    await capturedAsyncCallback!()

    expect(getGitChannelPaths).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.objectContaining({ user: expect.anything() })
    )
  })

  test('should not match secrets without any labels', async () => {
    mockState.wizardData = { repoURL: 'https://github.com/test/repo', targetRevision: 'main' }
    render(<GitPathSelect channels={mockChannels} secrets={[mockUnlabeledSecret]} />)

    await capturedAsyncCallback!()

    expect(getGitChannelPaths).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.objectContaining({ user: expect.anything() })
    )
  })

  test('should skip secret matching when repoURL is empty', async () => {
    mockState.wizardData = { repoURL: '', targetRevision: 'main' }
    render(<GitPathSelect channels={mockChannels} secrets={[mockRepoSecret]} />)

    await capturedAsyncCallback!()

    expect(getGitChannelPaths).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.objectContaining({ user: expect.anything() })
    )
  })

  test('should fall back to getGitPathList when no matching secret is found', async () => {
    mockState.wizardData = { repoURL: 'https://github.com/test/repo', targetRevision: 'main' }
    const unrelatedSecret: Secret = {
      apiVersion: 'v1',
      kind: 'Secret',
      metadata: {
        name: 'other-secret',
        namespace: 'argocd',
        labels: { 'argocd.argoproj.io/secret-type': 'repository' },
      },
      data: {
        url: toBase64('https://github.com/other/repo'),
      },
    }
    render(<GitPathSelect channels={mockChannels} secrets={[unrelatedSecret]} />)

    const result = await capturedAsyncCallback!()

    expect(getGitChannelPaths).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.objectContaining({ user: expect.anything() })
    )
    expect(result).toEqual(['/', '/charts', '/manifests'])
  })

  test('should decode credentials with empty data fields gracefully', async () => {
    mockState.wizardData = { repoURL: 'https://github.com/test/repo', targetRevision: 'main' }
    const secretNoCredentials: Secret = {
      apiVersion: 'v1',
      kind: 'Secret',
      metadata: {
        name: 'no-creds',
        namespace: 'argocd',
        labels: { 'argocd.argoproj.io/secret-type': 'repository' },
      },
      data: {
        url: toBase64('https://github.com/test/repo'),
      },
    }
    render(<GitPathSelect channels={mockChannels} secrets={[secretNoCredentials]} />)

    await capturedAsyncCallback!()

    expect(getGitChannelPaths).toHaveBeenCalledWith(
      'https://github.com/test/repo',
      'main',
      { secretRef: 'no-creds', namespace: 'argocd' },
      { user: '', accessToken: '' }
    )
  })

  test('should filter out undefined paths from results', async () => {
    ;(getGitChannelPaths as jest.Mock).mockResolvedValueOnce(['/valid', undefined, '/also-valid', undefined])
    mockState.wizardData = { repoURL: 'https://github.com/test/repo', targetRevision: 'main' }
    render(<GitPathSelect channels={mockChannels} secrets={[mockRepoSecret]} />)

    const result = await capturedAsyncCallback!()

    expect(result).toEqual(['/valid', '/also-valid'])
  })

  test('should handle undefined result from getGitChannelPaths', async () => {
    ;(getGitChannelPaths as jest.Mock).mockResolvedValueOnce(undefined)
    mockState.wizardData = { repoURL: 'https://github.com/test/repo', targetRevision: 'main' }
    render(<GitPathSelect channels={mockChannels} secrets={[mockRepoSecret]} />)

    const result = await capturedAsyncCallback!()

    expect(result).toEqual([])
  })
})
