/* Copyright Contributors to the Open Cluster Management project */
import { Label, LabelGroup } from '@patternfly/react-core'
import { useCallback, useMemo } from 'react'
import { generatePath, Link } from 'react-router-dom-v5-compat'
import { useTranslation } from '../lib/acm-i18next'
import { NavigationPath } from '../NavigationPath'
import type { Cluster } from '../routes/UserManagement/RoleAssignments/hook/RoleAssignmentDataHook'
import { useRoleAssignmentData } from '../routes/UserManagement/RoleAssignments/hook/RoleAssignmentDataHook'
import { AcmTable, IAcmTableColumn } from '../ui-components'
import { IAcmTableButtonAction, ITableFilter } from '../ui-components/AcmTable/AcmTableTypes'
import { isClusterInClusters } from '../wizards/RoleAssignment/utils'
import { CommonProjectsEmptyState } from './project/CommonProjectsEmptyState'

export interface ProjectTableData {
  name: string
  type: string
  clusters: string[]
  displayName?: string
  description?: string
}

interface ProjectsTableProps {
  selectedClusters: Cluster[]
  projects?: ProjectTableData[]
  selectedProjects?: ProjectTableData[]
  onSelectionChange?: (selectedProjects: ProjectTableData[]) => void
  onCreateClick?: () => void
  areLinksDisplayed?: boolean
  useRoleAssignmentDataHook?: typeof useRoleAssignmentData
  tableActionButtons?: IAcmTableButtonAction[]
  additionalProjects?: string[]
  createButtonDisabledReason?: string
}

export const ProjectsTable = ({
  selectedClusters,
  projects,
  selectedProjects,
  onSelectionChange,
  onCreateClick,
  areLinksDisplayed = true,
  useRoleAssignmentDataHook = useRoleAssignmentData,
  tableActionButtons,
  additionalProjects,
  createButtonDisabledReason,
}: ProjectsTableProps) => {
  const { t } = useTranslation()

  const { roleAssignmentData, isLoading: isRoleAssignmentDataLoading } = useRoleAssignmentDataHook()

  const clusters = useMemo(
    () => roleAssignmentData.clusterSets?.flatMap((cs) => cs.clusters || []) || [],
    [roleAssignmentData.clusterSets]
  )

  const projectsData: ProjectTableData[] = useMemo(() => {
    if (projects) {
      return projects
    }

    if (selectedClusters.length === 0) {
      return []
    }

    const clusterNamespaceGroupings: string[][] = clusters
      .filter((cluster) => isClusterInClusters(selectedClusters, cluster))
      .map((cluster) => (cluster.namespaces ? [...cluster.namespaces] : []))

    if (clusterNamespaceGroupings.length === 0) {
      return []
    }

    const commonNamespaces: string[] = [
      ...new Set([
        ...(additionalProjects || []),
        ...clusterNamespaceGroupings.reduce(
          (acc, namespaces) => acc.filter((ns) => namespaces.includes(ns)),
          clusterNamespaceGroupings[0] || []
        ),
      ]),
    ].sort((a, b) => a.localeCompare(b))

    return commonNamespaces.map((ns) => ({
      name: ns,
      type: 'Namespace',
      clusters: selectedClusters.map((cluster) => cluster.name),
    }))
  }, [projects, selectedClusters, clusters, additionalProjects])

  const filters = useMemo<ITableFilter<ProjectTableData>[]>(() => {
    const allFilters: ITableFilter<ProjectTableData>[] = [
      {
        id: 'type',
        label: t('Type'),
        tableFilterFn: (selectedValues, project) => selectedValues.includes(project.type),
        options: [
          {
            label: 'Namespace',
            value: 'Namespace',
          },
        ],
      },
      {
        id: 'clusters',
        label: t('Clusters'),
        tableFilterFn: (selectedValues, project) =>
          project.clusters.some((cluster) => selectedValues.includes(cluster)),
        options: Array.from(new Set(projectsData.flatMap((project) => project.clusters))).map((cluster) => ({
          label: cluster,
          value: cluster,
        })),
      },
    ]

    return allFilters
  }, [t, projectsData])

  const renderTypeCell = useCallback(
    (project: ProjectTableData) => (
      <Label isCompact color="blue">
        {project.type}
      </Label>
    ),
    []
  )

  const renderClusterLabel = useCallback(
    (cluster: string) => {
      const content = areLinksDisplayed ? (
        <Link
          to={generatePath(NavigationPath.clusterOverview, {
            namespace: cluster,
            name: cluster,
          })}
          style={{ textDecoration: 'none' }}
        >
          {cluster}
        </Link>
      ) : (
        cluster
      )

      return (
        <Label key={cluster} isCompact color="grey">
          {content}
        </Label>
      )
    },
    [areLinksDisplayed]
  )

  const renderClustersCell = useCallback(
    (project: ProjectTableData) => (
      <LabelGroup numLabels={2} isCompact>
        {project.clusters.map(renderClusterLabel)}
      </LabelGroup>
    ),
    [renderClusterLabel]
  )

  const columns: IAcmTableColumn<ProjectTableData>[] = [
    {
      header: t('Name'),
      sort: 'name',
      search: 'name',
      cell: (project) => project.name,
    },
    {
      header: t('Type'),
      sort: 'type',
      search: 'type',
      cell: renderTypeCell,
    },
    {
      header: t('Clusters'),
      cell: renderClustersCell,
    },
  ]

  const handleSelect = useCallback((projects: ProjectTableData[]) => onSelectionChange?.(projects), [onSelectionChange])

  return (
    <AcmTable<ProjectTableData>
      items={isRoleAssignmentDataLoading ? undefined : projectsData}
      columns={columns}
      keyFn={(project) => `${project.name}-${project.clusters.join(',')}`}
      initialSelectedItems={selectedProjects}
      tableActionButtons={tableActionButtons?.length ? tableActionButtons : undefined}
      onSelect={handleSelect}
      filters={filters}
      searchPlaceholder={t('Search projects')}
      emptyState={
        onCreateClick ? (
          <CommonProjectsEmptyState
            onCreateCommonProject={onCreateClick}
            createButtonDisabledReason={createButtonDisabledReason}
          />
        ) : null
      }
    />
  )
}
