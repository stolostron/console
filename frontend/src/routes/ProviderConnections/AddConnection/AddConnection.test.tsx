import { render, waitFor } from '@testing-library/react'
import React from 'react'
import { MemoryRouter, Route } from 'react-router-dom'
import { mockBadRequestStatus, nockClusterList, nockGet } from '../../../lib/nock-util'
import { NavigationPath } from '../../../NavigationPath'
import { FeatureGate } from '../../../resources/feature-gate'
import { Project, ProjectApiVersion, ProjectKind } from '../../../resources/project'
import AddConnectionPage from './AddConnection'

const mockProject: Project = {
    apiVersion: ProjectApiVersion,
    kind: ProjectKind,
    metadata: { name: 'test-namespace' },
}

const mockFeatureGate: FeatureGate = {
    apiVersion: 'config.openshift.io/v1',
    kind: 'FeatureGate',
    metadata: { name: 'open-cluster-management-discovery' },
    spec: { featureSet: 'DiscoveryEnabled' },
}

function TestAddConnectionPage() {
    return (
        <MemoryRouter>
            <Route
                render={(props: any) => {
                    return <AddConnectionPage {...props} />
                }}
            />
        </MemoryRouter>
    )
}

beforeEach(() => {
    sessionStorage.clear()
    nockGet(mockFeatureGate, undefined, 200, true)
})

describe('add connection page', () => {
    it('should show error if get project error', async () => {
        const projectsNock = nockClusterList(mockProject, mockBadRequestStatus)
        const { getByText } = render(<TestAddConnectionPage />)
        await waitFor(() => expect(projectsNock.isDone()).toBeTruthy())
        await waitFor(() => expect(getByText('Bad request')).toBeInTheDocument())
        await waitFor(() => expect(getByText('Retry')).toBeInTheDocument())

        const projectsNock2 = nockClusterList(mockProject, [])
        getByText('Retry').click()
        await waitFor(() => expect(projectsNock2.isDone()).toBeTruthy())
    })

    it('should show empty page if there are no projects', async () => {
        const projectsNock = nockClusterList(mockProject, [])
        const { getByText, getAllByText } = render(
            <MemoryRouter initialEntries={[NavigationPath.addConnection]}>
                <Route
                    path={NavigationPath.addConnection}
                    component={(props: any) => <AddConnectionPage {...props} />}
                />
            </MemoryRouter>
        )
        await waitFor(() => expect(projectsNock.isDone()).toBeTruthy())
        await waitFor(() => expect(getAllByText('addConnection.error.noNamespacesFound')[0]).toBeInTheDocument())
        await waitFor(() => expect(getByText('Retry')).toBeInTheDocument())

        const projectsNock2 = nockClusterList(mockProject, [])
        getByText('Retry').click()
        await waitFor(() => expect(projectsNock2.isDone()).toBeTruthy())
    })
})
