/* Copyright Contributors to the Open Cluster Management project */
import { Octokit } from '@octokit/rest'
import { getSecret } from '.'

async function getRepoSecret(secretArgs?: { secretRef?: string; namespace?: string }) {
  const repoSecret = { user: '', accessToken: '' }
  if (secretArgs?.secretRef && secretArgs.namespace) {
    const { secretRef, namespace } = secretArgs
    await getSecret({ name: secretRef, namespace: namespace })
      .promise.then((response) => ({
        user: window.atob(response?.data?.user ?? ''),
        accessToken: window.atob(response?.data?.accessToken ?? ''),
      }))
      .then((data) => {
        if (data.user) repoSecret.user = data.user
        if (data.accessToken) repoSecret.accessToken = data.accessToken
      })
      .catch(handleGitError)
  }
  return repoSecret
}

async function getGitConnection(
  secretArgs?: { secretRef?: string; namespace?: string },
  accessData?: { user?: string; accessToken?: string }
) {
  if (accessData?.user && accessData.accessToken) {
    const authBaseUrl = 'https://api.github.com'
    const authOptions = {
      baseUrl: authBaseUrl,
      auth: accessData.accessToken,
    }
    return new Octokit(authOptions)
  } else {
    return getRepoSecret(secretArgs)
      .then(({ accessToken }) => {
        const authBaseUrl = 'https://api.github.com'
        const authOptions = {
          baseUrl: authBaseUrl,
          auth: accessToken,
        }
        return new Octokit(authOptions)
      })
      .catch(handleGitError)
  }
}

export function getGitChannelBranches(
  channelPath: string,
  secretArgs?: { secretRef?: string; namespace?: string },
  accessData?: { user?: string; accessToken?: string }
) {
  const gitInfo = getGitInformation(channelPath)
  return getGitConnection(secretArgs, accessData)
    .then((octokit) =>
      octokit?.repos.listBranches(gitInfo).then(({ data }) => (data ? data.map((branch) => branch.name) : []))
    )
    .catch((err) => {
      handleGitError(err)
      return []
    })
}

export async function getGitChannelPaths(
  channelPath: string,
  branch: string,
  secretArgs?: { secretRef?: string; namespace?: string },
  accessData?: { user?: string; accessToken?: string }
) {
  const gitInfo = getGitInformation(channelPath)
  try {
    const octokit = await getGitConnection(secretArgs, accessData)
    if (!octokit) return

    const { data } = await octokit.repos.getBranch({ ...gitInfo, branch })
    if (data?.commit?.sha == undefined) return

    const { data: result } = await octokit.git.getTree({
      ...gitInfo,
      tree_sha: data.commit.sha || '',
      recursive: 'true',
    })
    return result.tree ? result.tree.filter((item) => item.type === 'tree').map((item) => item.path) : []
  } catch (error) {
    handleGitError(error)
  }
}

export type GitBranchPathNode =
  { type: 'tree'; path: string; children: GitBranchPathNode[] } | { type: 'file'; path: string; url?: string }

type GitTreeEntry = Awaited<ReturnType<Octokit['git']['getTree']>>['data']['tree'][number]

export async function getGitBranchPathDetails(
  repoURL: string,
  revision: string,
  path: string,
  secretArgs?: { secretRef?: string; namespace?: string },
  accessData?: { user?: string; accessToken?: string }
): Promise<GitBranchPathNode> {
  let host = ''
  try {
    host = new URL(repoURL).hostname.toLowerCase()
  } catch {
    return { type: 'tree', path, children: [] }
  }
  if (host !== 'github.com' && host !== 'www.github.com') {
    return { type: 'tree', path, children: [] }
  }
  const gitInfo = getGitInformation(repoURL)
  let pathStart = 0
  let pathEnd = path.length
  while (pathStart < pathEnd && path[pathStart] === '/') pathStart++
  while (pathEnd > pathStart && path[pathEnd - 1] === '/') pathEnd--
  let normalizedPath = path.slice(pathStart, pathEnd)
  if (normalizedPath === '.') {
    normalizedPath = ''
  } else if (normalizedPath.startsWith('./')) {
    normalizedPath = normalizedPath.slice(2)
  }
  const emptyTree = (): GitBranchPathNode => ({ type: 'tree', path, children: [] })

  try {
    const octokit = await getGitConnection(secretArgs, accessData)
    if (!octokit) {
      return emptyTree()
    }

    const resolvedRevision =
      revision === 'HEAD' ? (await octokit.repos.get({ ...gitInfo })).data.default_branch : revision
    const { data: branchData } = await octokit.repos.getBranch({ ...gitInfo, branch: resolvedRevision })
    if (!branchData.commit.sha) {
      return emptyTree()
    }

    const { data: treeData } = await octokit.git.getTree({
      ...gitInfo,
      tree_sha: branchData.commit.sha,
      recursive: 'true',
    })

    const treeItems = treeData.truncated
      ? await getGitSubtreeItems(octokit, gitInfo, treeData.sha || branchData.commit.sha, normalizedPath)
      : (treeData.tree ?? [])
    type GitTreeItem = GitTreeEntry & { path: string; type: 'tree' | 'blob' }
    const matchingItems = treeItems.filter(
      (item): item is GitTreeItem =>
        item.path !== undefined &&
        (item.type === 'tree' || item.type === 'blob') &&
        isGitPathWithinPath(item.path, normalizedPath)
    )
    const childrenByParent = new Map<string, typeof matchingItems>()

    matchingItems.forEach((item) => {
      const parentPath = getGitParentPath(item.path)
      childrenByParent.set(parentPath, [...(childrenByParent.get(parentPath) ?? []), item])
    })

    const buildNode = (item: (typeof matchingItems)[number]): GitBranchPathNode => {
      if (item.type === 'blob') {
        return {
          type: 'file',
          path: item.path,
          url: item.url,
        }
      }

      const children = (childrenByParent.get(item.path) ?? []).map(buildNode)
      return { type: 'tree', path: item.path, children }
    }

    const rootItem = matchingItems.find((item) => item.path === normalizedPath)
    if (rootItem) {
      return buildNode(rootItem)
    }

    const children = (childrenByParent.get(normalizedPath) ?? []).map(buildNode)
    return { type: 'tree', path, children }
  } catch (error) {
    handleGitError(error)
    return emptyTree()
  }
}

async function getGitSubtreeItems(
  octokit: Octokit,
  gitInfo: { owner: string; repo: string },
  treeSha: string,
  path: string
): Promise<GitTreeEntry[]> {
  const items: GitTreeEntry[] = []
  const pendingTrees = [{ sha: treeSha, path: '' }]

  // Fetch one subtree at a time to avoid a burst of requests for large repositories.
  while (pendingTrees.length > 0) {
    const subtree = pendingTrees.pop()!
    // Omit recursive entirely: GitHub enables recursion for any supplied value, including "false".
    const { data } = await octokit.git.getTree({ ...gitInfo, tree_sha: subtree.sha })
    if (data.truncated) throw new Error('GitHub returned a truncated non-recursive tree')

    for (const item of data.tree ?? []) {
      if (item.path === undefined) continue
      const itemPath = subtree.path ? `${subtree.path}/${item.path}` : item.path
      const withinPath = isGitPathWithinPath(itemPath, path)
      if (withinPath) items.push({ ...item, path: itemPath })

      if (item.type === 'tree' && (withinPath || isGitPathWithinPath(path, itemPath))) {
        if (!item.sha) throw new Error('GitHub tree entry is missing its SHA')
        pendingTrees.push({ sha: item.sha, path: itemPath })
      }
    }
  }

  return items
}

function isGitPathWithinPath(itemPath: string, path: string) {
  return !path || itemPath === path || itemPath.startsWith(`${path}/`)
}

function getGitParentPath(path: string) {
  const lastSlashIndex = path.lastIndexOf('/')
  return lastSlashIndex === -1 ? '' : path.substring(0, lastSlashIndex)
}

export async function getGitBlobContents(
  blobUrl: string | undefined,
  secretArgs?: { secretRef?: string; namespace?: string },
  accessData?: { user?: string; accessToken?: string }
): Promise<string> {
  if (!blobUrl) throw new Error('Missing Git blob URL')
  const octokit = await getGitConnection(secretArgs, accessData)
  if (!octokit) throw new Error('Unable to connect to GitHub')
  const { data } = await octokit.request(`GET ${new URL(blobUrl).pathname}`)
  const content = typeof data.content === 'string' ? data.content : ''
  if (data.encoding !== 'base64') return content
  const binary = window.atob(content)
  return new TextDecoder().decode(Uint8Array.from(binary, (character) => character.codePointAt(0)!))
}

function getGitInformation(path: string) {
  const gitApiPath = new URL(path).pathname.substring(1).replace('.git', '').split('/')
  const gitOwner = gitApiPath.length > 0 ? gitApiPath[0] : ''
  const gitRepo = gitApiPath.length > 1 ? gitApiPath[1] : ''

  return { owner: gitOwner, repo: gitRepo }
}

const handleGitError = (err: any) => {
  console.log(new Error(err))
}
