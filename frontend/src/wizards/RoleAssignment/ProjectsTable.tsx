/* Copyright Contributors to the Open Cluster Management project */

import { useMemo, useState, useCallback, useEffect } from 'react'
import { ButtonVariant, Label, LabelGroup } from '@patternfly/react-core'
import { generatePath, Link } from 'react-router-dom-v5-compat'
import { useTranslation } from '../../lib/acm-i18next'
import { NavigationPath } from '../../NavigationPath'
import { AcmEmptyState, AcmTable, IAcmTableColumn, AcmButton } from '../../ui-components'
import { IAcmTableButtonAction, ITableFilter } from '../../ui-components/AcmTable/AcmTableTypes'
import { useRoleAssignmentData } from '../../routes/UserManagement/RoleAssignments/hook/RoleAssignmentDataHook'

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
  onRefresh?: (refetchFn: () => void) => void
  isLoading?: boolean
}

export function ProjectsTable({
  selectedClusters,
  projects: projectsProp,
  onSelectionChange,
  onCreateClick,
  onRefresh,
  isLoading: isLoadingProp,
}: ProjectsTableProps) {
  const { t } = useTranslation()
  const [hasSelectedProjects, setHasSelectedProjects] = useState(false)

  const { roleAssignmentData, isLoading: isRoleAssignmentDataLoading, refetchNamespaces } = useRoleAssignmentData()

  const clusters = useMemo(
    () => roleAssignmentData.clusterSets?.flatMap((cs) => cs.clusters || []) || [],
    [roleAssignmentData.clusterSets]
  )

  const projectsData: ProjectTableData[] = useMemo(() => {
    if (projectsProp) {
      return projectsProp
    }

    if (selectedClusters.length === 0) {
      return []
    }

    const clusterNamespaceGroupings: string[][] = []

    for (const cluster of clusters) {
      const isMatch = selectedClusters.some((selectedCluster) => {
        const selectedStr = selectedCluster?.toString().trim()
        const clusterStr = cluster.name?.toString().trim()
        return selectedStr === clusterStr
      })

      if (isMatch) {
        clusterNamespaceGroupings.push(cluster.namespaces ? [...cluster.namespaces] : [])
      }
    }

    if (clusterNamespaceGroupings.length === 0) {
      return []
    }

    let commonNamespaces: string[] = clusterNamespaceGroupings[0] || []

    for (let i = 1; i < clusterNamespaceGroupings.length; i++) {
      commonNamespaces = commonNamespaces.filter((namespace) => clusterNamespaceGroupings[i].includes(namespace))
    }

    const transformed = commonNamespaces
      .sort((a, b) => a.localeCompare(b))
      .map((ns) => ({
        name: ns,
        type: 'Namespace',
        clusters: selectedClusters,
      }))

    return transformed
  }, [projectsProp, selectedClusters, clusters])

  const isLoading = isLoadingProp ?? isRoleAssignmentDataLoading

  useEffect(() => {
    if (onRefresh && refetchNamespaces) {
      onRefresh(refetchNamespaces)
    }
  }, [onRefresh, refetchNamespaces])

  const tableActionButtons = useMemo<IAcmTableButtonAction[]>(() => {
    if (!onCreateClick) {
      return []
    }

    return [
      {
        id: 'create-project',
        title: t('Create common project'),
        click: onCreateClick,
        variant: ButtonVariant.primary,
        isDisabled: hasSelectedProjects,
        tooltip: hasSelectedProjects ? t('Deselect projects to create a new common project') : undefined,
      },
    ]
  }, [t, onCreateClick, hasSelectedProjects])

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
      cell: (project) => {
        return (
          <LabelGroup numLabels={2}>
            {project.clusters.map((cluster) => (
              <Label key={cluster} isCompact color="grey">
                <Link
                  to={generatePath(NavigationPath.clusterOverview, {
                    namespace: cluster,
                    name: cluster,
                  })}
                  style={{ textDecoration: 'none' }}
                >
                  {cluster}
                </Link>
              </Label>
            ))}
          </LabelGroup>
        )
      },
    },
  ]

  const handleSelect = useCallback(
    (projects: ProjectTableData[]) => {
      setHasSelectedProjects(projects.length > 0)
      if (onSelectionChange) {
        onSelectionChange(projects)
      }
    },
    [onSelectionChange]
  )

  return (
    <AcmTable<ProjectTableData>
      items={isLoading ? undefined : projectsData}
      columns={columns}
      keyFn={(project) => `${project.name}-${project.clusters.join(',')}`}
      tableActionButtons={tableActionButtons.length > 0 ? tableActionButtons : undefined}
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
            ) : undefined
          }
        />
      }
    />
  )
}
