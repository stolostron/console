/* Copyright Contributors to the Open Cluster Management project */
import { Octokit } from '@octokit/rest'
import { getSecret } from '.'

async function getRepoSecret(secretArgs?: { secretRef?: string; namespace?: string }) {
  const repoSecret = { user: '', accessToken: '' }
  if (secretArgs && secretArgs.secretRef && secretArgs.namespace) {
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
  if (accessData && accessData.user && accessData.accessToken) {
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
    .then((octokit) => {
      octokit?.repos
        .getBranch({ ...gitInfo, branch: 'main' })
        .then(({ data }) => {
          console.log(data)
          return octokit.git.getTree({
            ...gitInfo,
            tree_sha: data.commit.sha,
            recursive: 'true',
          })
        })
        .then(({ data }) => {
          console.log(
            data.tree
              ?.filter((item) => item.type === 'blob' || item.type === 'tree')
              .map((item) => ({ path: item.path, type: item.type }))
          )
        })
        .catch(handleGitError)

      return octokit?.repos.listBranches(gitInfo).then(({ data }) => {
        console.log(data)
        return data ? data.map((branch) => branch.name) : []
      })
    })
    .catch((err) => {
      handleGitError(err)
      return []
    })
}

export function getGitChannelPaths(
  channelPath: string,
  branch: string,
  secretArgs?: { secretRef?: string; namespace?: string },
  accessData?: { user?: string; accessToken?: string }
) {
  const gitInfo = getGitInformation(channelPath)
  return getGitConnection(secretArgs, accessData)
    .then((octokit) =>
      octokit?.repos
        .getBranch({
          ...gitInfo,
          branch,
        })
        .then(({ data }) => {
          if (data?.commit?.sha != undefined) {
            return octokit.git
              .getTree({
                ...gitInfo,
                tree_sha: data?.commit?.sha || '',
                recursive: 'true',
              })
              .then(({ data: result }) => {
                console.log(result.tree)
                return result.tree ? result.tree.filter((item) => item.type === 'tree').map((item) => item.path) : []
              })
              .catch(handleGitError)
          }
        })
    )
    .catch(handleGitError)
}

export type GitBranchPathNode =
  { type: 'tree'; path: string; children: GitBranchPathNode[] } | { type: 'file'; path: string; contents: string }

export async function getGitBranchPathDetails(
  repoURL: string,
  revision: string,
  path: string,
  secretArgs?: { secretRef?: string; namespace?: string },
  accessData?: { user?: string; accessToken?: string }
): Promise<GitBranchPathNode> {
  const gitInfo = getGitInformation(repoURL)
  const normalizedPath = path.replace(/^\/+|\/+$/g, '')
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

    type GitTreeItem = NonNullable<typeof treeData.tree>[number] & { path: string; type: 'tree' | 'blob' }
    const matchingItems = (treeData.tree ?? []).filter(
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

    const buildNode = async (item: (typeof matchingItems)[number]): Promise<GitBranchPathNode> => {
      if (item.type === 'blob') {
        return {
          type: 'file',
          path: item.path,
          contents: item.url ? await getGitBlobContents(octokit, item.url) : '',
        }
      }

      const children = await Promise.all((childrenByParent.get(item.path) ?? []).map(buildNode))
      return { type: 'tree', path: item.path, children }
    }

    const rootItem = matchingItems.find((item) => item.path === normalizedPath)
    if (rootItem) {
      return await buildNode(rootItem)
    }

    const children = await Promise.all((childrenByParent.get(normalizedPath) ?? []).map(buildNode))
    return { type: 'tree', path, children }
  } catch (error) {
    handleGitError(error)
    return emptyTree()
  }
}

function isGitPathWithinPath(itemPath: string, path: string) {
  return !path || itemPath === path || itemPath.startsWith(`${path}/`)
}

function getGitParentPath(path: string) {
  const lastSlashIndex = path.lastIndexOf('/')
  return lastSlashIndex === -1 ? '' : path.substring(0, lastSlashIndex)
}

async function getGitBlobContents(octokit: Octokit, blobUrl: string) {
  const { data } = await octokit.request(`GET ${new URL(blobUrl).pathname}`)
  const content = typeof data.content === 'string' ? data.content : ''
  if (data.encoding !== 'base64') return content
  const binary = window.atob(content)
  return new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)))
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
