import { render, waitFor } from '@testing-library/react'
import React from 'react'
import { nockClusterList } from '../../../lib/nock-util'
import { Project, projectMethods } from '../../../library/resources/project'
import { AddConnectionPage } from './AddConnection'

const mockProjects: Project[] = [
    {
        apiVersion: 'project.openshift.io/v1',
        kind: 'Project',
        metadata: {
            name: 'default',
        },
    },
]

describe('add connection page', () => {
    test('should load and get projects', async () => {
        const projectsNock = nockClusterList(projectMethods, mockProjects)
        render(<AddConnectionPage />)
        await waitFor(() => expect(projectsNock.isDone()).toBeTruthy())
    })
})
