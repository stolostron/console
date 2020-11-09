import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { MemoryRouter, Route } from 'react-router-dom'
import {
    KlusterletAddonConfig,
    KlusterletAddonConfigApiVersion,
    KlusterletAddonConfigKind
} from '../../../library/resources/klusterlet-add-on-config'
import {
    ManagedCluster,
    ManagedClusterApiVersion,
    ManagedClusterKind
} from '../../../library/resources/managed-cluster'
import { nockCreate } from '../../../lib/nock-util'
import {
    Project,
    ProjectApiVersion,
    ProjectKind,
    ProjectRequest,
    ProjectRequestApiVersion,
    ProjectRequestKind
} from '../../../library/resources/project'
import { ImportClusterPage } from './ImportCluster'

const mockProject: ProjectRequest = {
    apiVersion: ProjectRequestApiVersion,
    kind: ProjectRequestKind,
    metadata: { name: 'foobar' },
}

const mockManagedCluster: ManagedCluster = {
    apiVersion: ManagedClusterApiVersion,
    kind: ManagedClusterKind,
    metadata: {
        name: 'foobar',
        labels: { cloud: 'AWS', vendor: 'auto-detect', name: 'foobar', environment: 'dev', foo: 'bar' },
    },
    spec: { hubAcceptsClient: true },
}
const mockKlusterletAddonConfig: KlusterletAddonConfig = {
    apiVersion: KlusterletAddonConfigApiVersion,
    kind: KlusterletAddonConfigKind,
    metadata: { name: 'foobar', namespace: 'foobar' },
    spec: {
        clusterName: 'foobar',
        clusterNamespace: 'foobar',
        clusterLabels: { cloud: 'AWS', vendor: 'auto-detect', name: 'foobar', environment: 'dev', foo: 'bar' },
        applicationManager: { enabled: true },
        policyController: { enabled: true },
        searchCollector: { enabled: true },
        certPolicyController: { enabled: true },
        iamPolicyController: { enabled: true },
        version: '2.1.0',
    },
}

const mockProjectResponse: Project = {
    apiVersion: ProjectApiVersion,
    kind: ProjectKind,
    metadata: {
        name: 'foobar',
        selfLink: '/apis/project.openshift.io/v1/projectrequests/foobar',
        uid: 'f628792b-79d2-4c41-a07a-c7f1afac5e8a',
        resourceVersion: '16251055',
        annotations: {
            'openshift.io/description': '',
            'openshift.io/display-name': '',
            'openshift.io/requester': 'kube:admin',
            'openshift.io/sa.scc.mcs': 's0:c25,c15',
            'openshift.io/sa.scc.supplemental-groups': '1000630000/10000',
            'openshift.io/sa.scc.uid-range': '1000630000/10000',
        },
    },
}
const mockManagedClusterResponse: ManagedCluster = {
    apiVersion: 'cluster.open-cluster-management.io/v1',
    kind: 'ManagedCluster',
    metadata: {
        labels: { cloud: 'AWS', environment: 'dev', name: 'foobar', vendor: 'auto-detect', foo: 'bar' },
        name: 'foobar',
        uid: 'e60ef618-324b-49d4-8a28-48839c546565',
    },
    spec: { hubAcceptsClient: true, leaseDurationSeconds: 60 },
}
const mockKlusterletAddonConfigResponse: KlusterletAddonConfig = {
    apiVersion: 'agent.open-cluster-management.io/v1',
    kind: 'KlusterletAddonConfig',
    metadata: {
        name: 'foobar',
        namespace: 'foobar',
        uid: 'fba00095-386b-4d68-b2da-97003bc6a987',
    },
    spec: {
        applicationManager: { enabled: true },
        certPolicyController: { enabled: true },
        clusterLabels: { cloud: 'AWS', environment: 'dev', name: 'foobar', vendor: 'auto-detect', foo: 'bar' },
        clusterName: 'foobar',
        clusterNamespace: 'foobar',
        iamPolicyController: { enabled: true },
        policyController: { enabled: true },
        searchCollector: { enabled: true },
        version: '2.1.0',
    },
}

describe('ImportCluster', () => {
    const Component = () => {
        return (
            <MemoryRouter initialEntries={['/cluster-management/clusters/import']}>
                <Route path="/cluster-management/clusters/import">
                    <ImportClusterPage />
                </Route>
                <Route path="/cluster-management/clusters/import/:clusterName">
                    <div id="import-command" />
                </Route>
            </MemoryRouter>
        )
    }
    test('renders', () => {
        const { getByTestId } = render(<Component />)
        expect(getByTestId('import-cluster-form')).toBeInTheDocument()
        expect(getByTestId('clusterName-label')).toBeInTheDocument()
        expect(getByTestId('cloudLabel-label')).toBeInTheDocument()
        expect(getByTestId('environmentLabel-label')).toBeInTheDocument()
        expect(getByTestId('additionalLabels-label')).toBeInTheDocument()
    })
    test('can create resources', async () => {
        const projectNock = nockCreate(mockProject, mockProjectResponse)
        const managedClusterNock = nockCreate(mockManagedCluster, mockManagedClusterResponse)
        const kacNock = nockCreate(mockKlusterletAddonConfig, mockKlusterletAddonConfigResponse)

        const { getByTestId, getByText, queryByRole } = render(<Component />)
        userEvent.type(getByTestId('clusterName'), 'foobar')
        userEvent.click(getByTestId('cloudLabel-button'))
        userEvent.click(getByText('AWS'))
        userEvent.click(getByTestId('environmentLabel-button'))
        userEvent.click(getByText('dev'))
        userEvent.click(getByTestId('additionalLabels-button'))
        userEvent.type(getByTestId('additionalLabels'), 'foo=bar{enter}')
        userEvent.click(getByTestId('submit'))

        await waitFor(() => expect(queryByRole('progressbar')).toBeInTheDocument())

        await waitFor(() => expect(projectNock.isDone()).toBeTruthy())
        await waitFor(() => expect(managedClusterNock.isDone()).toBeTruthy())
        await waitFor(() => expect(kacNock.isDone()).toBeTruthy())

        await waitFor(() => expect(getByTestId('import-command')).toBeInTheDocument())
    })
    test('handles project creation error', async () => {
        const mockProjectErrorResponse = {"kind":"Status","apiVersion":"v1","metadata":{},"status":"Failure","message":"invalid token","reason":"Unauthorized","details":{"name":"test","group":"project.openshift.io","kind":"project"},"code":401}

        const projectNock = nockCreate(mockProject, mockProjectErrorResponse, 401)

        const { getByTestId, getByText, queryByRole } = render(<Component />)

        userEvent.type(getByTestId('clusterName'), 'foobar')
        userEvent.click(getByTestId('submit'))

        await waitFor(() => expect(queryByRole('progressbar')).toBeInTheDocument())

        await waitFor(() => expect(projectNock.isDone()).toBeTruthy())

        await waitFor(() => expect(queryByRole('progressbar')).toBeNull())

        await waitFor(() => expect(getByText('401: invalid token')).toBeInTheDocument())
    })
    test('handles resource creation errors', async () => {
        const mockManagedClusterErrorResponse = {"kind":"Status","apiVersion":"v1","metadata":{},"status":"Failure","message":"managedclusters.cluster.open-cluster-management.io \"foobar\" already exists","reason":"AlreadyExists","details":{"name":"foobar","group":"cluster.open-cluster-management.io","kind":"managedclusters"},"code":409}
        const mockKACErrorResponse = {"kind":"Status","apiVersion":"v1","metadata":{},"status":"Failure","message":"klusterletaddonconfigs.agent.open-cluster-management.io \"foobar\" already exists","reason":"AlreadyExists","details":{"name":"foobar","group":"agent.open-cluster-management.io","kind":"klusterletaddonconfigs"},"code":409}

        const projectNock = nockCreate(mockProject, mockProjectResponse)
        const managedClusterNock = nockCreate(mockManagedCluster, mockManagedClusterErrorResponse, 409)
        const kacNock = nockCreate(mockKlusterletAddonConfig, mockKACErrorResponse, 409)

        const { getByTestId, getByText, queryByRole } = render(<Component />)

        userEvent.type(getByTestId('clusterName'), 'foobar')
        userEvent.click(getByTestId('cloudLabel-button'))
        userEvent.click(getByText('AWS'))
        userEvent.click(getByTestId('environmentLabel-button'))
        userEvent.click(getByText('dev'))
        userEvent.click(getByTestId('additionalLabels-button'))
        userEvent.type(getByTestId('additionalLabels'), 'foo=bar{enter}')
        userEvent.click(getByTestId('submit'))

        await waitFor(() => expect(queryByRole('progressbar')).toBeInTheDocument())

        await waitFor(() => expect(projectNock.isDone()).toBeTruthy())
        await waitFor(() => expect(managedClusterNock.isDone()).toBeTruthy())
        await waitFor(() => expect(kacNock.isDone()).toBeTruthy())

        await waitFor(() => expect(queryByRole('progressbar')).toBeNull())

        await waitFor(() => expect(getByText('409: klusterletaddonconfigs.agent.open-cluster-management.io "foobar" already exists')).toBeInTheDocument())
        await waitFor(() => expect(getByText('409: managedclusters.cluster.open-cluster-management.io "foobar" already exists')).toBeInTheDocument())
    })
})
