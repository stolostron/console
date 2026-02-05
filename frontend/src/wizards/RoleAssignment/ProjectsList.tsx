/* Copyright Contributors to the Open Cluster Management project */
import { ButtonVariant, PageSection } from '@patternfly/react-core'
import { useEffect, useMemo, useState } from 'react'
import { ProjectsTable, ProjectTableData } from '../../components/ProjectsTable'
import { useTranslation } from '../../lib/acm-i18next'
import type { Cluster } from '../../routes/UserManagement/RoleAssignments/hook/RoleAssignmentDataHook'
import { IAcmTableButtonAction } from '../../ui-components/AcmTable/AcmTableTypes'
import { CommonProjectCreate } from './CommonProjectCreate'

interface ProjectsListProps {
  selectedClusters: Cluster[]
  selectedNamespaces?: string[]
  onSelectionChange: (namespaces: string[]) => void
}

export const ProjectsList = ({ selectedClusters, selectedNamespaces, onSelectionChange }: ProjectsListProps) => {
  const { t } = useTranslation()
  const [isCreateCommonProject, setIsCreateCommonProject] = useState(false)
  // this is used to display the created projects in the projects table to avoid discrepancies between search results and the already created projects
  const [createdProjects, setCreatedProjects] = useState<string[]>([])
  const [isSelectedClustersEmpty, setIsSelectedClustersEmpty] = useState<boolean>()

  useEffect(() => setIsSelectedClustersEmpty(selectedClusters.length === 0), [selectedClusters])

  const selectedProjects = useMemo(
    () =>
      selectedNamespaces?.map((ns: string) => ({
        name: ns,
        type: 'Namespace',
        clusters: selectedClusters.map((c) => c.name),
      })) ?? [],
    [selectedNamespaces, selectedClusters]
  )

  const hasSelectedProjects = useMemo(() => selectedProjects.length > 0, [selectedProjects.length])

  const handleCreateClick = () => setIsCreateCommonProject(true)

  const handleModalClose = () => setIsCreateCommonProject(false)

  const handleCreateSuccess = (newProjectName: string) => {
    setIsCreateCommonProject(false)
    setCreatedProjects([...createdProjects, newProjectName])
    onSelectionChange([...selectedProjects.map((p) => p.name), newProjectName])
  }

  const handleSelectionChange = (projects: ProjectTableData[]) => {
    onSelectionChange(projects.map((p) => p.name))
  }

  const createProjectTooltipText = useMemo(() => {
    switch (true) {
      case hasSelectedProjects:
        return t('Deselect projects to create a new common project')
      case isSelectedClustersEmpty:
        return t('No clusters selection to create projects for')
      default:
        return undefined
    }
  }, [t, hasSelectedProjects, isSelectedClustersEmpty])

  const tableActionButtons = useMemo<IAcmTableButtonAction[]>(
    () => [
      {
        id: 'create-project',
        title: t('Create common project'),
        click: handleCreateClick,
        variant: ButtonVariant.primary,
        isDisabled: hasSelectedProjects || isSelectedClustersEmpty,
        tooltip: createProjectTooltipText,
      },
    ],
    [t, hasSelectedProjects, isSelectedClustersEmpty, createProjectTooltipText]
  )
  return (
    <PageSection>
      {isCreateCommonProject ? (
        <CommonProjectCreate
          onCancelCallback={handleModalClose}
          onSuccess={handleCreateSuccess}
          selectedClusters={selectedClusters}
        />
      ) : (
        <ProjectsTable
          key={selectedClusters.map((c) => c.name).join(',')}
          selectedClusters={selectedClusters}
          selectedProjects={selectedProjects}
          onCreateClick={handleCreateClick}
          onSelectionChange={handleSelectionChange}
          tableActionButtons={tableActionButtons}
          additionalProjects={createdProjects}
          createButtonDisabledReason={createProjectTooltipText}
        />
      )}
    </PageSection>
  )
}
