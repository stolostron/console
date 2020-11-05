import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { Project, projectMethods } from '../../../lib/Project'
import { AddConnectionPage } from './AddConnection'
import { nockClusterList } from '../../../lib/nock-util'

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
