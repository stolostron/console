/* Copyright Contributors to the Open Cluster Management project */

import type { GitBranchPathNode, Secret } from '~/resources'
import type { TopologyNode } from '../types'

export interface RepositorySource {
  repoURL: string
  path: string
  targetRevision: string
  chart?: string
}

export interface RepositoryNavigatorFileItem {
  id: string
  path: string
  contents: string
}

export interface RepositorySecretAccess {
  secretArgs: { secretRef: string; namespace: string }
  accessData: { user: string; accessToken: string }
}

const GIT_REPO_SECRET_TYPE_LABEL = 'argocd.argoproj.io/secret-type'

function stripGitSuffix(url: string): string {
  return url.replace(/\.git$/, '')
}

export function getGitPathBaseName(path: string): string {
  if (!path) {
    return path
  }
  const segments = path.split('/')
  return segments[segments.length - 1] || path
}

/** Extracts the git/Helm sources (repoURL/path/targetRevision/chart) from a repo (`git`/`chart`) topology node. */
export function buildRepositorySources(node: TopologyNode | undefined): RepositorySource[] {
  const specs = (node?.specs ?? {}) as { resources?: unknown; raw?: Record<string, any> }
  const resources = Array.isArray(specs.resources) ? (specs.resources as Record<string, any>[]) : []

  const fromResources: RepositorySource[] = resources
    .filter((resource) => resource && typeof resource.repoURL === 'string' && resource.repoURL !== '')
    .map((resource) => ({
      repoURL: resource.repoURL as string,
      path: (resource.path as string) ?? '',
      targetRevision: (resource.targetRevision as string) || 'HEAD',
      chart: resource.chart as string | undefined,
    }))

  if (fromResources.length > 0) {
    return fromResources
  }

  // Fallback to the raw ApplicationSet template source when `specs.resources` is not populated
  const rawSource = specs.raw?.spec?.template?.spec?.source as Record<string, any> | undefined
  if (rawSource?.repoURL) {
    return [
      {
        repoURL: rawSource.repoURL as string,
        path: (rawSource.path as string) ?? '',
        targetRevision: (rawSource.targetRevision as string) || 'HEAD',
        chart: rawSource.chart as string | undefined,
      },
    ]
  }

  return []
}

export function getRepositorySourceGroupId(source: RepositorySource): string {
  return `${source.repoURL}::${source.targetRevision}::${source.path}`
}

/** Display label for a repository source's top-level navigator item. Excludes the repo URL. */
export function getRepositorySourceGroupTitle(source: RepositorySource): string {
  if (source.path) {
    return source.chart ? `${source.chart}/${source.path}` : source.path
  }
  return source.chart || source.targetRevision
}

/** Finds the ArgoCD repository Secret (if any) matching `repoURL`, returning connection details for `getGitBranchPathDetails`. */
export function findRepositorySecretAccess(
  repoURL: string,
  secrets: Secret[] | undefined
): RepositorySecretAccess | undefined {
  if (!repoURL || !secrets) {
    return undefined
  }
  const normalizedTarget = stripGitSuffix(repoURL)
  const secret = secrets.find((candidate) => {
    if (candidate.metadata.labels?.[GIT_REPO_SECRET_TYPE_LABEL] !== 'repository') {
      return false
    }
    const secretURL = stripGitSuffix(Buffer.from(candidate.data?.url ?? '', 'base64').toString())
    return secretURL === normalizedTarget
  })
  if (!secret) {
    return undefined
  }
  return {
    secretArgs: {
      secretRef: secret.metadata.name ?? '',
      namespace: secret.metadata.namespace ?? '',
    },
    accessData: {
      user: Buffer.from(secret.data?.username ?? '', 'base64').toString(),
      accessToken: Buffer.from(secret.data?.password ?? '', 'base64').toString(),
    },
  }
}

/** Sorts git tree nodes with folders first, then alphabetically by name. */
export function sortGitBranchPathNodes(nodes: GitBranchPathNode[]): GitBranchPathNode[] {
  return [...nodes].sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'tree' ? -1 : 1
    }
    return getGitPathBaseName(a.path).localeCompare(getGitPathBaseName(b.path))
  })
}

/** Counts the `file` leaf nodes contained within a git tree node (including itself if it is a file). */
export function countGitBranchPathFiles(node: GitBranchPathNode): number {
  if (node.type === 'file') {
    return 1
  }
  return node.children.reduce((sum, child) => sum + countGitBranchPathFiles(child), 0)
}

/** Returns a copy of `node` filtered to items whose name (or a descendant's name) matches `query`, or undefined if no match. */
export function filterGitBranchPathNode(node: GitBranchPathNode, query: string): GitBranchPathNode | undefined {
  if (!query) {
    return node
  }
  const name = getGitPathBaseName(node.path).toLowerCase()
  if (node.type === 'file') {
    return name.includes(query) ? node : undefined
  }
  const filteredChildren = node.children
    .map((child) => filterGitBranchPathNode(child, query))
    .filter((child): child is GitBranchPathNode => child !== undefined)
  if (name.includes(query) || filteredChildren.length > 0) {
    return { ...node, children: filteredChildren }
  }
  return undefined
}
