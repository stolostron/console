/* Copyright Contributors to the Open Cluster Management project */
import { ButtonVariant, PageSection } from '@patternfly/react-core'
import { useMemo, useState } from 'react'
import { ProjectsTable, ProjectTableData } from '../../components/ProjectsTable'
import { useTranslation } from '../../lib/acm-i18next'
import type { Cluster } from '../../routes/UserManagement/RoleAssignments/hook/RoleAssignmentDataHook'
import { IAcmTableButtonAction } from '../../ui-components/AcmTable/AcmTableTypes'
import { CommonProjectCreate } from './CommonProjectCreate'
import { useItem } from '@patternfly-labs/react-form-wizard/lib/src/contexts/ItemContext'
import { useData } from '@patternfly-labs/react-form-wizard/lib/src/contexts/DataContext'
import { RoleAssignmentWizardFormData } from './types'

interface ProjectsListProps {
  selectedClusters: Cluster[]
}

export const ProjectsList = ({ selectedClusters }: ProjectsListProps) => {
  const { t } = useTranslation()
  const formData = useItem() as RoleAssignmentWizardFormData
  const { update } = useData()
  const [isCreateCommonProject, setIsCreateCommonProject] = useState(false)

  const selectedProjects = useMemo(
    () =>
      formData.scope.namespaces?.map((ns: string) => ({
        name: ns,
        type: 'Namespace',
        clusters: selectedClusters.map((c) => c.name),
      })) ?? [],
    [formData?.scope?.namespaces, selectedClusters]
  )

  const hasSelectedProjects = useMemo(() => selectedProjects.length > 0, [selectedProjects.length])

  const handleCreateClick = () => setIsCreateCommonProject(true)

  const handleModalClose = () => setIsCreateCommonProject(false)

  const handleCreateSuccess = () => setIsCreateCommonProject(false)

  const handleSelectionChange = (projects: ProjectTableData[]) => {
    update((formData: RoleAssignmentWizardFormData) => {
      formData.scope.namespaces = projects.map((p) => p.name)
    })
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
          key={selectedClusters.map((c) => c.name).join(',')}
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
