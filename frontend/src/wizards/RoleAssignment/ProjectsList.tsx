/* Copyright Contributors to the Open Cluster Management project */
import { useState, useEffect } from 'react'
import { PageSection } from '@patternfly/react-core'
import { RBACProjectsTable, ProjectTableData } from '../../components/RBACProjectsTable'
import { CommonProjectCreate } from './CommonProjectCreate'

export const ProjectsList = () => {
  const [selectedClusters] = useState<string[]>(['local-cluster', 'sno-2-dmn9v']) // TODO: Get from props or context
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

  useEffect(() => {
    console.log('selectedProjects:', selectedProjects)
  }, [selectedProjects])

  return (
    <PageSection>
      {isCreateCommonProject ? (
        <CommonProjectCreate onCancelCallback={handleModalClose} onSuccess={handleCreateSuccess} />
      ) : (
        <RBACProjectsTable
          selectedClusters={selectedClusters}
          onCreateClick={handleCreateClick}
          onSelectionChange={handleSelectionChange}
        />
      )}
    </PageSection>
  )
}
