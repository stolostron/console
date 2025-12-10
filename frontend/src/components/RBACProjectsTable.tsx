/* Copyright Contributors to the Open Cluster Management project */
import { ButtonVariant, Label, LabelGroup } from '@patternfly/react-core'
import { useCallback, useMemo, useState } from 'react'
import { generatePath, Link } from 'react-router-dom-v5-compat'
import { useTranslation } from '../lib/acm-i18next'
import { NavigationPath } from '../NavigationPath'
import { useRoleAssignmentData } from '../routes/UserManagement/RoleAssignments/hook/RoleAssignmentDataHook'
import { AcmButton, AcmEmptyState, AcmTable, IAcmTableColumn } from '../ui-components'
import { IAcmTableButtonAction, ITableFilter } from '../ui-components/AcmTable/AcmTableTypes'
import { isClusterInClusters } from '../wizards/RoleAssignment/utils'

export interface ProjectTableData {
  name: string
  type: string
  clusters: string[]
  displayName?: string
  description?: string
}

interface ProjectsTableProps {
  selectedClusters: string[]
  projects?: ProjectTableData[]
  onSelectionChange?: (selectedProjects: ProjectTableData[]) => void
  onCreateClick?: () => void
  areLinksDisplayed?: boolean
}

export function RBACProjectsTable({
  selectedClusters,
  projects,
  onSelectionChange,
  onCreateClick,
  areLinksDisplayed = true,
}: ProjectsTableProps) {
  const { t } = useTranslation()
  const [hasSelectedProjects, setHasSelectedProjects] = useState(false)

  const { roleAssignmentData, isLoading: isRoleAssignmentDataLoading } = useRoleAssignmentData()

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

    const commonNamespaces: string[] = clusterNamespaceGroupings
      .reduce((acc, namespaces) => acc.filter((ns) => namespaces.includes(ns)))
      .sort((a, b) => a.localeCompare(b))

    return commonNamespaces.map((ns) => ({
      name: ns,
      type: 'Namespace',
      clusters: selectedClusters,
    }))
  }, [projects, selectedClusters, clusters])

  const tableActionButtons = useMemo<IAcmTableButtonAction[]>(
    () =>
      !onCreateClick
        ? []
        : [
            {
              id: 'create-project',
              title: t('Create common project'),
              click: onCreateClick,
              variant: ButtonVariant.primary,
              isDisabled: hasSelectedProjects,
              tooltip: hasSelectedProjects ? t('Deselect projects to create a new common project') : undefined,
            },
          ],
    [t, onCreateClick, hasSelectedProjects]
  )

  const filters = useMemo<ITableFilter<ProjectTableData>[]>(() => {
    const allFilters: ITableFilter<ProjectTableData>[] = [
      {
        id: 'name',
        label: t('Name'),
        tableFilterFn: (selectedValues, project) => selectedValues.includes(project.name),
        options: projectsData.map((project) => ({
          label: project.name,
          value: project.name,
        })),
      },
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
      cell: (project) => (
        <Label isCompact color="blue">
          {project.type}
        </Label>
      ),
    },
    {
      header: t('Clusters'),
      cell: (project) => (
        <LabelGroup numLabels={2}>
          {project.clusters.map((cluster) => (
            <Label key={cluster} isCompact color="grey">
              {areLinksDisplayed ? (
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
              )}
            </Label>
          ))}
        </LabelGroup>
      ),
    },
  ]

  const handleSelect = useCallback(
    (projects: ProjectTableData[]) => {
      setHasSelectedProjects(projects.length > 0)
      onSelectionChange?.(projects)
    },
    [onSelectionChange]
  )

  return (
    <AcmTable<ProjectTableData>
      items={isRoleAssignmentDataLoading ? undefined : projectsData}
      columns={columns}
      keyFn={(project) => `${project.name}-${project.clusters.join(',')}`}
      tableActionButtons={tableActionButtons.length ? tableActionButtons : undefined}
      onSelect={handleSelect}
      filters={filters}
      searchPlaceholder={t('Search projects')}
      autoHidePagination
      emptyState={
        <AcmEmptyState
          key="projectsEmptyState"
          title={t('No common projects found')}
          message={t('Go back and select different clusters, or create projects with the same name on these clusters.')}
          action={
            onCreateClick ? (
              <AcmButton variant="primary" onClick={onCreateClick}>
                {t('Create common project')}
              </AcmButton>
            ) : null
          }
        />
      }
    />
  )
}
