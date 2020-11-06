import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { Project, projectMethods } from '../../../lib/Project'
import { AddConnectionPage } from './AddConnection'
import { nockClusterList } from '../../../lib/nock-util'
import { getResourceNamePath, getResourcePath } from '../../../library/utils/resource-methods'
import { secretMethods } from '../../../lib/Secret'
import { join } from 'path'
import {
    ClusterDeploymentApiVersion,
    ClusterDeploymentKind,
    clusterDeploymentMethods,
} from '../../../library/resources/cluster-deployment'

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
