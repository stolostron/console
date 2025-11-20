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

jest.mock('@patternfly-labs/react-form-wizard', () => ({
  ...jest.requireActual('@patternfly-labs/react-form-wizard'),
  useItem: (key: string) => mockState.wizardData[key],
  useData: () => ({ wizardData: mockState.wizardData, update: mockState.update }),
  WizAsyncSelect: () => null,
}))

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useContext: () => mockState.wizardData,
}))

// Import components after mocks
import { GitRevisionSelect } from './GitRevisionSelect'
import { GitPathSelect } from './GitPathSelect'

const mockChannels: Channel[] = [
  {
    metadata: { name: 'test-channel', namespace: 'test-ns' },
    spec: { pathname: 'https://github.com/test/repo', type: 'git' },
  },
]

describe('GitRevisionSelect', () => {
  beforeEach(() => {
    mockState.wizardData = {}
    mockState.update = jest.fn()
    jest.clearAllMocks()
  })

  test('should clear targetRevision and path when repoURL changes', () => {
    mockState.wizardData = { repoURL: 'https://github.com/test/repo', targetRevision: 'main', path: '/charts' }
    const { rerender } = render(<GitRevisionSelect channels={mockChannels} />)

    act(() => {
      mockState.wizardData = { ...mockState.wizardData, repoURL: 'https://github.com/test/new-repo' }
    })
    rerender(<GitRevisionSelect channels={mockChannels} />)

    expect(mockState.update).toHaveBeenCalled()
  })

  test('should clear only targetRevision when path is not set', () => {
    mockState.wizardData = { repoURL: 'https://github.com/test/repo', targetRevision: 'main' }
    const { rerender } = render(<GitRevisionSelect channels={mockChannels} />)

    act(() => {
      mockState.wizardData = { ...mockState.wizardData, repoURL: 'https://github.com/test/new-repo' }
    })
    rerender(<GitRevisionSelect channels={mockChannels} />)

    expect(mockState.update).toHaveBeenCalled()
  })

  test('should clear only path when targetRevision is not set', () => {
    mockState.wizardData = { repoURL: 'https://github.com/test/repo', path: '/charts' }
    const { rerender } = render(<GitRevisionSelect channels={mockChannels} />)

    act(() => {
      mockState.wizardData = { ...mockState.wizardData, repoURL: 'https://github.com/test/new-repo' }
    })
    rerender(<GitRevisionSelect channels={mockChannels} />)

    expect(mockState.update).toHaveBeenCalled()
  })

  test('should not clear on initial mount', () => {
    mockState.wizardData = { repoURL: 'https://github.com/test/repo', targetRevision: 'main' }
    render(<GitRevisionSelect channels={mockChannels} />)
    expect(mockState.update).not.toHaveBeenCalled()
  })

  test('should not clear when repoURL stays the same', () => {
    mockState.wizardData = { repoURL: 'https://github.com/test/repo', targetRevision: 'main' }
    const { rerender } = render(<GitRevisionSelect channels={mockChannels} />)

    rerender(<GitRevisionSelect channels={mockChannels} />)
    expect(mockState.update).not.toHaveBeenCalled()
  })

  test('should not clear when values are empty', () => {
    mockState.wizardData = { repoURL: 'https://github.com/test/repo' }
    const { rerender } = render(<GitRevisionSelect channels={mockChannels} />)

    act(() => {
      mockState.wizardData = { ...mockState.wizardData, repoURL: 'https://github.com/test/new-repo' }
    })
    rerender(<GitRevisionSelect channels={mockChannels} />)

    expect(mockState.update).not.toHaveBeenCalled()
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
    const { rerender } = render(<GitPathSelect channels={mockChannels} />)

    act(() => {
      mockState.wizardData = { ...mockState.wizardData, repoURL: 'https://github.com/test/new-repo' }
    })
    rerender(<GitPathSelect channels={mockChannels} />)

    expect(mockState.update).toHaveBeenCalled()
  })

  test('should clear path when revision changes', () => {
    mockState.wizardData = { repoURL: 'https://github.com/test/repo', targetRevision: 'main', path: '/charts' }
    const { rerender } = render(<GitPathSelect channels={mockChannels} />)

    act(() => {
      mockState.wizardData = { ...mockState.wizardData, targetRevision: 'develop' }
    })
    rerender(<GitPathSelect channels={mockChannels} />)

    expect(mockState.update).toHaveBeenCalled()
  })

  test('should clear path only once when both repoURL and revision change', () => {
    mockState.wizardData = { repoURL: 'https://github.com/test/repo', targetRevision: 'main', path: '/charts' }
    const { rerender } = render(<GitPathSelect channels={mockChannels} />)

    act(() => {
      mockState.wizardData = {
        ...mockState.wizardData,
        repoURL: 'https://github.com/test/new-repo',
        targetRevision: 'develop',
      }
    })
    rerender(<GitPathSelect channels={mockChannels} />)

    expect(mockState.update).toHaveBeenCalledTimes(1)
  })

  test('should not clear on initial mount', () => {
    mockState.wizardData = { repoURL: 'https://github.com/test/repo', targetRevision: 'main', path: '/charts' }
    render(<GitPathSelect channels={mockChannels} />)
    expect(mockState.update).not.toHaveBeenCalled()
  })

  test('should not clear when values unchanged', () => {
    mockState.wizardData = { repoURL: 'https://github.com/test/repo', targetRevision: 'main', path: '/charts' }
    const { rerender } = render(<GitPathSelect channels={mockChannels} />)

    rerender(<GitPathSelect channels={mockChannels} />)
    expect(mockState.update).not.toHaveBeenCalled()
  })

  test('should not clear when path is empty', () => {
    mockState.wizardData = { repoURL: 'https://github.com/test/repo', targetRevision: 'main' }
    const { rerender } = render(<GitPathSelect channels={mockChannels} />)

    act(() => {
      mockState.wizardData = { ...mockState.wizardData, repoURL: 'https://github.com/test/new-repo' }
    })
    rerender(<GitPathSelect channels={mockChannels} />)

    expect(mockState.update).not.toHaveBeenCalled()
  })
})
