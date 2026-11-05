/* Copyright Contributors to the Open Cluster Management project */

import { Octokit } from '@octokit/rest'
import { TextDecoder } from 'util'
import { getGitBlobContents, getGitBranchPathDetails } from './repositoryUtils'

jest.mock('@octokit/rest')
jest.mock('~/resources', () => ({ getSecret: jest.fn() }))

const mockRequest = jest.fn()
const mockGetTree = jest.fn()
const mockGetBranch = jest.fn()
const mockGetRepo = jest.fn()
const repoURL = 'https://github.com/example/repository'
const blobURL = 'https://api.github.com/repos/example/repository/git/blobs/readme'

beforeEach(() => {
  jest.resetAllMocks()
  jest.mocked(Octokit).mockImplementation(
    () =>
      ({
        request: mockRequest,
        repos: { get: mockGetRepo, getBranch: mockGetBranch },
        git: { getTree: mockGetTree },
      }) as unknown as Octokit
  )
  mockGetBranch.mockResolvedValue({ data: { commit: { sha: 'commit-sha' } } })
  mockGetRepo.mockResolvedValue({ data: { default_branch: 'main' } })
  mockGetTree.mockResolvedValue({
    data: {
      tree: [
        { type: 'tree', path: 'apps' },
        { type: 'tree', path: 'apps/nested' },
        { type: 'blob', path: 'apps/nested/README.md', url: blobURL },
        { type: 'blob', path: 'apps-other/ignored.md', url: `${blobURL}-other` },
      ],
    },
  })
})

describe('getGitBranchPathDetails', () => {
  it('builds nested trees from the listing without requesting any blobs', async () => {
    expect(await getGitBranchPathDetails(repoURL, 'main', '/apps/')).toEqual({
      type: 'tree',
      path: 'apps',
      children: [
        {
          type: 'tree',
          path: 'apps/nested',
          children: [{ type: 'file', path: 'apps/nested/README.md', url: blobURL }],
        },
      ],
    })
    expect(mockGetTree).toHaveBeenCalledWith({
      owner: 'example',
      repo: 'repository',
      tree_sha: 'commit-sha',
      recursive: 'true',
    })
    expect(mockRequest).not.toHaveBeenCalled()
  })

  it('keeps request counts constant for a repository-wide view', async () => {
    const tree = Array.from({ length: 100 }, (_, index) => ({
      type: 'blob',
      path: `${index}.txt`,
      url: `${blobURL}-${index}`,
    }))
    mockGetTree.mockResolvedValue({ data: { tree } })

    const result = await getGitBranchPathDetails(repoURL, 'HEAD', '')

    expect(result.type === 'tree' && result.children.length).toBe(100)
    expect(mockGetRepo).toHaveBeenCalledTimes(1)
    expect(mockGetBranch).toHaveBeenCalledTimes(1)
    expect(mockGetTree).toHaveBeenCalledTimes(1)
    expect(mockRequest).not.toHaveBeenCalled()
  })

  it('retains the blob URL when the requested path is a file', async () => {
    expect(await getGitBranchPathDetails(repoURL, 'main', 'apps/nested/README.md')).toEqual({
      type: 'file',
      path: 'apps/nested/README.md',
      url: blobURL,
    })
    expect(mockRequest).not.toHaveBeenCalled()
  })
})

describe('getGitBlobContents', () => {
  it('fetches and decodes UTF-8 contents using the supplied repository access', async () => {
    const originalTextDecoder = globalThis.TextDecoder
    globalThis.TextDecoder = TextDecoder as typeof globalThis.TextDecoder
    try {
      mockRequest.mockResolvedValue({
        data: { encoding: 'base64', content: Buffer.from('Hello 世界').toString('base64') },
      })

      expect(await getGitBlobContents(blobURL, undefined, { user: 'test-user', accessToken: 'test-token' })).toBe(
        'Hello 世界'
      )
      expect(Octokit).toHaveBeenCalledWith({ baseUrl: 'https://api.github.com', auth: 'test-token' })
      expect(mockRequest).toHaveBeenCalledWith('GET /repos/example/repository/git/blobs/readme')
    } finally {
      globalThis.TextDecoder = originalTextDecoder
    }
  })

  it('returns empty file contents as a successful load', async () => {
    mockRequest.mockResolvedValue({ data: { content: '', encoding: 'utf-8' } })
    await expect(getGitBlobContents(blobURL)).resolves.toBe('')
  })

  it('rejects failed requests so the selected file can display an error', async () => {
    const error = new Error('Rate limit exceeded')
    mockRequest.mockRejectedValue(error)
    await expect(getGitBlobContents(blobURL)).rejects.toBe(error)
  })

  it('rejects missing blob URLs instead of displaying an empty file', async () => {
    await expect(getGitBlobContents(undefined)).rejects.toThrow('Missing Git blob URL')
    expect(mockRequest).not.toHaveBeenCalled()
  })
})
