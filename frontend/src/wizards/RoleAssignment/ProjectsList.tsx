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
  onSelectedProjects: (projectNames: string[]) => void
}

export const ProjectsList = ({ selectedClusters, onSelectedProjects }: ProjectsListProps) => {
  const { t } = useTranslation()
  const [isCreateCommonProject, setIsCreateCommonProject] = useState(false)
  const [selectedProjects, setSelectedProjects] = useState<ProjectTableData[]>()
  const [hasSelectedProjects, setHasSelectedProjects] = useState<boolean>()

  useEffect(
    () => setHasSelectedProjects(selectedProjects !== undefined && selectedProjects.length > 0),
    [selectedProjects, selectedProjects?.length]
  )

  const handleCreateClick = () => setIsCreateCommonProject(true)
  const handleModalClose = () => setIsCreateCommonProject(false)
  const handleCreateSuccess = () => setIsCreateCommonProject(false)
  const handleSelectionChange = (projects: ProjectTableData[]) => {
    setSelectedProjects(projects)
    onSelectedProjects(projects.map((e) => e.name))
  }

  const tableActionButtons = useMemo<IAcmTableButtonAction[]>(
    () => [
      {
        id: 'create-project',
        title: t('Create common project'),
        click: handleCreateClick,
        variant: ButtonVariant.primary,
        isDisabled: hasSelectedProjects,
        tooltip: hasSelectedProjects ? t('Deselect projects to create a new common project') : undefined,
      },
    ],
    [t, hasSelectedProjects]
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
          selectedClusters={selectedClusters}
          selectedProjects={selectedProjects}
          onCreateClick={handleCreateClick}
          onSelectionChange={handleSelectionChange}
          tableActionButtons={tableActionButtons}
        />
      )}
    </PageSection>
  )
}
