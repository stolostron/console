/* Copyright Contributors to the Open Cluster Management project */

import type { FC } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { SearchInput, Spinner, TreeView, type TreeViewDataItem } from '@patternfly/react-core'
import { FileIcon, FolderIcon, FolderOpenIcon } from '@patternfly/react-icons'
import { useTranslation } from '~/lib/acm-i18next'
import { useSharedAtoms, useSharedValue } from '~/shared-atoms'
import { getGitBranchPathDetails, type GitBranchPathNode } from '~/resources'
import type { TopologyNode } from '../types'
import {
  buildRepositorySources,
  countGitBranchPathFiles,
  filterGitBranchPathNode,
  findRepositorySecretAccess,
  getGitPathBaseName,
  getRepositorySourceGroupId,
  getRepositorySourceGroupTitle,
  sortGitBranchPathNodes,
  type RepositoryNavigatorFileItem,
  type RepositorySource,
} from '../helpers/repositoryNavigatorHelpers'
import './ResourceNavigator.css'

export type { RepositoryNavigatorFileItem }

/** When the repository tree has fewer files than this, every folder is expanded by default. */
const AUTO_EXPAND_FILE_COUNT_THRESHOLD = 30

export type RepositoryNavigatorProps = {
  /** The repo (`git`/`chart`) topology node whose sources should be browsed */
  node: TopologyNode
  selectedItemId?: string
  onSelectItem: (item: RepositoryNavigatorFileItem) => void
  /** Called once, after every source has finished loading, if no file was found under any branch. */
  onNoFilesFound?: () => void
}

type SourceTreeState = { status: 'loading' } | { status: 'loaded'; node: GitBranchPathNode }

function buildFileTreeItem(
  groupId: string,
  node: GitBranchPathNode,
  lookup: Map<string, RepositoryNavigatorFileItem>,
  expandAll: boolean
): TreeViewDataItem {
  const id = `${groupId}::${node.path}`
  const name = getGitPathBaseName(node.path)
  if (node.type === 'file') {
    lookup.set(id, { id, path: node.path, contents: node.contents })
    return { id, name, icon: <FileIcon aria-hidden /> }
  }
  return {
    id,
    name,
    icon: <FolderIcon aria-hidden />,
    expandedIcon: <FolderOpenIcon aria-hidden />,
    defaultExpanded: expandAll,
    children: sortGitBranchPathNodes(node.children).map((child) =>
      buildFileTreeItem(groupId, child, lookup, expandAll)
    ),
  }
}

function buildSourceTreeItem(
  source: RepositorySource,
  state: SourceTreeState | undefined,
  filterQuery: string,
  lookup: Map<string, RepositoryNavigatorFileItem>,
  expandAll: boolean
): TreeViewDataItem | undefined {
  const groupId = getRepositorySourceGroupId(source)
  const groupTitle = getRepositorySourceGroupTitle(source)
  const groupName = <strong>{groupTitle}</strong>
  const matchesGroupTitle = !filterQuery || groupTitle.toLowerCase().includes(filterQuery)

  if (!state || state.status === 'loading') {
    if (filterQuery && !matchesGroupTitle) {
      return undefined
    }
    return { id: groupId, name: groupName, icon: <Spinner size="sm" aria-hidden /> }
  }

  const rootNode = matchesGroupTitle ? state.node : filterGitBranchPathNode(state.node, filterQuery)
  if (filterQuery && !matchesGroupTitle && !rootNode) {
    return undefined
  }

  if (!rootNode || rootNode.type !== 'tree') {
    if (rootNode?.type === 'file') {
      lookup.set(groupId, { id: groupId, path: rootNode.path, contents: rootNode.contents })
      return { id: groupId, name: groupName, icon: <FileIcon aria-hidden /> }
    }
    return { id: groupId, name: groupName, icon: <FolderIcon aria-hidden />, children: [] }
  }

  return {
    id: groupId,
    name: groupName,
    icon: <FolderIcon aria-hidden />,
    expandedIcon: <FolderOpenIcon aria-hidden />,
    defaultExpanded: true,
    children: sortGitBranchPathNodes(rootNode.children).map((child) =>
      buildFileTreeItem(groupId, child, lookup, expandAll)
    ),
  }
}

function findTreeItemById(items: TreeViewDataItem[], id: string): TreeViewDataItem | undefined {
  for (const item of items) {
    if (item.id === id) {
      return item
    }
    if (item.children) {
      const found = findTreeItemById(item.children, id)
      if (found) {
        return found
      }
    }
  }
  return undefined
}

/** Depth-first search for the first file (as opposed to folder) item in tree order. */
function findFirstFileItem(
  items: TreeViewDataItem[],
  lookup: Map<string, RepositoryNavigatorFileItem>
): RepositoryNavigatorFileItem | undefined {
  for (const item of items) {
    if (item.id && lookup.has(item.id)) {
      return lookup.get(item.id)
    }
    if (item.children) {
      const found = findFirstFileItem(item.children, lookup)
      if (found) {
        return found
      }
    }
  }
  return undefined
}

export const RepositoryNavigator: FC<RepositoryNavigatorProps> = ({ node, selectedItemId, onSelectItem }) => {
  const { t } = useTranslation()
  const { secretsState } = useSharedAtoms()
  const secrets = useSharedValue(secretsState)
  const [searchValue, setSearchValue] = useState('')
  const sources = useMemo(() => buildRepositorySources(node), [node])
  const [treeBySource, setTreeBySource] = useState<Record<string, SourceTreeState>>({})
  const itemLookupRef = useRef<Map<string, RepositoryNavigatorFileItem>>(new Map())

  useEffect(() => {
    let cancelled = false
    setTreeBySource({})
    sources.forEach((source) => {
      const groupId = getRepositorySourceGroupId(source)
      setTreeBySource((prev) => ({ ...prev, [groupId]: { status: 'loading' } }))
      const secretAccess = findRepositorySecretAccess(source.repoURL, secrets)
      getGitBranchPathDetails(
        source.repoURL,
        source.targetRevision,
        source.path,
        secretAccess?.secretArgs,
        secretAccess?.accessData
      ).then((treeNode) => {
        if (!cancelled) {
          setTreeBySource((prev) => ({ ...prev, [groupId]: { status: 'loaded', node: treeNode } }))
        }
      })
    })
    return () => {
      cancelled = true
    }
  }, [sources, secrets])

  // Decide whether to auto-expand every folder only once all sources have finished loading, so the
  // file count used for the threshold check reflects the complete repository tree.
  const allSourcesLoaded = sources.every(
    (source) => treeBySource[getRepositorySourceGroupId(source)]?.status === 'loaded'
  )
  const totalFileCount = useMemo(
    () =>
      sources.reduce((sum, source) => {
        const state = treeBySource[getRepositorySourceGroupId(source)]
        return state?.status === 'loaded' ? sum + countGitBranchPathFiles(state.node) : sum
      }, 0),
    [sources, treeBySource]
  )
  const expandAllFolders = allSourcesLoaded && totalFileCount > 0 && totalFileCount < AUTO_EXPAND_FILE_COUNT_THRESHOLD

  const treeData = useMemo<TreeViewDataItem[]>(() => {
    const lookup = new Map<string, RepositoryNavigatorFileItem>()
    const query = searchValue.trim().toLowerCase()
    const items = sources
      .map((source) =>
        buildSourceTreeItem(source, treeBySource[getRepositorySourceGroupId(source)], query, lookup, expandAllFolders)
      )
      .filter((item): item is TreeViewDataItem => item !== undefined)
    itemLookupRef.current = lookup
    return items
  }, [sources, treeBySource, searchValue, expandAllFolders])

  const hasAutoSelectedRef = useRef(false)

  // Select the first file by default once every source has finished loading.
  useEffect(() => {
    if (hasAutoSelectedRef.current || selectedItemId) {
      return
    }
    const stillLoading = sources.some((source) => {
      const state = treeBySource[getRepositorySourceGroupId(source)]
      return !state || state.status === 'loading'
    })
    if (stillLoading) {
      return
    }
    const firstFile = findFirstFileItem(treeData, itemLookupRef.current)
    if (firstFile) {
      hasAutoSelectedRef.current = true
      onSelectItem(firstFile)
    }
  }, [sources, treeBySource, treeData, selectedItemId, onSelectItem])

  const activeItems = useMemo<TreeViewDataItem[]>(() => {
    if (!selectedItemId) {
      return []
    }
    const found = findTreeItemById(treeData, selectedItemId)
    return found ? [found] : []
  }, [treeData, selectedItemId])

  const handleSelect = useCallback(
    (_event: React.MouseEvent, item: TreeViewDataItem) => {
      if (item.id && itemLookupRef.current.has(item.id)) {
        onSelectItem(itemLookupRef.current.get(item.id)!)
      }
    },
    [onSelectItem]
  )

  return (
    <div className="resource-navigator__container">
      <SearchInput
        placeholder={t('Search')}
        value={searchValue}
        onChange={(_event, value) => setSearchValue(value)}
        onClear={() => setSearchValue('')}
        style={{ marginBottom: 'var(--pf-t--global--spacer--sm)' }}
        aria-label={t('Search')}
      />
      <div className="resource-navigator__scroll">
        <TreeView
          aria-label={t('Repository files')}
          className="resource-navigator"
          data={treeData}
          activeItems={activeItems}
          onSelect={handleSelect}
          hasGuides
          hasSelectableNodes
        />
      </div>
    </div>
  )
}
