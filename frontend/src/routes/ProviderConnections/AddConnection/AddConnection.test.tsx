/* Copyright Contributors to the Open Cluster Management project */

import { render, waitFor } from '@testing-library/react'
import React from 'react'
import { MemoryRouter, Route } from 'react-router-dom'
import { AppContext } from '../../../components/AppContext'
import { mockBadRequestStatus, nockClusterList, nockCreate, nockGet } from '../../../lib/nock-util'
import { NavigationPath } from '../../../NavigationPath'
import { FeatureGate } from '../../../resources/feature-gate'
import { Project, ProjectApiVersion, ProjectKind } from '../../../resources/project'
import { SelfSubjectAccessReview } from '../../../resources/self-subject-access-review'
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

const mockSelfSubjectAccessRequest: SelfSubjectAccessReview = {
    apiVersion: 'authorization.k8s.io/v1',
    kind: 'SelfSubjectAccessReview',
    metadata: {},
    spec: {
        resourceAttributes: {
            namespace: 'test-namespace',
            resource: 'secrets',
            verb: 'create',
            group: '',
        },
    },
}

const mockSelfSubjectAccessRequestAdmin: SelfSubjectAccessReview = {
    apiVersion: 'authorization.k8s.io/v1',
    kind: 'SelfSubjectAccessReview',
    metadata: {},
    spec: {
        resourceAttributes: {
            name: '*',
            namespace: '*',
            resource: '*',
            verb: '*',
        },
    },
}

const mockSelfSubjectAccessResponseTrue: SelfSubjectAccessReview = {
    apiVersion: 'authorization.k8s.io/v1',
    kind: 'SelfSubjectAccessReview',
    metadata: {},
    spec: {
        resourceAttributes: {
            namespace: 'test-namespace',
            resource: 'secrets',
            verb: 'create',
            version: 'v1',
        },
    },
    status: {
        allowed: true,
    },
}

const mockSelfSubjectAccessResponseFalse: SelfSubjectAccessReview = {
    apiVersion: 'authorization.k8s.io/v1',
    kind: 'SelfSubjectAccessReview',
    metadata: {},
    spec: {
        resourceAttributes: {
            namespace: 'test-namespace',
            resource: 'secrets',
            verb: 'create',
            version: 'v1',
        },
    },
    status: {
        allowed: false,
    },
}
const mockSelfSubjectAccessResponseNonAdmin: SelfSubjectAccessReview = {
    apiVersion: 'authorization.k8s.io/v1',
    kind: 'SelfSubjectAccessReview',
    metadata: {},
    spec: {
        resourceAttributes: {
            name: '*',
            namespace: '*',
            resource: '*',
            verb: '*',
        },
    },
    status: {
        allowed: false,
    },
}
const mockSelfSubjectAccessResponseAdmin: SelfSubjectAccessReview = {
    apiVersion: 'authorization.k8s.io/v1',
    kind: 'SelfSubjectAccessReview',
    metadata: {},
    spec: {
        resourceAttributes: {
            name: '*',
            namespace: '*',
            resource: '*',
            verb: '*',
        },
    },
    status: {
        allowed: true,
    },
}

function TestAddConnectionPage() {
    return (
        <AppContext.Provider
            value={{
                featureGates: { 'open-cluster-management-discovery': mockFeatureGate },
                clusterManagementAddons: [],
            }}
        >
            <MemoryRouter>
                <Route
                    render={(props: any) => {
                        return <AddConnectionPage {...props} />
                    }}
                />
            </MemoryRouter>
        </AppContext.Provider>
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
        await waitFor(() => expect(getByText('common:retry')).toBeInTheDocument())

        // const projectsNock2 = nockClusterList(mockProject, [Project])
        // getByText('Retry').click()
        // await waitFor(() => expect(projectsNock2.isDone()).toBeTruthy())
    })

    it('should show empty page if there are no projects', async () => {
        const projectsNock = nockClusterList(mockProject, [])
        const { getAllByText } = render(
            <MemoryRouter initialEntries={[NavigationPath.addConnection]}>
                <Route
                    path={NavigationPath.addConnection}
                    component={(props: any) => <AddConnectionPage {...props} />}
                />
            </MemoryRouter>
        )
        await waitFor(() => expect(projectsNock.isDone()).toBeTruthy())
        await waitFor(() => expect(getAllByText('common:rbac.title.unauthorized')[0]).toBeInTheDocument())
    })

    it('should load empty page with restriction message when user cannot create secret in any namespace', async () => {
        const projectsNock = nockClusterList(mockProject, [mockProject])
        const rbacNock = nockCreate(mockSelfSubjectAccessRequestAdmin, mockSelfSubjectAccessResponseNonAdmin)
        const rbacNockii = nockCreate(mockSelfSubjectAccessRequest, mockSelfSubjectAccessResponseFalse)
        const { getByText } = render(
            <MemoryRouter initialEntries={[NavigationPath.addConnection]}>
                <Route
                    path={NavigationPath.addConnection}
                    component={(props: any) => <AddConnectionPage {...props} />}
                />
            </MemoryRouter>
        )

        await waitFor(() => expect(projectsNock.isDone()).toBeTruthy())
        await waitFor(() => expect(rbacNock.isDone()).toBeTruthy())
        await waitFor(() => expect(rbacNockii.isDone()).toBeTruthy())
        await waitFor(() => expect(getByText('common:rbac.namespaces.unauthorized')).toBeInTheDocument())
    })
    it('should load page and namespace when admin', async () => {
        const projectsNock = nockClusterList(mockProject, [mockProject])
        const rbacNock = nockCreate(mockSelfSubjectAccessRequestAdmin, mockSelfSubjectAccessResponseAdmin)
        const { getByText, container } = render(
            <MemoryRouter initialEntries={[NavigationPath.addConnection]}>
                <Route
                    path={NavigationPath.addConnection}
                    component={(props: any) => <AddConnectionPage {...props} />}
                />
            </MemoryRouter>
        )

        await waitFor(() => expect(projectsNock.isDone()).toBeTruthy())
        await waitFor(() => expect(rbacNock.isDone()).toBeTruthy())
        await waitFor(() => expect(getByText('addConnection.providerName.label')).toBeInTheDocument())
        container.querySelector<HTMLButtonElement>(`[aria-labelledby^="namespaceName-label"]`)!.click()
        await waitFor(() => expect(getByText(mockProject.metadata.name!)).toBeInTheDocument())
    })
    it('should load page and namespace for non-admin', async () => {
        const projectsNock = nockClusterList(mockProject, [mockProject])
        nockCreate(mockSelfSubjectAccessRequestAdmin, mockSelfSubjectAccessResponseNonAdmin)
        const rbacNock = nockCreate(mockSelfSubjectAccessRequest, mockSelfSubjectAccessResponseTrue)
        const { getByText, container } = render(
            <MemoryRouter initialEntries={[NavigationPath.addConnection]}>
                <Route
                    path={NavigationPath.addConnection}
                    component={(props: any) => <AddConnectionPage {...props} />}
                />
            </MemoryRouter>
        )

        await waitFor(() => expect(projectsNock.isDone()).toBeTruthy())
        await waitFor(() => expect(rbacNock.isDone()).toBeTruthy())
        await waitFor(() => expect(getByText('addConnection.providerName.label')).toBeInTheDocument())
        container.querySelector<HTMLButtonElement>(`[aria-labelledby^="namespaceName-label"]`)!.click()
        await waitFor(() => expect(getByText(mockProject.metadata.name!)).toBeInTheDocument())
    })
})
