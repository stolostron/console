/* Copyright Contributors to the Open Cluster Management project */

import { useState } from 'react'
import { PageSection } from '@patternfly/react-core'
import { ProjectsTable, ProjectTableData } from './ProjectsTable'

export function ProjectsList() {
  const [selectedClusters] = useState<string[]>(['local-cluster']) // TODO: Get from props or context
  // const [selectedClusters] = useState<string[]>(['local-cluster', 'sno-2-lpwmd']) // TODO: Get from props or context
  const [selectedProjects, setSelectedProjects] = useState<ProjectTableData[]>([])

  const handleSelectionChange = (projects: ProjectTableData[]) => {
    setSelectedProjects(projects)
    console.log('Selected projects:', projects)
  }

  const handleCreateClick = () => {
    console.log('Create project clicked with selected projects:', selectedProjects)
  }

  return (
    <PageSection>
      <ProjectsTable
        selectedClusters={selectedClusters}
        onSelectionChange={handleSelectionChange}
        onCreateClick={handleCreateClick}
      />
    </PageSection>
  )
}
