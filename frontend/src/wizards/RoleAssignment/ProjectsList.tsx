/* Copyright Contributors to the Open Cluster Management project */

import { useState } from 'react'
import { PageSection } from '@patternfly/react-core'
import { ProjectsTable, ProjectTableData } from './ProjectsTable'
import { CommonProjectCreate } from './CommonProjectCreate'

export function ProjectsList() {
  const [selectedClusters] = useState<string[]>(['local-cluster']) // TODO: Get from props or context
  const [isCreateCommonProject, setIsCreateCommonProject] = useState(false)
  const [selectedProjects, setSelectedProjects] = useState<ProjectTableData[]>([])

  const handleCreateClick = () => {
    setIsCreateCommonProject(true)
  }

  const handleModalClose = () => {
    setIsCreateCommonProject(false)
  }

  const handleCreateSuccess = () => {
    setIsCreateCommonProject(false)
  }

  const handleSelectionChange = (projects: ProjectTableData[]) => {
    setSelectedProjects(projects)
  }
  return (
    <PageSection>
      {isCreateCommonProject ? (
        <CommonProjectCreate onCancelCallback={handleModalClose} onSuccess={handleCreateSuccess} />
      ) : (
        <ProjectsTable
          selectedClusters={selectedClusters}
          onCreateClick={handleCreateClick}
          onSelectionChange={handleSelectionChange}
        />
      )}
    </PageSection>
  )
}
