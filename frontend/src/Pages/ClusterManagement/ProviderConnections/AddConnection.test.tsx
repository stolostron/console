import { render, waitFor } from '@testing-library/react'
import React from 'react'
import { nockClusterList } from '../../../lib/nock-util'
import { Project } from '../../../library/resources/project'
import { AddConnectionPage } from './AddConnection'

const mockProject: Project = {
    apiVersion: 'project.openshift.io/v1',
    kind: 'Project',
    metadata: { name: 'mock-project' },
}

const mockProjects: Project[] = [mockProject]

describe('add connection page', () => {
    test('should load and get projects', async () => {
        const projectsNock = nockClusterList(mockProject, mockProjects)
        render(<AddConnectionPage />)
        await waitFor(() => expect(projectsNock.isDone()).toBeTruthy(), { timeout: 4000 })
    })
})
