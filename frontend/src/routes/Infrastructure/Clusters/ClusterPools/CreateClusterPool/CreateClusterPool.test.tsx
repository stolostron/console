/* Copyright Contributors to the Open Cluster Management project */

import {
    ClusterImageSet,
    ClusterImageSetApiVersion,
    ClusterImageSetKind,
    ClusterPool,
    ClusterPoolApiVersion,
    ClusterPoolKind,
    Namespace,
    NamespaceApiVersion,
    NamespaceKind,
    ProjectRequest,
    ProjectRequestApiVersion,
    ProjectRequestKind,
    ProviderConnection,
    ProviderConnectionApiVersion,
    ProviderConnectionKind,
    Secret,
    SecretApiVersion,
    SecretKind,
} from '../../../../../resources'
import { render } from '@testing-library/react'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { managedClusterSetsState, namespacesState, secretsState } from '../../../../../atoms'
import { nockCreate, nockIgnoreRBAC, nockList, nockReplace } from '../../../../../lib/nock-util'
import {
    clickByPlaceholderText,
    clickByText,
    selectByText,
    typeByTestId,
    waitForNocks,
    waitForTestId,
    waitForText,
} from '../../../../../lib/test-util'
import { NavigationPath } from '../../../../../NavigationPath'
import { createProviderConnection } from '../../../../Credentials/CredentialsForm.test'
import { CreateClusterPoolPage } from '../CreateClusterPoolPage'
import { CLUSTER_POOL_INFRA_TYPE_PARAM } from '../ClusterPoolInfrastructureType'

const clusterName = 'test'

///////////////////////////////// FILL FORM //////////////////////////////////////////////////

const clusterImageSet: ClusterImageSet = {
    apiVersion: ClusterImageSetApiVersion,
    kind: ClusterImageSetKind,
    metadata: {
        name: 'ocp-release43',
    },
    spec: {
        releaseImage: 'quay.io/openshift-release-dev/ocp-release:4.6.15-x86_64',
    },
}
const mockClusterImageSet = [clusterImageSet]

const mockNamespaces: Namespace[] = ['namespace1', 'namespace2', 'namespace3', 'test-namespace'].map((name) => ({
    apiVersion: NamespaceApiVersion,
    kind: NamespaceKind,
    metadata: { name },
}))

const providerConnection: ProviderConnection = {
    apiVersion: ProviderConnectionApiVersion,
    kind: ProviderConnectionKind,
    metadata: {
        name: 'connection',
        namespace: clusterName,
        labels: {
            'cluster.open-cluster-management.io/type': 'aws',
            'cluster.open-cluster-management.io/credentials': '',
        },
    },
    stringData: {
        aws_access_key_id: 'aws_access_key_id',
        aws_secret_access_key: 'aws_secret_access_key',
        baseDomain: 'base.domain',
        pullSecret: '{"pullSecret":"secret"}',
        'ssh-privatekey': '-----BEGIN OPENSSH PRIVATE KEY-----\nkey\n-----END OPENSSH PRIVATE KEY-----',
        'ssh-publickey': 'ssh-rsa AAAAB1 fakeemail@redhat.com',
    },
    type: 'Opaque',
}

const mockNamespace: Namespace = {
    apiVersion: NamespaceApiVersion,
    kind: NamespaceKind,
    metadata: { name: 'test-namespace' },
}

const mockNamespaceUpdate: Namespace = {
    apiVersion: NamespaceApiVersion,
    kind: NamespaceKind,
    metadata: {
        name: mockNamespace.metadata.name,
        labels: { 'open-cluster-management.io/managed-by': 'clusterpools' },
    },
}

const mockCreateProject: ProjectRequest = {
    apiVersion: ProjectRequestApiVersion,
    kind: ProjectRequestKind,
    metadata: { name: mockNamespace.metadata.name },
}

///////////////////////////////// CREATE RESOURCE MOCKS //////////////////////////////////////////////////

const mockPullSecret: Secret = {
    apiVersion: 'v1',
    kind: 'Secret',
    metadata: {
        name: 'test-pull-secret',
        namespace: mockNamespace.metadata.name!,
    },
    stringData: {
        '.dockerconfigjson': '{"pullSecret":"secret"}',
    },
    type: 'kubernetes.io/dockerconfigjson',
}

const mockInstallConfigSecret: Secret = {
    apiVersion: 'v1',
    kind: 'Secret',
    metadata: {
        name: 'test-install-config',
        namespace: mockNamespace.metadata.name!,
    },
    type: 'Opaque',
    data: {
        'install-config.yaml':
            'YXBpVmVyc2lvbjogdjEKbWV0YWRhdGE6CiAgbmFtZTogJ3Rlc3QnCmJhc2VEb21haW46IGJhc2UuZG9tYWluCmNvbnRyb2xQbGFuZToKICBoeXBlcnRocmVhZGluZzogRW5hYmxlZAogIG5hbWU6IG1hc3RlcgogIHJlcGxpY2FzOiAzCiAgcGxhdGZvcm06CiAgICBhd3M6CiAgICAgIHJvb3RWb2x1bWU6CiAgICAgICAgaW9wczogNDAwMAogICAgICAgIHNpemU6IDEwMAogICAgICAgIHR5cGU6IGlvMQogICAgICB0eXBlOiBtNS54bGFyZ2UKY29tcHV0ZToKLSBoeXBlcnRocmVhZGluZzogRW5hYmxlZAogIG5hbWU6ICd3b3JrZXInCiAgcmVwbGljYXM6IDMKICBwbGF0Zm9ybToKICAgIGF3czoKICAgICAgcm9vdFZvbHVtZToKICAgICAgICBpb3BzOiAyMDAwCiAgICAgICAgc2l6ZTogMTAwCiAgICAgICAgdHlwZTogaW8xCiAgICAgIHR5cGU6IG01LnhsYXJnZQpuZXR3b3JraW5nOgogIG5ldHdvcmtUeXBlOiBPcGVuU2hpZnRTRE4KICBjbHVzdGVyTmV0d29yazoKICAtIGNpZHI6IDEwLjEyOC4wLjAvMTQKICAgIGhvc3RQcmVmaXg6IDIzCiAgbWFjaGluZU5ldHdvcms6CiAgLSBjaWRyOiAxMC4wLjAuMC8xNgogIHNlcnZpY2VOZXR3b3JrOgogIC0gMTcyLjMwLjAuMC8xNgpwbGF0Zm9ybToKICBhd3M6CiAgICByZWdpb246IHVzLWVhc3QtMQpwdWxsU2VjcmV0OiAiIiAjIHNraXAsIGhpdmUgd2lsbCBpbmplY3QgYmFzZWQgb24gaXQncyBzZWNyZXRzCnNzaEtleTogfC0KICAgIHNzaC1yc2EgQUFBQUIxIGZha2VlbWFpbEByZWRoYXQuY29tCg==',
    },
}

const mockCredentialSecret: Secret = {
    apiVersion: SecretApiVersion,
    kind: SecretKind,
    type: 'Opaque',
    metadata: {
        name: `${clusterName}-aws-creds`,
        namespace: mockNamespace.metadata.name!,
    },
    stringData: {
        aws_access_key_id: 'aws_access_key_id',
        aws_secret_access_key: 'aws_secret_access_key',
    },
}

const mockClusterPool: ClusterPool = {
    apiVersion: ClusterPoolApiVersion,
    kind: ClusterPoolKind,
    metadata: {
        name: clusterName,
        namespace: mockNamespace.metadata.name!,
        labels: {
            cloud: 'AWS',
            region: 'us-east-1',
            vendor: 'OpenShift',
        },
    },
    spec: {
        size: 1,
        runningCount: 0,
        baseDomain: providerConnection.stringData?.baseDomain!,
        installConfigSecretTemplateRef: {
            name: mockInstallConfigSecret.metadata.name!,
        },
        imageSetRef: {
            name: clusterImageSet.metadata.name!,
        },
        pullSecretRef: {
            name: mockPullSecret.metadata.name!,
        },
        platform: {
            aws: {
                credentialsSecretRef: {
                    name: mockCredentialSecret.metadata.name!,
                },
                region: 'us-east-1',
            },
        },
    },
}

///////////////////////////////// TESTS /////////////////////////////////////////////////////

describe('CreateClusterPool AWS', () => {
    const Component = () => {
        return (
            <RecoilRoot
                initializeState={(snapshot) => {
                    snapshot.set(managedClusterSetsState, [])
                    snapshot.set(namespacesState, mockNamespaces)
                    snapshot.set(secretsState, [providerConnection as Secret])
                }}
            >
                <MemoryRouter
                    initialEntries={[`${NavigationPath.createClusterPool}?${CLUSTER_POOL_INFRA_TYPE_PARAM}=AWS`]}
                >
                    <Route path={NavigationPath.createClusterPool}>
                        <CreateClusterPoolPage />
                    </Route>
                </MemoryRouter>
            </RecoilRoot>
        )
    }

    beforeEach(() => {
        nockIgnoreRBAC()
    })

    test('can create a cluster pool', async () => {
        window.scrollBy = () => {}

        const initialNocks = [nockList(clusterImageSet, mockClusterImageSet)]

        const newProviderConnection = createProviderConnection(
            'aws',
            { aws_access_key_id: 'aws_access_key_id', aws_secret_access_key: 'aws_secret_access_key' },
            true
        )

        // create the form
        const { container } = render(<Component />)

        // wait for tables/combos to fill in
        await waitForNocks(initialNocks)

        // connection
        await clickByPlaceholderText('Select a credential')

        // Should show the modal wizard
        await clickByText('Add credential')
        // Credentials type
        await waitForTestId('credentialsType-input-toggle')
        await typeByTestId('credentialsName', newProviderConnection.metadata.name!)
        await selectByText('Select a namespace for the credential', newProviderConnection.metadata.namespace!)
        await clickByText('Cancel', 1)

        await clickByPlaceholderText('Select a credential')
        await clickByText(providerConnection.metadata.name!)

        // step 2 -- the name, namespace and imageset
        await typeByTestId('eman', clusterName!)
        await typeByTestId('emanspace', mockCreateProject.metadata.name!)
        await typeByTestId('imageSet', clusterImageSet!.spec!.releaseImage!)
        container.querySelector<HTMLButtonElement>('.tf--list-box__menu-item')?.click()
        await clickByText('Next')

        // skip AWS private config
        await clickByText('Next')

        await clickByText('Review and create')

        // nocks for cluster creation
        const createNocks = [
            // create aws namespace (project)
            nockCreate(mockCreateProject),
            nockReplace(mockNamespaceUpdate),

            // create the managed cluster
            nockCreate(mockPullSecret),
            nockCreate(mockInstallConfigSecret),
            nockCreate(mockCredentialSecret),
            nockCreate(mockClusterPool),
        ]

        // click create button
        await clickByText('Create')

        await waitForText('Creating ClusterPool ...')

        // make sure creating
        await waitForNocks(createNocks)
    })
})
