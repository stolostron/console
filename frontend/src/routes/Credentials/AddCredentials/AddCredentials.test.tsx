/* Copyright Contributors to the Open Cluster Management project */

import { render, waitFor } from '@testing-library/react'
import React from 'react'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { nockCreate } from '../../../lib/nock-util'
import { NavigationPath } from '../../../NavigationPath'
import { Namespace, NamespaceApiVersion, NamespaceKind } from '../../../resources/namespace'
import { SelfSubjectAccessReview } from '../../../resources/self-subject-access-review'
import AddCredentialPage from './AddCredentials'
import { namespacesState } from '../../../atoms'

const mockNamespace: Namespace = {
    apiVersion: NamespaceApiVersion,
    kind: NamespaceKind,
    metadata: { name: 'test-namespace' },
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

describe('add connection page', () => {
    it('should show empty page if there are no projects', async () => {
        const { getAllByText } = render(
            <RecoilRoot
                initializeState={(snapshot) => {
                    snapshot.set(namespacesState, [])
                }}
            >
                <MemoryRouter initialEntries={[NavigationPath.addCredentials]}>
                    <Route
                        path={NavigationPath.addCredentials}
                        component={(props: any) => <AddCredentialPage {...props} />}
                    />
                </MemoryRouter>
            </RecoilRoot>
        )
        await waitFor(() => expect(getAllByText('common:rbac.title.unauthorized')[0]).toBeInTheDocument())
    })

    it('should load empty page with restriction message when user cannot create secret in any namespace', async () => {
        const rbacNock = nockCreate(mockSelfSubjectAccessRequestAdmin, mockSelfSubjectAccessResponseNonAdmin)
        const rbacNockii = nockCreate(mockSelfSubjectAccessRequest, mockSelfSubjectAccessResponseFalse)
        const { getByText } = render(
            <RecoilRoot
                initializeState={(snapshot) => {
                    snapshot.set(namespacesState, [mockNamespace])
                }}
            >
                <MemoryRouter initialEntries={[NavigationPath.addCredentials]}>
                    <Route
                        path={NavigationPath.addCredentials}
                        component={(props: any) => <AddCredentialPage {...props} />}
                    />
                </MemoryRouter>
            </RecoilRoot>
        )

        await waitFor(() => expect(rbacNock.isDone()).toBeTruthy())
        await waitFor(() => expect(rbacNockii.isDone()).toBeTruthy())
        await waitFor(() => expect(getByText('common:rbac.namespaces.unauthorized')).toBeInTheDocument())
    })
    it('should load page and namespace when admin', async () => {
        const rbacNock = nockCreate(mockSelfSubjectAccessRequestAdmin, mockSelfSubjectAccessResponseAdmin)
        const { getByText, container } = render(
            <RecoilRoot
                initializeState={(snapshot) => {
                    snapshot.set(namespacesState, [mockNamespace])
                }}
            >
                <MemoryRouter initialEntries={[NavigationPath.addCredentials]}>
                    <Route
                        path={NavigationPath.addCredentials}
                        component={(props: any) => <AddCredentialPage {...props} />}
                    />
                </MemoryRouter>
            </RecoilRoot>
        )

        await waitFor(() => expect(rbacNock.isDone()).toBeTruthy())
        await waitFor(() => expect(getByText('addConnection.providerName.label')).toBeInTheDocument())
        container.querySelector<HTMLButtonElement>(`[aria-labelledby^="namespaceName-label"]`)!.click()
        await waitFor(() => expect(getByText(mockNamespace.metadata.name!)).toBeInTheDocument())
    })
    it('should load page and namespace for non-admin', async () => {
        nockCreate(mockSelfSubjectAccessRequestAdmin, mockSelfSubjectAccessResponseNonAdmin)
        const rbacNock = nockCreate(mockSelfSubjectAccessRequest, mockSelfSubjectAccessResponseTrue)
        const { getByText, container } = render(
            <RecoilRoot
                initializeState={(snapshot) => {
                    snapshot.set(namespacesState, [mockNamespace])
                }}
            >
                <MemoryRouter initialEntries={[NavigationPath.addCredentials]}>
                    <Route
                        path={NavigationPath.addCredentials}
                        component={(props: any) => <AddCredentialPage {...props} />}
                    />
                </MemoryRouter>
            </RecoilRoot>
        )

        await waitFor(() => expect(rbacNock.isDone()).toBeTruthy())
        await waitFor(() => expect(getByText('addConnection.providerName.label')).toBeInTheDocument())
        container.querySelector<HTMLButtonElement>(`[aria-labelledby^="namespaceName-label"]`)!.click()
        await waitFor(() => expect(getByText(mockNamespace.metadata.name!)).toBeInTheDocument())
    })
})
