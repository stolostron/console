/* Copyright Contributors to the Open Cluster Management project */

import {
    ClusterCurator,
    ClusterCuratorApiVersion,
    ClusterCuratorKind,
    ClusterImageSet,
    ClusterImageSetApiVersion,
    ClusterImageSetKind,
    MachinePool,
    MachinePoolApiVersion,
    MachinePoolKind,
    ManagedCluster,
    ManagedClusterApiVersion,
    ManagedClusterKind,
    Project,
    ProjectApiVersion,
    ProjectKind,
    ProjectRequest,
    ProjectRequestApiVersion,
    ProjectRequestKind,
    ProviderConnection,
    ProviderConnectionApiVersion,
    ProviderConnectionKind,
    Secret,
} from '../../../../../resources'
import { render } from '@testing-library/react'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import {
    clusterCuratorsState,
    managedClusterSetsState,
    managedClustersState,
    secretsState,
    settingsState,
} from '../../../../../atoms'
import { nockCreate, nockIgnoreRBAC, nockList } from '../../../../../lib/nock-util'
import {
    clickByPlaceholderText,
    clickByTestId,
    clickByText,
    clickByTitle,
    typeByPlaceholderText,
    typeByTestId,
    typeByText,
    waitForNocks,
    waitForText,
} from '../../../../../lib/test-util'
import { NavigationPath } from '../../../../../NavigationPath'
import CreateClusterPage from './CreateCluster'
import { Scope } from 'nock/types'
import {
    clusterName,
    baseDomain,
    mockAgentClusterInstall,
    mockClusterDeploymentAI,
    clusterImageSet,
    mockClusterImageSet,
} from './CreateCluster.sharedmocks'
import { PluginContext } from '../../../../../lib/PluginContext'

//const awsProjectNamespace = 'test-aws-namespace'

///////////////////////////////// FILL FORM //////////////////////////////////////////////////

const providerConnection: ProviderConnection = {
    apiVersion: ProviderConnectionApiVersion,
    kind: ProviderConnectionKind,
    metadata: {
        name: 'connection',
        namespace: clusterName,
        labels: {
            'cluster.open-cluster-management.io/type': 'bmc',
        },
    },
    stringData: {
        libvirtURI: 'qemu+ssh://libvirtURI',
        sshKnownHosts: 'sshKnownHosts',
        imageMirror: 'image.mirror:123/abc',
        bootstrapOSImage: 'bootstrapOSImage',
        clusterOSImage: 'clusterOSImage',
        additionalTrustBundle: '-----BEGIN CERTIFICATE-----\ncertdata\n-----END CERTIFICATE-----',
        baseDomain,
        pullSecret: '{"pullSecret":"secret"}',
        'ssh-privatekey': '-----BEGIN OPENSSH PRIVATE KEY-----\nkey\n-----END OPENSSH PRIVATE KEY-----',
        'ssh-publickey': 'ssh-rsa AAAAB1 fake@email.com',
    },
    type: 'Opaque',
}

const clusterCurator: ClusterCurator = {
    apiVersion: ClusterCuratorApiVersion,
    kind: ClusterCuratorKind,
    metadata: {
        name: 'test',
        namespace: 'test-ii',
        labels: {
            'open-cluster-management': 'curator',
        },
    },
    spec: {
        desiredCuration: undefined,
        install: {
            prehook: [
                {
                    name: 'test',
                    extra_vars: {},
                },
            ],
            towerAuthSecret: 'ansible-connection',
        },
    },
}

const mockClusterCuratorInstall: ClusterCurator = {
    apiVersion: ClusterCuratorApiVersion,
    kind: ClusterCuratorKind,
    metadata: {
        name: clusterName,
        namespace: clusterName,
        labels: {
            'open-cluster-management': 'curator',
        },
    },
    spec: {
        install: {
            prehook: [
                {
                    name: 'test',
                    extra_vars: {},
                },
            ],
            towerAuthSecret: 'toweraccess-install',
        },
        desiredCuration: 'install',
    },
}

const providerConnectionAnsible: ProviderConnection = {
    apiVersion: ProviderConnectionApiVersion,
    kind: ProviderConnectionKind,
    metadata: {
        name: 'ansible-connection',
        namespace: 'test-ii',
        labels: {
            'cluster.open-cluster-management.io/type': 'ans',
        },
    },
    stringData: {
        host: 'test',
        token: 'test',
    },
    type: 'Opaque',
}

const mockProviderConnectionAnsibleCopied: ProviderConnection = {
    apiVersion: ProviderConnectionApiVersion,
    kind: ProviderConnectionKind,
    metadata: {
        name: 'toweraccess-install',
        namespace: clusterName,
        labels: {
            'cluster.open-cluster-management.io/type': 'ans',
            'cluster.open-cluster-management.io/copiedFromNamespace': 'test-ii',
            'cluster.open-cluster-management.io/copiedFromSecretName': 'ansible-connection',
            'cluster.open-cluster-management.io/backup': 'cluster',
        },
    },
    stringData: {
        host: 'test',
        token: 'test',
    },
    type: 'Opaque',
}

const mockClusterCurators = [clusterCurator]

///// AWS /////
const providerConnectionAws: ProviderConnection = {
    apiVersion: ProviderConnectionApiVersion,
    kind: ProviderConnectionKind,
    metadata: {
        name: 'connectionAws',
        namespace: clusterName,
        labels: {
            'cluster.open-cluster-management.io/type': 'aws',
        },
    },
    stringData: {
        aws_access_key_id: 'fake-aws-key-id',
        aws_secret_access_key: 'fake-aws-secret-access-key',
        baseDomain,
        pullSecret: '{"pullSecret":"secret"}',
        'ssh-privatekey': '-----BEGIN OPENSSH PRIVATE KEY-----\nkey\n-----END OPENSSH PRIVATE KEY-----',
        'ssh-publickey': 'ssh-rsa AAAAB1 fake@email.com',
    },
    type: 'Opaque',
}

const clusterImageSetAws: ClusterImageSet = {
    apiVersion: ClusterImageSetApiVersion,
    kind: ClusterImageSetKind,
    metadata: {
        name: 'ocp-release48',
    },
    spec: {
        releaseImage: 'quay.io/openshift-release-dev/ocp-release:4.8.0-fc.7-x86_64',
    },
}
const mockClusterImageSetAws = [clusterImageSetAws]

const mockMachinePoolAws: MachinePool = {
    apiVersion: MachinePoolApiVersion,
    kind: MachinePoolKind,
    metadata: {
        name: 'test-worker',
        namespace: clusterName,
    },
    spec: {
        clusterDeploymentRef: {
            name: 'test',
        },
        name: 'worker',
        platform: {
            aws: {
                rootVolume: {
                    iops: 2000,
                    size: 100,
                    type: 'io1',
                },
                type: 'm5.xlarge',
            },
        },
        replicas: 3,
    },
}

//////////////////////////////// CREATE MOCKS //////////////////////////////////////////
const mockClusterProject: ProjectRequest = {
    apiVersion: ProjectRequestApiVersion,
    kind: ProjectRequestKind,
    metadata: { name: clusterName },
}

const mockClusterProjectResponse: Project = {
    apiVersion: ProjectApiVersion,
    kind: ProjectKind,
    metadata: {
        name: clusterName,
    },
}

const mockManagedClusterAI: ManagedCluster = {
    apiVersion: 'cluster.open-cluster-management.io/v1',
    kind: 'ManagedCluster',
    metadata: {
        labels: {
            cloud: 'hybrid',
            name: 'test',
            myLabelKey: 'myValue',
        },
        name: 'test',
    },
    spec: { hubAcceptsClient: true },
}

const pullSecretAI = '{"auths":{"cloud.openshift.com":{"auth":"b3BlbSKIPPED","email":"my@email.somewhere.com"}}}'
const mockPullSecretAI = {
    apiVersion: 'v1',
    kind: 'Secret',
    metadata: {
        name: 'pullsecret-cluster-test',
        namespace: 'test',
        labels: { 'cluster.open-cluster-management.io/backup': 'cluster' },
    },
    data: {
        '.dockerconfigjson':
            'eyJhdXRocyI6eyJjbG91ZC5vcGVuc2hpZnQuY29tIjp7ImF1dGgiOiJiM0JsYlNLSVBQRUQiLCJlbWFpbCI6Im15QGVtYWlsLnNvbWV3aGVyZS5jb20ifX19',
    },
    type: 'kubernetes.io/dockerconfigjson',
}

const mockInstallConfigSecretPrivate = {
    apiVersion: 'v1',
    kind: 'Secret',
    metadata: {
        name: 'test-install-config',
        namespace: 'test',
        labels: {
            'cluster.open-cluster-management.io/backup': 'cluster',
        },
    },
    type: 'Opaque',
    data: {
        'install-config.yaml':
            'YXBpVmVyc2lvbjogdjEKbWV0YWRhdGE6CiAgbmFtZTogJ3Rlc3QnCmJhc2VEb21haW46IGJhc2UuZG9tYWluLmNvbQpjb250cm9sUGxhbmU6CiAgaHlwZXJ0aHJlYWRpbmc6IEVuYWJsZWQKICBuYW1lOiBtYXN0ZXIKICByZXBsaWNhczogMwogIHBsYXRmb3JtOgogICAgYXdzOgogICAgICByb290Vm9sdW1lOgogICAgICAgIGlvcHM6IDQwMDAKICAgICAgICBzaXplOiAxMDAKICAgICAgICB0eXBlOiBpbzEKICAgICAgdHlwZTogbTUueGxhcmdlCmNvbXB1dGU6Ci0gaHlwZXJ0aHJlYWRpbmc6IEVuYWJsZWQKICBuYW1lOiAnd29ya2VyJwogIHJlcGxpY2FzOiAzCiAgcGxhdGZvcm06CiAgICBhd3M6CiAgICAgIHJvb3RWb2x1bWU6CiAgICAgICAgaW9wczogMjAwMAogICAgICAgIHNpemU6IDEwMAogICAgICAgIHR5cGU6IGlvMQogICAgICB0eXBlOiBtNS54bGFyZ2UKbmV0d29ya2luZzoKICBuZXR3b3JrVHlwZTogT3BlblNoaWZ0U0ROCiAgY2x1c3Rlck5ldHdvcms6CiAgLSBjaWRyOiAxMC4xMjguMC4wLzE0CiAgICBob3N0UHJlZml4OiAyMwogIG1hY2hpbmVOZXR3b3JrOgogIC0gY2lkcjogMTAuMC4wLjAvMTYKICBzZXJ2aWNlTmV0d29yazoKICAtIDE3Mi4zMC4wLjAvMTYKcGxhdGZvcm06CiAgYXdzOgogICAgcmVnaW9uOiB1cy1lYXN0LTEKICAgIHN1Ym5ldHM6CiAgICAgIC0gc3VibmV0LTAyMjE2ZGQ0ZGFlN2M0NWQwCiAgICBzZXJ2aWNlRW5kcG9pbnRzOgogICAgICAtIG5hbWU6IGVuZHBvaW50LTEKICAgICAgICB1cmw6IGF3cy5lbmRwb2ludC0xLmNvbQogICAgaG9zdGVkWm9uZTogYXdzLWhvc3RlZC16b25lLmNvbQogICAgYW1pSUQ6IGFtaS0wODc2ZWFjYjM4MTkxZTkxZgpwdWJsaXNoOiBJbnRlcm5hbApwdWxsU2VjcmV0OiAiIiAjIHNraXAsIGhpdmUgd2lsbCBpbmplY3QgYmFzZWQgb24gaXQncyBzZWNyZXRzCnNzaEtleTogfC0KICAgIHNzaC1yc2EgQUFBQUIxIGZha2VAZW1haWwuY29tCg==',
    },
}

const mockPullSecretAws = {
    apiVersion: 'v1',
    kind: 'Secret',
    metadata: {
        name: 'test-pull-secret',
        namespace: 'test',
        labels: {
            'cluster.open-cluster-management.io/backup': 'cluster',
            'cluster.open-cluster-management.io/copiedFromNamespace': providerConnectionAws.metadata.namespace!,
            'cluster.open-cluster-management.io/copiedFromSecretName': providerConnectionAws.metadata.name!,
        },
    },
    stringData: {
        '.dockerconfigjson': '{"pullSecret":"secret"}',
    },
    type: 'kubernetes.io/dockerconfigjson',
}

const mockInstallConfigSecretAws = {
    apiVersion: 'v1',
    kind: 'Secret',
    metadata: {
        name: 'test-install-config',
        namespace: 'test',
        labels: {
            'cluster.open-cluster-management.io/backup': 'cluster',
        },
    },
    type: 'Opaque',
    data: {
        'install-config.yaml':
            'YXBpVmVyc2lvbjogdjEKbWV0YWRhdGE6CiAgbmFtZTogJ3Rlc3QnCmJhc2VEb21haW46IGJhc2UuZG9tYWluLmNvbQpjb250cm9sUGxhbmU6CiAgaHlwZXJ0aHJlYWRpbmc6IEVuYWJsZWQKICBuYW1lOiBtYXN0ZXIKICByZXBsaWNhczogMwogIHBsYXRmb3JtOgogICAgYXdzOgogICAgICByb290Vm9sdW1lOgogICAgICAgIGlvcHM6IDQwMDAKICAgICAgICBzaXplOiAxMDAKICAgICAgICB0eXBlOiBpbzEKICAgICAgdHlwZTogbTUueGxhcmdlCmNvbXB1dGU6Ci0gaHlwZXJ0aHJlYWRpbmc6IEVuYWJsZWQKICBuYW1lOiAnd29ya2VyJwogIHJlcGxpY2FzOiAzCiAgcGxhdGZvcm06CiAgICBhd3M6CiAgICAgIHJvb3RWb2x1bWU6CiAgICAgICAgaW9wczogMjAwMAogICAgICAgIHNpemU6IDEwMAogICAgICAgIHR5cGU6IGlvMQogICAgICB0eXBlOiBtNS54bGFyZ2UKbmV0d29ya2luZzoKICBuZXR3b3JrVHlwZTogT3BlblNoaWZ0U0ROCiAgY2x1c3Rlck5ldHdvcms6CiAgLSBjaWRyOiAxMC4xMjguMC4wLzE0CiAgICBob3N0UHJlZml4OiAyMwogIG1hY2hpbmVOZXR3b3JrOgogIC0gY2lkcjogMTAuMC4wLjAvMTYKICBzZXJ2aWNlTmV0d29yazoKICAtIDE3Mi4zMC4wLjAvMTYKcGxhdGZvcm06CiAgYXdzOgogICAgcmVnaW9uOiB1cy1lYXN0LTEKcHVsbFNlY3JldDogIiIgIyBza2lwLCBoaXZlIHdpbGwgaW5qZWN0IGJhc2VkIG9uIGl0J3Mgc2VjcmV0cwpzc2hLZXk6IHwtCiAgICBzc2gtcnNhIEFBQUFCMSBmYWtlQGVtYWlsLmNvbQo=',
    },
}

const mockProviderConnectionSecretCopiedAws = {
    apiVersion: 'v1',
    kind: 'Secret',
    metadata: {
        name: 'test-aws-creds',
        namespace: 'test',
        labels: {
            'cluster.open-cluster-management.io/backup': 'cluster',
            'cluster.open-cluster-management.io/copiedFromNamespace': providerConnectionAws.metadata.namespace!,
            'cluster.open-cluster-management.io/copiedFromSecretName': providerConnectionAws.metadata.name!,
        },
    },
    type: 'Opaque',
    stringData: {
        aws_access_key_id: 'fake-aws-key-id',
        aws_secret_access_key: 'fake-aws-secret-access-key',
    },
}

const mockKlusterletAddonConfigAI = {
    apiVersion: 'agent.open-cluster-management.io/v1',
    kind: 'KlusterletAddonConfig',
    metadata: {
        name: clusterName,
        namespace: clusterName,
    },
    spec: {
        clusterName: clusterName,
        clusterNamespace: clusterName,
        clusterLabels: {
            cloud: 'hybrid',
        },
        applicationManager: {
            enabled: true,
        },
        policyController: {
            enabled: true,
        },
        searchCollector: {
            enabled: true,
        },
        certPolicyController: {
            enabled: true,
        },
        iamPolicyController: {
            enabled: true,
        },
    },
}

///// AWS /////
const mockManagedClusterAws: ManagedCluster = {
    apiVersion: ManagedClusterApiVersion,
    kind: ManagedClusterKind,
    metadata: {
        labels: {
            cloud: 'Amazon',
            region: 'us-east-1',
            name: clusterName,
            vendor: 'OpenShift',
        },
        name: clusterName,
    },
    spec: {
        hubAcceptsClient: true,
    },
}

const mockClusterDeploymentAws = {
    apiVersion: 'hive.openshift.io/v1',
    kind: 'ClusterDeployment',
    metadata: {
        name: 'test',
        namespace: 'test',
        labels: {
            cloud: 'AWS',
            region: 'us-east-1',
            vendor: 'OpenShift',
        },
    },
    spec: {
        baseDomain,
        clusterName: 'test',
        controlPlaneConfig: {
            servingCertificates: {},
        },
        installAttemptsLimit: 1,
        installed: false,
        platform: {
            aws: {
                credentialsSecretRef: {
                    name: 'test-aws-creds',
                },
                region: 'us-east-1',
            },
        },
        provisioning: {
            installConfigSecretRef: {
                name: 'test-install-config',
            },
            sshPrivateKeySecretRef: {
                name: 'test-ssh-private-key',
            },
            imageSetRef: {
                name: 'ocp-release48',
            },
        },
        pullSecretRef: {
            name: 'test-pull-secret',
        },
    },
}

const mockClusterDeploymentAwsAnsible = {
    apiVersion: 'hive.openshift.io/v1',
    kind: 'ClusterDeployment',
    metadata: {
        name: 'test',
        namespace: 'test',
        labels: {
            cloud: 'AWS',
            region: 'us-east-1',
            vendor: 'OpenShift',
        },
    },
    spec: {
        baseDomain,
        clusterName: 'test',
        controlPlaneConfig: {
            servingCertificates: {},
        },
        installAttemptsLimit: 0,
        installed: false,
        platform: {
            aws: {
                credentialsSecretRef: {
                    name: 'test-aws-creds',
                },
                region: 'us-east-1',
            },
        },
        provisioning: {
            installConfigSecretRef: {
                name: 'test-install-config',
            },
            sshPrivateKeySecretRef: {
                name: 'test-ssh-private-key',
            },
            imageSetRef: {
                name: 'ocp-release48',
            },
        },
        pullSecretRef: {
            name: 'test-pull-secret',
        },
    },
}

const mockPrivateSecretAws = {
    apiVersion: 'v1',
    kind: 'Secret',
    metadata: {
        name: 'test-ssh-private-key',
        namespace: 'test',
        labels: {
            'cluster.open-cluster-management.io/backup': 'cluster',
            'cluster.open-cluster-management.io/copiedFromNamespace': providerConnectionAws.metadata.namespace!,
            'cluster.open-cluster-management.io/copiedFromSecretName': providerConnectionAws.metadata.name!,
        },
    },
    stringData: {
        'ssh-privatekey': '-----BEGIN OPENSSH PRIVATE KEY-----\nkey\n-----END OPENSSH PRIVATE KEY-----',
    },
    type: 'Opaque',
}

const mockKlusterletAddonSecretAws = {
    apiVersion: 'agent.open-cluster-management.io/v1',
    kind: 'KlusterletAddonConfig',
    metadata: {
        name: 'test',
        namespace: 'test',
    },
    spec: {
        clusterName: 'test',
        clusterNamespace: 'test',
        clusterLabels: {
            cloud: 'Amazon',
            vendor: 'OpenShift',
        },
        applicationManager: {
            enabled: true,
        },
        policyController: {
            enabled: true,
        },
        searchCollector: {
            enabled: true,
        },
        certPolicyController: {
            enabled: true,
        },
        iamPolicyController: {
            enabled: true,
        },
    },
}

///////////////////////////////// TESTS /////////////////////////////////////////////////////

describe('CreateCluster', () => {
    const Component = () => {
        return (
            <RecoilRoot
                initializeState={(snapshot) => {
                    snapshot.set(managedClustersState, [])
                    snapshot.set(managedClusterSetsState, [])
                    snapshot.set(secretsState, [
                        providerConnection as Secret,
                        providerConnectionAnsible as Secret,
                        providerConnectionAws as Secret,
                    ])
                    snapshot.set(clusterCuratorsState, mockClusterCurators)
                    snapshot.set(settingsState, {
                        ansibleIntegration: 'enabled',
                        singleNodeOpenshift: 'enabled',
                        awsPrivateWizardStep: 'enabled',
                    })
                }}
            >
                <MemoryRouter initialEntries={[NavigationPath.createCluster]}>
                    <Route path={NavigationPath.createCluster}>
                        <CreateClusterPage />
                    </Route>
                </MemoryRouter>
            </RecoilRoot>
        )
    }

    let consoleInfos: string[]
    const originalConsoleInfo = console.info
    const originalConsoleGroup = console.group
    const originalConsoleGroupCollapsed = console.groupCollapsed

    beforeEach(() => {
        nockIgnoreRBAC()
        consoleInfos = []
        console.info =
            console.groupCollapsed =
            console.group =
                (message?: any, ...optionalParams: any[]) => {
                    if (message) {
                        consoleInfos = [...consoleInfos, message, ...optionalParams]
                    }
                }
    })

    afterEach(() => {
        console.info = originalConsoleInfo
        console.group = originalConsoleGroup
        console.groupCollapsed = originalConsoleGroupCollapsed
    })

    test('can create AWS cluster without ansible template', async () => {
        window.scrollBy = () => {}

        const initialNocks = [nockList(clusterImageSetAws, mockClusterImageSetAws)]

        // create the form
        const { container } = render(<Component />)

        await new Promise((resolve) => setTimeout(resolve, 500))

        // step 1 -- the infrastructure
        await clickByTestId('amazon-web-services')

        // wait for tables/combos to fill in
        await waitForNocks(initialNocks)

        // connection
        await clickByPlaceholderText('Select a credential')
        //screen.debug(debug(), 2000000)
        await clickByText(providerConnectionAws.metadata.name!)
        await clickByText('Next')

        // step 2 -- the name and imageset
        await typeByTestId('eman', clusterName!)
        await typeByTestId('imageSet', clusterImageSetAws!.spec!.releaseImage!)
        container.querySelector<HTMLButtonElement>('.tf--list-box__menu-item')?.click()
        await clickByText('Next')

        // step 3 -- nodes
        await clickByText('Next')

        // step 5 -- the network
        await clickByText('Next')

        // skipping private configuration
        await clickByText('Next')

        // skipping proxy
        await clickByText('Next')

        // choose ansible template; then clear
        await clickByPlaceholderText('Select an Ansible job template')
        await clickByText(mockClusterCurators[0].metadata.name!)
        await clickByTitle('Clear selected item')
        await clickByText('Next')

        // nocks for cluster creation
        const createNocks = [
            // create aws namespace (project)
            nockCreate(mockClusterProject, mockClusterProjectResponse),

            // create the managed cluster
            nockCreate(mockManagedClusterAws),
            nockCreate(mockMachinePoolAws),
            nockCreate(mockProviderConnectionSecretCopiedAws),
            nockCreate(mockPullSecretAws),
            nockCreate(mockInstallConfigSecretAws),
            nockCreate(mockPrivateSecretAws),
            nockCreate(mockKlusterletAddonSecretAws),
            nockCreate(mockClusterDeploymentAws),
        ]

        // click create button
        await clickByText('Create')

        // expect(consoleInfos).hasNoConsoleLogs()
        await waitForText('Creating cluster ...')

        // make sure creating
        await waitForNocks(createNocks)
    })

    test('can create AWS cluster with ansible template', async () => {
        window.scrollBy = () => {}

        const initialNocks = [nockList(clusterImageSetAws, mockClusterImageSetAws)]

        // create the form
        const { container } = render(<Component />)

        await new Promise((resolve) => setTimeout(resolve, 500))

        // step 1 -- the infrastructure
        await clickByTestId('amazon-web-services')

        // wait for tables/combos to fill in
        await waitForNocks(initialNocks)

        // connection
        await clickByPlaceholderText('Select a credential')
        //screen.debug(debug(), 2000000)
        await clickByText(providerConnectionAws.metadata.name!)
        await clickByText('Next')

        // step 2 -- the name and imageset
        await typeByTestId('eman', clusterName!)
        await typeByTestId('imageSet', clusterImageSetAws!.spec!.releaseImage!)
        container.querySelector<HTMLButtonElement>('.tf--list-box__menu-item')?.click()
        await clickByText('Next')

        // step 3 -- nodes
        await clickByText('Next')

        // step 5 -- the network
        await clickByText('Next')

        // skipping private configuration
        await clickByText('Next')

        // skipping proxy
        await clickByText('Next')

        // ansible template
        await clickByPlaceholderText('Select an Ansible job template')
        await clickByText(mockClusterCurators[0].metadata.name!)
        await clickByText('Next')

        // nocks for cluster creation
        const createNocks = [
            // create aws namespace (project)
            nockCreate(mockClusterProject, mockClusterProjectResponse),

            // create the managed cluster
            nockCreate(mockManagedClusterAws),
            nockCreate(mockMachinePoolAws),
            nockCreate(mockProviderConnectionSecretCopiedAws),
            nockCreate(mockPullSecretAws),
            nockCreate(mockInstallConfigSecretAws),
            nockCreate(mockPrivateSecretAws),
            nockCreate(mockKlusterletAddonSecretAws),
            nockCreate(mockClusterDeploymentAwsAnsible),
            nockCreate(mockProviderConnectionAnsibleCopied),
            nockCreate(mockClusterCuratorInstall),
        ]

        // click create button
        await clickByText('Create')

        // expect(consoleInfos).hasNoConsoleLogs()
        await waitForText('Creating cluster ...')

        // make sure creating
        await waitForNocks(createNocks)
    })

    test('can create AWS cluster with private configuration', async () => {
        window.scrollBy = () => {}

        const initialNocks = [nockList(clusterImageSetAws, mockClusterImageSetAws)]

        // create the form
        const { container } = render(<Component />)

        await new Promise((resolve) => setTimeout(resolve, 500))

        // step 1 -- the infrastructure
        await clickByTestId('amazon-web-services')

        // wait for tables/combos to fill in
        await waitForNocks(initialNocks)

        // connection
        await clickByPlaceholderText('Select a credential')
        //screen.debug(debug(), 2000000)
        await clickByText(providerConnectionAws.metadata.name!)
        await clickByText('Next')

        // step 2 -- the name and imageset
        await typeByTestId('eman', clusterName!)
        await typeByTestId('imageSet', clusterImageSetAws!.spec!.releaseImage!)
        container.querySelector<HTMLButtonElement>('.tf--list-box__menu-item')?.click()
        await clickByText('Next')

        // step 3 -- nodes
        await clickByText('Next')

        // step 5 -- the network
        await clickByText('Next')

        // private configuration
        await clickByText('Next')
        await clickByTestId('hasPrivateConfig')
        await typeByText('Hosted zone', 'aws-hosted-zone.com')
        await typeByPlaceholderText('Enter AMI ID', 'ami-0876eacb38191e91f')
        await clickByText('Subnets')
        await typeByPlaceholderText('Enter one or more subnet IDs', 'subnet-02216dd4dae7c45d0')
        await clickByText('Service Endpoints')
        await typeByPlaceholderText('Enter AWS service endpoint name', 'endpoint-1')
        await typeByPlaceholderText('Enter AWS service endpoint URL', 'aws.endpoint-1.com')
        await clickByText('Next')

        // skipping proxy
        await clickByText('Next')

        // step 6 - integration - skipping ansible template

        // nocks for cluster creation
        const createNocks = [
            // create aws namespace (project)
            nockCreate(mockClusterProject, mockClusterProjectResponse),

            // create the managed cluster
            nockCreate(mockManagedClusterAws),
            nockCreate(mockMachinePoolAws),
            nockCreate(mockProviderConnectionSecretCopiedAws),
            nockCreate(mockPullSecretAws),
            nockCreate(mockInstallConfigSecretPrivate),
            nockCreate(mockPrivateSecretAws),
            nockCreate(mockKlusterletAddonSecretAws),
            nockCreate(mockClusterDeploymentAws),
        ]

        // click create button
        await clickByText('Create')

        await waitForText('Creating cluster ...')

        // make sure creating
        await waitForNocks(createNocks)
    })

    test.skip(
        'can create On Premise cluster',
        async () => {
            const initialNocks: Scope[] = [nockList(clusterImageSet, mockClusterImageSet)]
            render(<Component />)

            // Create On Premise cluster
            // TODO(mlibra) Add specific test case for the ai flow (start by clicking cluster.create.ai.subtitle hear instead)
            await clickByTestId('use-existing-discovered-hosts')
            await clickByText('Next')

            // wait for tables/combos to fill in
            await waitForNocks(initialNocks)

            // check integration of AI in the left-side navigation
            await waitForText('Cluster details', true)
            await waitForText('Review and save')
            await waitForText('Cluster hosts')
            await waitForText('Cluster network')
            await waitForText('Review')

            // fill-in Cluster details
            await typeByTestId('form-input-name-field', clusterName)
            await typeByTestId('form-input-baseDnsDomain-field', baseDomain)

            await clickByTestId('form-input-highAvailabilityMode-field')
            await waitForText('SNO enables you to install OpenShift using only one host.')
            await clickByTestId('form-input-highAvailabilityMode-field')

            await waitForText('OpenShift 4.8.15') // single value of combobox
            await typeByTestId('additionalLabels', 'myLabelKey=myValue')
            await clickByTestId('form-input-pullSecret-field')

            await typeByTestId('form-input-pullSecret-field', pullSecretAI)

            // transition to Automation
            await new Promise((resolve) => setTimeout(resolve, 500))
            await clickByText('Next')
            // The test is flaky here
            await new Promise((resolve) => setTimeout(resolve, 500))
            await waitForText('Ansible Automation Template')

            // skip Automation to the Review and Save step
            await clickByText('Next')
            await waitForText('Infrastructure provider credential')

            await waitForText(
                'Ensure these settings are correct. The saved cluster draft will be used to determine the available network resources. Therefore after you press Save you will not be able to change these cluster settings.'
            )

            // Let's save it
            const createNocks = [
                nockCreate(mockClusterProject, mockClusterProjectResponse),
                nockCreate(mockClusterDeploymentAI),
                nockCreate(mockManagedClusterAI),
                nockCreate(mockAgentClusterInstall),
                nockCreate(mockPullSecretAI),
                nockCreate(mockKlusterletAddonConfigAI),
            ]

            await clickByText('Save')

            // make sure creating
            await waitForNocks(createNocks)

            // next step (Hosts selection) is tested in the HostsForm.test

            // screen.debug(undefined, -1)
        },
        2 * 60 * 1000
    )

    test('can create AWS cluster without KlusterletAddonConfig on MCE', async () => {
        window.scrollBy = () => {}

        const initialNocks = [nockList(clusterImageSetAws, mockClusterImageSetAws)]

        // create the form
        const { container } = render(
            <PluginContext.Provider value={{ isACMAvailable: false }}>
                <Component />
            </PluginContext.Provider>
        )

        await new Promise((resolve) => setTimeout(resolve, 500))

        // step 1 -- the infrastructure
        await clickByTestId('amazon-web-services')

        // wait for tables/combos to fill in
        await waitForNocks(initialNocks)

        // connection
        await clickByPlaceholderText('Select a credential')
        //screen.debug(debug(), 2000000)
        await clickByText(providerConnectionAws.metadata.name!)
        await clickByText('Next')

        // step 2 -- the name and imageset
        await typeByTestId('eman', clusterName!)
        await typeByTestId('imageSet', clusterImageSetAws!.spec!.releaseImage!)
        container.querySelector<HTMLButtonElement>('.tf--list-box__menu-item')?.click()
        await clickByText('Next')

        // step 3 -- nodes
        await clickByText('Next')

        // step 5 -- the network
        await clickByText('Next')

        // skipping private configuration
        await clickByText('Next')

        // skipping proxy
        await clickByText('Next')

        // step 6 - integration - skipping ansible template
        await clickByText('Next')

        // nocks for cluster creation
        const createNocks = [
            // create aws namespace (project)
            nockCreate(mockClusterProject, mockClusterProjectResponse),

            // create the managed cluster
            nockCreate(mockManagedClusterAws),
            nockCreate(mockMachinePoolAws),
            nockCreate(mockProviderConnectionSecretCopiedAws),
            nockCreate(mockPullSecretAws),
            nockCreate(mockInstallConfigSecretAws),
            nockCreate(mockPrivateSecretAws),
            nockCreate(mockClusterDeploymentAws),
        ]

        // click create button
        await clickByText('Create')

        // expect(consoleInfos).hasNoConsoleLogs()
        await waitForText('Creating cluster ...')

        // make sure creating
        await waitForNocks(createNocks)
    })
})
