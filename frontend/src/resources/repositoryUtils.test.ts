/* Copyright Contributors to the Open Cluster Management project */

import { Octokit } from '@octokit/rest'
import { TextDecoder } from 'util'
import { getGitBlobContents, getGitBranchPathDetails, type GitBranchPathNode } from './repositoryUtils'

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

  describe('truncated recursive listings', () => {
    const readme: GitBranchPathNode = { type: 'file', path: 'apps/nested/README.md', url: blobURL }
    const nested: GitBranchPathNode = { type: 'tree', path: 'apps/nested', children: [readme] }
    const apps: GitBranchPathNode = { type: 'tree', path: 'apps', children: [nested] }
    const completeTrees = {
      'root-tree': {
        tree: [
          { type: 'tree', path: 'apps', sha: 'apps-tree' },
          { type: 'tree', path: 'apps-other', sha: 'nested-tree' },
          { type: 'blob', path: 'root.md', url: `${blobURL}-root` },
          { type: 'commit', path: 'submodule', sha: 'submodule-commit' },
        ],
      },
      'apps-tree': { tree: [{ type: 'tree', path: 'nested', sha: 'nested-tree' }] },
      'nested-tree': { tree: [{ type: 'blob', path: 'README.md', url: blobURL }] },
    }
    let activeRequests: number
    let maximumActiveRequests: number

    beforeEach(() => {
      activeRequests = 0
      maximumActiveRequests = 0
      mockGetTree.mockImplementation(async ({ tree_sha }: { tree_sha: keyof typeof completeTrees }) => {
        activeRequests++
        maximumActiveRequests = Math.max(maximumActiveRequests, activeRequests)
        await Promise.resolve()
        activeRequests--
        const data = completeTrees[tree_sha]
        if (!data) throw new Error(`Unexpected tree: ${tree_sha}`)
        return { data: { ...data, truncated: false } }
      })
      mockGetTree.mockResolvedValueOnce({
        data: {
          sha: 'root-tree',
          truncated: true,
          // The omitted sibling and root file must be discovered from a fresh non-recursive root listing.
          tree: [
            { type: 'tree', path: 'apps', sha: 'apps-tree' },
            { type: 'tree', path: 'apps/nested', sha: 'nested-tree' },
            { type: 'blob', path: 'apps/nested/README.md', url: blobURL },
          ],
        },
      })
    })

    it('rebuilds the full tree with sequential non-recursive requests, retaining repeated subtree paths', async () => {
      expect(await getGitBranchPathDetails(repoURL, 'main', '')).toEqual({
        type: 'tree',
        path: '',
        children: [
          apps,
          {
            type: 'tree',
            path: 'apps-other',
            children: [{ type: 'file', path: 'apps-other/README.md', url: blobURL }],
          },
          { type: 'file', path: 'root.md', url: `${blobURL}-root` },
        ],
      })
      expect(mockGetTree).toHaveBeenCalledTimes(5)
      expect(mockGetTree).toHaveBeenNthCalledWith(2, {
        owner: 'example',
        repo: 'repository',
        tree_sha: 'root-tree',
      })
      for (const [request] of mockGetTree.mock.calls.slice(1)) {
        expect(request).not.toHaveProperty('recursive')
      }
      expect(maximumActiveRequests).toBe(1)
      expect(mockRequest).not.toHaveBeenCalled()
    })

    it.each([
      { path: '/apps/', expected: apps, requests: 4 },
      { path: '/apps/nested/', expected: nested, requests: 4 },
      { path: '/apps/nested/README.md/', expected: readme, requests: 4 },
      { path: 'root.md', expected: { type: 'file', path: 'root.md', url: `${blobURL}-root` }, requests: 2 },
      { path: 'missing', expected: { type: 'tree', path: 'missing', children: [] }, requests: 2 },
    ])('retrieves $path without traversing unrelated folders', async ({ path, expected, requests }) => {
      expect(await getGitBranchPathDetails(repoURL, 'main', path)).toEqual(expected)
      expect(mockGetTree).toHaveBeenCalledTimes(requests)
      expect(mockRequest).not.toHaveBeenCalled()
    })

    it.each(['failure', 'truncated'])('discards partial results on a non-recursive subtree %s', async (outcome) => {
      const log = jest.spyOn(console, 'log').mockImplementation(() => {})
      mockGetTree.mockImplementation(async ({ tree_sha }: { tree_sha: keyof typeof completeTrees }) => {
        if (tree_sha === 'nested-tree') {
          if (outcome === 'failure') throw new Error('Subtree unavailable')
          return { data: { ...completeTrees[tree_sha], truncated: true } }
        }
        return { data: completeTrees[tree_sha] }
      })
      try {
        expect(await getGitBranchPathDetails(repoURL, 'main', 'apps')).toEqual({
          type: 'tree',
          path: 'apps',
          children: [],
        })
        expect(log).toHaveBeenCalledTimes(1)
        expect(mockRequest).not.toHaveBeenCalled()
      } finally {
        log.mockRestore()
      }
    })
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
