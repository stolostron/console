import { getByText, render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { MemoryRouter, Route } from 'react-router-dom'
import { mockBadRequestStatus, nockCreate, nockList, nockGet } from '../../../lib/nock-util'
import {
    KlusterletAddonConfig,
    KlusterletAddonConfigApiVersion,
    KlusterletAddonConfigKind,
} from '../../../library/resources/klusterlet-add-on-config'
import {
    ManagedCluster,
    ManagedClusterApiVersion,
    ManagedClusterKind,
} from '../../../library/resources/managed-cluster'
import {
    Project,
    ProjectApiVersion,
    ProjectKind,
    ProjectRequest,
    ProjectRequestApiVersion,
    ProjectRequestKind,
} from '../../../library/resources/project'
import { ImportClusterPage } from './ImportCluster'
import { ClustersPage } from './Clusters'
import * as nock from 'nock'
import { Secret } from '../../../library/resources/secret'
import { DiscoveredCluster, DiscoveredClusterApiVersion, DiscoveredClusterKind } from '../../../library/resources/discovered-cluster'
import { ManagedClusterAddOnApiVersion } from '../../../library/resources/managed-cluster-add-on'

const mockProject: ProjectRequest = {
    apiVersion: ProjectRequestApiVersion,
    kind: ProjectRequestKind,
    metadata: { name: 'foobar' },
}

const mockDiscoveredClusters: DiscoveredCluster[] = [
    {
        apiVersion: DiscoveredClusterApiVersion,
        kind: DiscoveredClusterKind,
        metadata: {
             name: 'foobar', 
             namespace: 'foobar',
        },
        spec: {
            activity_timestamp: '2020-07-30T19:09:43Z',
            apiUrl: "https://api.foobar.dev01.red-chesterfield.com:6443",
            cloudProvider: "aws",
            console: 'https://console-openshift-console.apps.foobar.dev01.red-chesterfield.com',
            creation_timestamp: '2020-07-30T19:09:43Z',
            healthState: 'healthy',
            name: 'foobar',
            openshiftVersion: '4.5.5',
            product: 'ocp',
            providerConnections: [
                {
                    apiVersion: 'v1',
                    kind: 'Secret',
                    name: 'ocm-api-token',
                    namespace: 'open-cluster-management',
                    resourceVersion: '2673462626',
                    uid: '8e103e5d-0267-4872-b185-1240e413d7b4',
                },
            ],
            region: 'us-east-1',
            state: 'ready',
            subscription: {
                creator_id: 'abc123',
                managed: false,
                status: 'Active',
                support_level: 'None'
            }
        },
    },
    {
        apiVersion: DiscoveredClusterApiVersion,
        kind: DiscoveredClusterKind,
        metadata: { name: 'test-cluster-02', namespace: 'foobar' },
        spec: {
            activity_timestamp: '2020-07-30T19:09:43Z',
            apiUrl: "https://api.test-cluster-02.dev01.red-chesterfield.com:6443",
            cloudProvider: "gcp",
            console: 'https://console-openshift-console.apps.test-cluster-01.dev01.red-chesterfield.com',
            creation_timestamp: '2020-07-30T19:09:43Z',
            healthState: 'healthy',
            name: 'test-cluster-02',
            openshiftVersion: '4.6.1',
            product: 'ocp',
            region: 'us-east-1',
            state: 'ready',
            subscription: {
                status: 'Stale',
                managed: true,
                support_level: 'eval',
                creator_id: 'abc123'
            }
        },
    },
]

const mockSecretResponse: Secret = {
    apiVersion: 'v1',
    kind: 'Secret',
    metadata: {
        name: 'foobar-import',
        namespace: 'foobar',
    },
    data: {
        'crds.yaml': 'test',
        'import.yaml': 'test',
    }
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
    apiVersion: ManagedClusterApiVersion,
    kind: ManagedClusterKind,
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
        // expect(getByTestId('importModeManual')).toBeInTheDocument()
        expect(getByTestId('submit')).toBeInTheDocument()
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

        nockGet(mockSecretResponse)

        await waitFor(() => expect(queryByRole('progressbar')).toBeInTheDocument())
        await waitFor(() => expect(projectNock.isDone()).toBeTruthy())
        await waitFor(() => expect(managedClusterNock.isDone()).toBeTruthy())
        await waitFor(() => expect(kacNock.isDone()).toBeTruthy())
        await waitFor(() => expect(getByTestId('import-command')).toBeInTheDocument())
    })

    test('handles project creation error', async () => {
        const projectNock = nockCreate(mockProject, mockBadRequestStatus)
        const { getByTestId, getByText, queryByRole } = render(<Component />)
        userEvent.type(getByTestId('clusterName'), 'foobar')
        userEvent.click(getByTestId('submit'))
        await waitFor(() => expect(queryByRole('progressbar')).toBeInTheDocument())
        await waitFor(() => expect(projectNock.isDone()).toBeTruthy())
        await waitFor(() => expect(queryByRole('progressbar')).toBeNull())
        await waitFor(() => expect(getByText(mockBadRequestStatus.message)).toBeInTheDocument())
    })

    test('handles resource creation errors', async () => {
        const projectNock = nockCreate(mockProject, mockProjectResponse)
        const managedClusterNock = nockCreate(mockManagedCluster, mockBadRequestStatus)
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
        await waitFor(() => expect(queryByRole('progressbar')).toBeNull())
        await waitFor(() => expect(getByText(mockBadRequestStatus.message)).toBeInTheDocument())
    })
})

describe('Import Discovered Cluster', () => {
    const Component = () => {
        return (
            <MemoryRouter>
                <Route>
                    <ClustersPage />
                </Route>
                <Route path="/cluster-management/clusters/import">
                    <ImportClusterPage />
                </Route>
            </MemoryRouter>
        )
    }
    test('create discovered cluster', async() => {
        // Allow for Project, ManagedCluster, and KAC to be created
        const projectNock = nockCreate(mockProject, mockProject)
        const managedClusterNock = nockCreate(mockManagedCluster, mockManagedClusterResponse)
        const kacNock = nockCreate(mockKlusterletAddonConfig, mockKlusterletAddonConfigResponse)

        // Serve Managed and Discovered Clusters
        nockList({ apiVersion: ManagedClusterApiVersion, kind: ManagedClusterKind }, [] as ManagedCluster[])
        nockList({ apiVersion: DiscoveredClusterApiVersion, kind: DiscoveredClusterKind }, mockDiscoveredClusters)

        const { getByTestId, getByText, getAllByLabelText, queryByRole } = render(<Component />) // Render component

        userEvent.click(getByText('discovered')) // Click on Discovered ToggleGroupItem

        await waitFor(() => expect(getByText(mockDiscoveredClusters[0].metadata.name!)).toBeInTheDocument()) // Wait for DiscoveredCluster to appear in table
        
        userEvent.click(getAllByLabelText('Actions')[0]) // Click on Kebab menu
        userEvent.click(getByText('discovery.import')) // Click Import cluster
        
        await waitFor(() => expect(getByTestId('submit')).toBeInTheDocument()) // Wait for next page to render

        // Add labels
        userEvent.click(getByTestId('cloudLabel-button'))
        userEvent.click(getByText('AWS'))
        userEvent.click(getByTestId('environmentLabel-button'))
        userEvent.click(getByText('dev'))
        userEvent.click(getByTestId('additionalLabels-button'))
        userEvent.type(getByTestId('additionalLabels'), 'foo=bar{enter}')

        userEvent.click(getByTestId('submit')) // Submit form

        nockGet(mockSecretResponse) // Allow for import secret to be read

        await waitFor(() => expect(queryByRole('progressbar')).toBeInTheDocument()) // Load

        // Ensure resources are created
        await waitFor(() => expect(projectNock.isDone()).toBeTruthy())
        await waitFor(() => expect(kacNock.isDone()).toBeTruthy())
        await waitFor(() => expect(managedClusterNock.isDone()).toBeTruthy())

        // Ensure import command is visible
        await waitFor(() => expect(getByTestId('import-command')).toBeInTheDocument())
    })
})