import React from 'react'
import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route } from 'react-router-dom'
import { mockBadRequestStatus, nockCreate, nockDelete, nockGet, nockList } from '../../../../lib/nock-util'
import {
    KlusterletAddonConfig,
    KlusterletAddonConfigApiVersion,
    KlusterletAddonConfigKind,
} from '../../../../resources/klusterlet-add-on-config'
import { ManagedCluster, ManagedClusterApiVersion, ManagedClusterKind } from '../../../../resources/managed-cluster'
import {
    Project,
    ProjectApiVersion,
    ProjectKind,
    ProjectRequest,
    ProjectRequestApiVersion,
    ProjectRequestKind,
} from '../../../../resources/project'
import {
    DiscoveredCluster,
    DiscoveredClusterApiVersion,
    DiscoveredClusterKind,
} from '../../../../resources/discovered-cluster'
import DiscoveredClustersPage from '../../DiscoveredClusters/DiscoveredClusters'
import ImportClusterPage from './ImportCluster'
import { Secret, SecretApiVersion, SecretKind } from '../../../../resources/secret'
import { NavigationPath } from '../../../../NavigationPath'

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
            apiUrl: 'https://api.foobar.dev01.red-chesterfield.com:6443',
            cloudProvider: 'aws',
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
                support_level: 'None',
            },
        },
    },
    {
        apiVersion: DiscoveredClusterApiVersion,
        kind: DiscoveredClusterKind,
        metadata: { name: 'test-cluster-02', namespace: 'foobar' },
        spec: {
            activity_timestamp: '2020-07-30T19:09:43Z',
            apiUrl: 'https://api.test-cluster-02.dev01.red-chesterfield.com:6443',
            cloudProvider: 'gcp',
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
                creator_id: 'abc123',
            },
        },
    },
]

const mockSecretResponse: Secret = {
    apiVersion: SecretApiVersion,
    kind: SecretKind,
    metadata: {
        name: 'foobar-import',
        namespace: 'foobar',
    },
    data: { 'crds.yaml': 'crd yaml', 'import.yaml': 'import yaml' },
    type: 'Opaque',
}

const mockAutoSecretResponse: Secret = {
    apiVersion: SecretApiVersion,
    kind: SecretKind,
    metadata: {
        name: 'auto-import-secret',
        namespace: 'foobar',
    },
    data: { autoImportRetry: '2', kubeconfig: 'Test text' },
    type: 'Opaque',
}

const mockAutoSecret: Secret = {
    apiVersion: SecretApiVersion,
    kind: SecretKind,
    metadata: {
        name: 'auto-import-secret',
        namespace: 'foobar',
    },
    data: { autoImportRetry: '2', kubeconfig: 'Test text' },
    type: 'Opaque',
}

const mockManagedCluster: ManagedCluster = {
    apiVersion: ManagedClusterApiVersion,
    kind: ManagedClusterKind,
    metadata: {
        name: 'foobar',
        labels: { cloud: 'auto-detect', vendor: 'auto-detect', name: 'foobar', foo: 'bar' },
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
        clusterLabels: { cloud: 'auto-detect', vendor: 'auto-detect', name: 'foobar', foo: 'bar' },
        applicationManager: { enabled: true, argocdCluster: false },
        policyController: { enabled: true },
        searchCollector: { enabled: true },
        certPolicyController: { enabled: true },
        iamPolicyController: { enabled: true },
        version: '2.2.0',
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
        labels: { cloud: 'auto-detect', name: 'foobar', vendor: 'auto-detect', foo: 'bar' },
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
        applicationManager: { enabled: true, argocdCluster: false },
        certPolicyController: { enabled: true },
        clusterLabels: { cloud: 'auto-detect', name: 'foobar', vendor: 'auto-detect', foo: 'bar' },
        clusterName: 'foobar',
        clusterNamespace: 'foobar',
        iamPolicyController: { enabled: true },
        policyController: { enabled: true },
        searchCollector: { enabled: true },
        version: '2.2.0',
    },
}

describe('ImportCluster', () => {
    const Component = () => {
        return (
            <MemoryRouter initialEntries={['/import-cluster']}>
                <Route path="/import-cluster">
                    <ImportClusterPage />
                </Route>
            </MemoryRouter>
        )
    }

    beforeEach(() => {
        window.sessionStorage.clear()
    })

    test('renders', () => {
        const { getByTestId } = render(<Component />)
        expect(getByTestId('import-cluster-form')).toBeInTheDocument()
        expect(getByTestId('clusterName-label')).toBeInTheDocument()
        expect(getByTestId('additionalLabels-label')).toBeInTheDocument()
    })

    test('can create resources and generate the import command', async () => {
        const projectNock = nockCreate(mockProject, mockProjectResponse)
        const managedClusterNock = nockCreate(mockManagedCluster, mockManagedClusterResponse)
        const kacNock = nockCreate(mockKlusterletAddonConfig, mockKlusterletAddonConfigResponse)
        const importSecretNock = nockGet(mockSecretResponse)

        const { getByTestId, getByText, queryByTestId } = render(<Component />)

        userEvent.type(getByTestId('clusterName'), 'foobar')
        userEvent.click(getByTestId('label-input-button'))
        userEvent.type(getByTestId('additionalLabels'), 'foo=bar{enter}')
        userEvent.click(getByText('import.mode.default'))
        userEvent.click(getByText('import.manual.choice'))
        expect(getByText('import.form.submit')).toHaveAttribute('aria-disabled', 'false')
        userEvent.click(getByText('import.form.submit'))

        await waitFor(() => expect(projectNock.isDone()).toBeTruthy())
        await waitFor(() => expect(managedClusterNock.isDone()).toBeTruthy())
        await waitFor(() => expect(kacNock.isDone()).toBeTruthy())
        await waitFor(() => expect(importSecretNock.isDone()).toBeTruthy())

        await waitFor(() => expect(getByTestId('import-command')).toBeInTheDocument())

        // reset form
        expect(getByText('import.footer.importanother')).toBeInTheDocument()
        userEvent.click(getByText('import.footer.importanother'))
        await waitFor(() => expect(queryByTestId('import-command')).toBeNull())
        expect(getByTestId('clusterName')).toHaveValue('')
    })
    test('can create resources when auto importing', async () => {
        const projectNock = nockCreate(mockProject, mockProjectResponse)
        const managedClusterNock = nockCreate(mockManagedCluster, mockManagedClusterResponse)
        const kacNock = nockCreate(mockKlusterletAddonConfig, mockKlusterletAddonConfigResponse)
        const importSecretNock = nockGet(mockSecretResponse)
        const importAutoSecretNock = nockGet(mockAutoSecret, mockAutoSecretResponse)

        const { getByTestId, getByText } = render(<Component />)

        userEvent.type(getByTestId('clusterName'), 'foobar')
        userEvent.click(getByTestId('label-input-button'))
        userEvent.type(getByTestId('additionalLabels'), 'foo=bar{enter}')
        userEvent.click(getByText('import.mode.default'))
        userEvent.click(getByText('import.auto.choice'))
        userEvent.click(getByText('import.credential.default'))
        userEvent.click(getByText('import.config.choice'))
        userEvent.click(getByText('import.auto.config.label'))
        userEvent.click(getByTestId('kubeConfigEntry'))
        userEvent.type(getByTestId('kubeConfigEntry'), 'Test text')
        expect(getByText('import.auto.button')).toBeInTheDocument
        userEvent.click(getByText('import.auto.button'))

        await waitFor(() => expect(projectNock.isDone()).toBeTruthy())
        await waitFor(() => expect(managedClusterNock.isDone()).toBeTruthy())
        await waitFor(() => expect(kacNock.isDone()).toBeTruthy())
        await waitFor(() => expect(importSecretNock.isDone()).toBeTruthy())
        await waitFor(() => expect(importAutoSecretNock.isDone()).toBeTruthy())
    })
    test('handles project creation error', async () => {
        const projectNock = nockCreate(mockProject, mockBadRequestStatus)
        const { getByTestId, getByText } = render(<Component />)
        userEvent.type(getByTestId('clusterName'), 'foobar')
        userEvent.click(getByText('import.mode.default'))
        userEvent.click(getByText('import.manual.choice'))
        expect(getByText('import.form.submit')).toHaveAttribute('aria-disabled', 'false')
        userEvent.click(getByText('import.form.submit'))
        await waitFor(() => expect(getByText('import.generating')).toBeInTheDocument())
        await waitFor(() => expect(projectNock.isDone()).toBeTruthy())
        await waitFor(() => expect(getByText(mockBadRequestStatus.message)).toBeInTheDocument())
    })

    test('handles resource creation errors', async () => {
        const createProjectNock = nockCreate(mockProject, mockProjectResponse)
        const badRequestNock = nockCreate(mockManagedCluster, mockBadRequestStatus)
        const deleteProjectNock = nockDelete(mockProjectResponse)

        const { getByTestId, getByText } = render(<Component />)

        userEvent.type(getByTestId('clusterName'), 'foobar')
        userEvent.click(getByTestId('label-input-button'))
        userEvent.type(getByTestId('additionalLabels'), 'foo=bar{enter}')
        userEvent.click(getByText('import.mode.default'))
        userEvent.click(getByText('import.manual.choice'))
        userEvent.click(getByText('import.form.submit'))

        await waitFor(() => expect(createProjectNock.isDone()).toBeTruthy())
        await waitFor(() => expect(badRequestNock.isDone()).toBeTruthy())
        await waitFor(() => expect(deleteProjectNock.isDone()).toBeTruthy())

        await waitFor(() => expect(getByText(mockBadRequestStatus.message)).toBeInTheDocument())
    })
})

let store: Record<string, string> = {}

Object.defineProperty(window, 'sessionStorage', {
    value: {
        getItem(key: string) {
            return store[key] || null
        },
        setItem(key: string, value: string | Record<string, string>) {
            store[key] = value.toString()
        },
        removeItem(key: string) {
            delete store[key]
        },
        clear() {
            store = {}
        },
    },
})

describe('Import Discovered Cluster', () => {
    window.sessionStorage.setItem('DiscoveredClusterConsoleURL', 'https://test-cluster.com')
    const Component = () => {
        return (
            <MemoryRouter>
                <Route>
                    <DiscoveredClustersPage />
                </Route>
                <Route path={NavigationPath.importCluster}>
                    <ImportClusterPage />
                </Route>
            </MemoryRouter>
        )
    }
    test('create discovered cluster', async () => {
        const projectNock = nockCreate(mockProject, mockProjectResponse)
        const managedClusterNock = nockCreate(mockManagedCluster, mockManagedClusterResponse)
        const kacNock = nockCreate(mockKlusterletAddonConfig, mockKlusterletAddonConfigResponse)
        const discoveredClusterNock = nockList(
            { apiVersion: DiscoveredClusterApiVersion, kind: DiscoveredClusterKind },
            mockDiscoveredClusters
        )
        const importCommandNock = nockGet(mockSecretResponse)

        const { getByTestId, getByText, getAllByLabelText } = render(<Component />) // Render component

        await waitFor(() => expect(discoveredClusterNock.isDone()).toBeTruthy())

        await waitFor(() => expect(getByText(mockDiscoveredClusters[0].metadata.name!)).toBeInTheDocument()) // Wait for DiscoveredCluster to appear in table
        userEvent.click(getAllByLabelText('Actions')[0]) // Click on Kebab menu
        await waitFor(() => expect(getByText('discovery.import')).toBeInTheDocument())
        userEvent.click(getByText('discovery.import')) // Click Import cluster
        userEvent.click(getByText('import.mode.default'))
        userEvent.click(getByText('import.manual.choice'))
        await waitFor(() => expect(getByText('import.form.submit')).toBeInTheDocument()) // Wait for next page to render

        // Add labels
        userEvent.click(getByTestId('label-input-button'))
        userEvent.type(getByTestId('additionalLabels'), 'foo=bar{enter}')

        userEvent.click(getByText('import.form.submit'))

        await waitFor(() => expect(projectNock.isDone()).toBeTruthy())
        await waitFor(() => expect(managedClusterNock.isDone()).toBeTruthy())
        await waitFor(() => expect(kacNock.isDone()).toBeTruthy())
        await waitFor(() => expect(importCommandNock.isDone()).toBeTruthy())

        await waitFor(() => expect(getByTestId('import-command')).toBeInTheDocument())
        await waitFor(() => expect(getByTestId('launch-console')).toBeInTheDocument())
    })
})
