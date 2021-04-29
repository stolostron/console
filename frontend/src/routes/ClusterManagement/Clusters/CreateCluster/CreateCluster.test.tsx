/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { cloneDeep } from 'lodash'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { nockCreate, nockGet, nockList, nockPatch, nockIgnoreRBAC } from '../../../../lib/nock-util'
import {
    clickByRole,
    clickByTestId,
    typeByTestId,
    waitForNocks,
    waitForText,
    clickByText,
    clickByPlaceholderText,
} from '../../../../lib/test-util'
import { NavigationPath } from '../../../../NavigationPath'
import { BareMetalAsset, BareMetalAssetApiVersion, BareMetalAssetKind } from '../../../../resources/bare-metal-asset'
import {
    ClusterImageSet,
    ClusterImageSetApiVersion,
    ClusterImageSetKind,
} from '../../../../resources/cluster-image-set'
import { ManagedCluster, ManagedClusterApiVersion, ManagedClusterKind } from '../../../../resources/managed-cluster'
import { ManagedClusterInfoApiVersion, ManagedClusterInfoKind } from '../../../../resources/managed-cluster-info'
import {
    Project,
    ProjectApiVersion,
    ProjectKind,
    ProjectRequest,
    ProjectRequestApiVersion,
    ProjectRequestKind,
} from '../../../../resources/project'
import {
    packProviderConnection,
    ProviderConnection,
    ProviderConnectionApiVersion,
    ProviderConnectionKind,
} from '../../../../resources/provider-connection'
import { Secret, SecretApiVersion, SecretKind } from '../../../../resources/secret'
import CreateClusterPage from './CreateCluster'
import { managedClusterSetsState } from '../../../../atoms'

const clusterName = 'test'
const bmaProjectNamespace = 'test-bare-metal-asset-namespace'

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

const providerConnection: ProviderConnection = {
    apiVersion: ProviderConnectionApiVersion,
    kind: ProviderConnectionKind,
    metadata: {
        name: 'connection',
        namespace: clusterName,
        labels: {
            'cluster.open-cluster-management.io/provider': 'bmc',
        },
    },
    spec: {
        libvirtURI: 'qemu+ssh://libvirtURI',
        sshKnownHosts: ['sshKnownHosts'],
        imageMirror: 'image.mirror:123/abc',
        bootstrapOSImage: 'bootstrapOSImage',
        clusterOSImage: 'clusterOSImage',
        additionalTrustBundle: '-----BEGIN CERTIFICATE-----\ncertdata\n-----END CERTIFICATE-----',
        baseDomain: 'base.domain',
        pullSecret: '{"pullSecret":"secret"}',
        sshPrivatekey: '-----BEGIN OPENSSH PRIVATE KEY-----\nkey\n-----END OPENSSH PRIVATE KEY-----',
        sshPublickey: 'ssh-rsa AAAAB1 fake@email.com',
    },
}
const mockProviderConnection = [packProviderConnection({ ...providerConnection })]

const bareMetalAsset: BareMetalAsset = {
    apiVersion: BareMetalAssetApiVersion,
    kind: BareMetalAssetKind,
    metadata: {
        name: 'test-bare-metal-asset-001',
        namespace: bmaProjectNamespace,
    },
    spec: {
        bmc: {
            address: 'example.com:80',
            credentialsName: 'secret-test-bare-metal-asset',
        },
        bootMACAddress: '00:90:7F:12:DE:7F',
    },
}
const mockBareMetalAssets = Array.from({ length: 5 }, (val, inx) => {
    const mockedBma = cloneDeep(bareMetalAsset)
    mockedBma.metadata.uid = `uid-${inx}`
    mockedBma.metadata.name = `test-bare-metal-asset-${inx}`
    mockedBma!.spec!.bmc.credentialsName = `secret-test-bare-metal-asset-${inx}`
    return mockedBma
})

const bmaSecret: Secret = {
    kind: SecretKind,
    apiVersion: SecretApiVersion,
    metadata: {
        name: 'test-bma-bmc-secret',
        namespace: 'test-bare-metal-asset-namespace',
    },
    data: { password: btoa('test'), username: btoa('test') },
}

const mockBareMetalSecrets = Array.from({ length: 5 }, (val, inx) => {
    const mockedSecret = cloneDeep(bmaSecret)
    mockedSecret.metadata.name = `secret-test-bare-metal-asset-${inx}`
    return mockedSecret
})

//////////////////////////////// CREATE MOCKS //////////////////////////////////////////
const mockBareMetalAssets2 = Array.from({ length: 4 }, (val, inx) => {
    const mockedBma = cloneDeep(bareMetalAsset)
    mockedBma.metadata.name = `test-bare-metal-asset-${inx}`
    mockedBma!.spec!.bmc.credentialsName = `secret-test-bare-metal-asset-${inx}`
    return mockedBma
})

const mockBmaProject: ProjectRequest = {
    apiVersion: ProjectRequestApiVersion,
    kind: ProjectRequestKind,
    metadata: { name: bmaProjectNamespace },
}

const mockBmaProjectResponse: Project = {
    apiVersion: ProjectApiVersion,
    kind: ProjectKind,
    metadata: {
        name: bmaProjectNamespace,
    },
}

const mockBareMetalAssets3 = Array.from({ length: 1 }, (val, inx) => {
    const mockedBma = cloneDeep(bareMetalAsset)
    mockedBma!.spec!.role = 'worker'
    mockedBma.metadata.name = `test-bare-metal-asset-${inx + 4}`
    mockedBma!.spec!.bmc.credentialsName = `test-bare-metal-asset-${inx + 4}-bmc-secret`
    return mockedBma
})

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

const mockManagedCluster: ManagedCluster = {
    apiVersion: ManagedClusterApiVersion,
    kind: ManagedClusterKind,
    metadata: {
        labels: {
            cloud: 'Bare-Metal',
            name: clusterName,
            vendor: 'OpenShift',
        },
        name: clusterName,
    },
    spec: {
        hubAcceptsClient: true,
    },
}

const mockPullSecret = {
    apiVersion: 'v1',
    kind: 'Secret',
    metadata: {
        name: 'test-pull-secret',
        namespace: 'test',
    },
    stringData: {
        '.dockerconfigjson': '{"pullSecret":"secret"}',
    },
    type: 'kubernetes.io/dockerconfigjson',
}

const mockInstallConfigSecret = {
    apiVersion: 'v1',
    kind: 'Secret',
    metadata: {
        name: 'test-install-config',
        namespace: 'test',
    },
    type: 'Opaque',
    data: {
        'install-config.yaml':
            'YXBpVmVyc2lvbjogdjEKbWV0YWRhdGE6CiAgbmFtZTogdGVzdApiYXNlRG9tYWluOiBiYXNlLmRvbWFpbgpjb250cm9sUGxhbmU6CiAgbmFtZTogbWFzdGVyCiAgcmVwbGljYXM6IDMKICBwbGF0Zm9ybToKICAgIGJhcmVtZXRhbDoge30KY29tcHV0ZToKICAtIG5hbWU6IHdvcmtlcgogICAgcmVwbGljYXM6IDIKbmV0d29ya2luZzoKICBuZXR3b3JrVHlwZTogT3BlblNoaWZ0U0ROCiAgY2x1c3Rlck5ldHdvcms6CiAgICAtIGNpZHI6IDEwLjEyOC4wLjAvMTQKICAgICAgaG9zdFByZWZpeDogMjMKICBtYWNoaW5lTmV0d29yazoKICAgIC0gY2lkcjogMTAuMC4wLjAvMTYKICBzZXJ2aWNlTmV0d29yazoKICAgIC0gMTcyLjMwLjAuMC8xNgpwbGF0Zm9ybToKICBiYXJlbWV0YWw6CiAgICBsaWJ2aXJ0VVJJOiAncWVtdStzc2g6Ly9saWJ2aXJ0VVJJJwogICAgcHJvdmlzaW9uaW5nTmV0d29ya0NJRFI6IDEwLjQuNS4zCiAgICBwcm92aXNpb25pbmdOZXR3b3JrSW50ZXJmYWNlOiBlbnAxczAKICAgIHByb3Zpc2lvbmluZ0JyaWRnZTogcHJvdmlzaW9uaW5nCiAgICBleHRlcm5hbEJyaWRnZTogYmFyZW1ldGFsCiAgICBhcGlWSVA6IG51bGwKICAgIGluZ3Jlc3NWSVA6IG51bGwKICAgIGJvb3RzdHJhcE9TSW1hZ2U6IGJvb3RzdHJhcE9TSW1hZ2UKICAgIGNsdXN0ZXJPU0ltYWdlOiBjbHVzdGVyT1NJbWFnZQogICAgaG9zdHM6CiAgICAgIC0gbmFtZTogdGVzdC1iYXJlLW1ldGFsLWFzc2V0LTAKICAgICAgICBuYW1lc3BhY2U6IHRlc3QtYmFyZS1tZXRhbC1hc3NldC1uYW1lc3BhY2UKICAgICAgICByb2xlOiBtYXN0ZXIKICAgICAgICBibWM6CiAgICAgICAgICBhZGRyZXNzOiAnZXhhbXBsZS5jb206ODAnCiAgICAgICAgICBkaXNhYmxlQ2VydGlmaWNhdGVWZXJpZmljYXRpb246IHRydWUKICAgICAgICAgIHVzZXJuYW1lOiB0ZXN0CiAgICAgICAgICBwYXNzd29yZDogdGVzdAogICAgICAgIGJvb3RNQUNBZGRyZXNzOiAnMDA6OTA6N0Y6MTI6REU6N0YnCiAgICAgICAgaGFyZHdhcmVQcm9maWxlOiBkZWZhdWx0CiAgICAgIC0gbmFtZTogdGVzdC1iYXJlLW1ldGFsLWFzc2V0LTEKICAgICAgICBuYW1lc3BhY2U6IHRlc3QtYmFyZS1tZXRhbC1hc3NldC1uYW1lc3BhY2UKICAgICAgICByb2xlOiBtYXN0ZXIKICAgICAgICBibWM6CiAgICAgICAgICBhZGRyZXNzOiAnZXhhbXBsZS5jb206ODAnCiAgICAgICAgICBkaXNhYmxlQ2VydGlmaWNhdGVWZXJpZmljYXRpb246IHRydWUKICAgICAgICAgIHVzZXJuYW1lOiB0ZXN0CiAgICAgICAgICBwYXNzd29yZDogdGVzdAogICAgICAgIGJvb3RNQUNBZGRyZXNzOiAnMDA6OTA6N0Y6MTI6REU6N0YnCiAgICAgICAgaGFyZHdhcmVQcm9maWxlOiBkZWZhdWx0CiAgICAgIC0gbmFtZTogdGVzdC1iYXJlLW1ldGFsLWFzc2V0LTIKICAgICAgICBuYW1lc3BhY2U6IHRlc3QtYmFyZS1tZXRhbC1hc3NldC1uYW1lc3BhY2UKICAgICAgICByb2xlOiBtYXN0ZXIKICAgICAgICBibWM6CiAgICAgICAgICBhZGRyZXNzOiAnZXhhbXBsZS5jb206ODAnCiAgICAgICAgICBkaXNhYmxlQ2VydGlmaWNhdGVWZXJpZmljYXRpb246IHRydWUKICAgICAgICAgIHVzZXJuYW1lOiB0ZXN0CiAgICAgICAgICBwYXNzd29yZDogdGVzdAogICAgICAgIGJvb3RNQUNBZGRyZXNzOiAnMDA6OTA6N0Y6MTI6REU6N0YnCiAgICAgICAgaGFyZHdhcmVQcm9maWxlOiBkZWZhdWx0CiAgICAgIC0gbmFtZTogdGVzdC1iYXJlLW1ldGFsLWFzc2V0LTMKICAgICAgICBuYW1lc3BhY2U6IHRlc3QtYmFyZS1tZXRhbC1hc3NldC1uYW1lc3BhY2UKICAgICAgICByb2xlOiB3b3JrZXIKICAgICAgICBibWM6CiAgICAgICAgICBhZGRyZXNzOiAnZXhhbXBsZS5jb206ODAnCiAgICAgICAgICBkaXNhYmxlQ2VydGlmaWNhdGVWZXJpZmljYXRpb246IHRydWUKICAgICAgICAgIHVzZXJuYW1lOiB0ZXN0CiAgICAgICAgICBwYXNzd29yZDogdGVzdAogICAgICAgIGJvb3RNQUNBZGRyZXNzOiAnMDA6OTA6N0Y6MTI6REU6N0YnCiAgICAgICAgaGFyZHdhcmVQcm9maWxlOiBkZWZhdWx0CiAgICAgIC0gbmFtZTogdGVzdC1iYXJlLW1ldGFsLWFzc2V0LTQKICAgICAgICBuYW1lc3BhY2U6IHRlc3QtYmFyZS1tZXRhbC1hc3NldC1uYW1lc3BhY2UKICAgICAgICByb2xlOiB3b3JrZXIKICAgICAgICBibWM6CiAgICAgICAgICBhZGRyZXNzOiAnZXhhbXBsZS5jb206ODAnCiAgICAgICAgICBkaXNhYmxlQ2VydGlmaWNhdGVWZXJpZmljYXRpb246IHRydWUKICAgICAgICAgIHVzZXJuYW1lOiBudWxsCiAgICAgICAgICBwYXNzd29yZDogbnVsbAogICAgICAgIGJvb3RNQUNBZGRyZXNzOiAnMDA6OTA6N0Y6MTI6REU6N0YnCiAgICAgICAgaGFyZHdhcmVQcm9maWxlOiBkZWZhdWx0CnB1bGxTZWNyZXQ6ICcnCnNzaEtleTogc3NoLXJzYSBBQUFBQjEgZmFrZUBlbWFpbC5jb20KYWRkaXRpb25hbFRydXN0QnVuZGxlOiB8LQogIC0tLS0tQkVHSU4gQ0VSVElGSUNBVEUtLS0tLQogIGNlcnRkYXRhCiAgLS0tLS1FTkQgQ0VSVElGSUNBVEUtLS0tLQppbWFnZUNvbnRlbnRTb3VyY2VzOgogIC0gbWlycm9yczoKICAgICAgLSAnaW1hZ2UubWlycm9yOjEyMy9hYmMnCiAgICBzb3VyY2U6IHF1YXkuaW8vb3BlbnNoaWZ0LXJlbGVhc2UtZGV2L29jcC1yZWxlYXNlLW5pZ2h0bHkKICAtIG1pcnJvcnM6CiAgICAgIC0gJ2ltYWdlLm1pcnJvcjoxMjMvYWJjJwogICAgc291cmNlOiBxdWF5LmlvL29wZW5zaGlmdC1yZWxlYXNlLWRldi9vY3AtcmVsZWFzZQogIC0gbWlycm9yczoKICAgICAgLSAnaW1hZ2UubWlycm9yOjEyMy9hYmMnCiAgICBzb3VyY2U6IHF1YXkuaW8vb3BlbnNoaWZ0LXJlbGVhc2UtZGV2L29jcC12NC4wLWFydC1kZXYK',
    },
}

const mockPrivateSecret = {
    apiVersion: 'v1',
    kind: 'Secret',
    metadata: {
        name: 'test-ssh-private-key',
        namespace: 'test',
    },
    stringData: {
        'ssh-privatekey': '-----BEGIN OPENSSH PRIVATE KEY-----\nkey\n-----END OPENSSH PRIVATE KEY-----',
    },
    type: 'Opaque',
}

const mockKlusterletAddonSecret = {
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
            cloud: 'Bare-Metal',
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

const mockClusterDeployment = {
    apiVersion: 'hive.openshift.io/v1',
    kind: 'ClusterDeployment',
    metadata: {
        name: 'test',
        namespace: 'test',
        labels: {
            cloud: 'BMC',
            vendor: 'OpenShift',
        },
        annotations: {
            'hive.openshift.io/try-install-once': 'true',
        },
    },
    spec: {
        baseDomain: 'base.domain',
        clusterName: 'test',
        controlPlaneConfig: {
            servingCertificates: {},
        },
        installAttemptsLimit: 1,
        installed: false,
        platform: {
            baremetal: {
                libvirtSSHPrivateKeySecretRef: {
                    name: 'test-ssh-private-key',
                },
                hosts: [
                    {
                        name: 'test-bare-metal-asset-0',
                        namespace: 'test-bare-metal-asset-namespace',
                        role: 'master',
                        bmc: {
                            address: 'example.com:80',
                            disableCertificateVerification: true,
                            username: 'test',
                            password: 'test',
                        },
                        bootMACAddress: '00:90:7F:12:DE:7F',
                        hardwareProfile: 'default',
                    },
                    {
                        name: 'test-bare-metal-asset-1',
                        namespace: 'test-bare-metal-asset-namespace',
                        role: 'master',
                        bmc: {
                            address: 'example.com:80',
                            disableCertificateVerification: true,
                            username: 'test',
                            password: 'test',
                        },
                        bootMACAddress: '00:90:7F:12:DE:7F',
                        hardwareProfile: 'default',
                    },
                    {
                        name: 'test-bare-metal-asset-2',
                        namespace: 'test-bare-metal-asset-namespace',
                        role: 'master',
                        bmc: {
                            address: 'example.com:80',
                            disableCertificateVerification: true,
                            username: 'test',
                            password: 'test',
                        },
                        bootMACAddress: '00:90:7F:12:DE:7F',
                        hardwareProfile: 'default',
                    },
                    {
                        name: 'test-bare-metal-asset-3',
                        namespace: 'test-bare-metal-asset-namespace',
                        role: 'worker',
                        bmc: {
                            address: 'example.com:80',
                            disableCertificateVerification: true,
                            username: 'test',
                            password: 'test',
                        },
                        bootMACAddress: '00:90:7F:12:DE:7F',
                        hardwareProfile: 'default',
                    },
                    {
                        name: 'test-bare-metal-asset-4',
                        namespace: 'test-bare-metal-asset-namespace',
                        role: 'worker',
                        bmc: {
                            address: 'example.com:80',
                            disableCertificateVerification: true,
                            username: null,
                            password: null,
                        },
                        bootMACAddress: '00:90:7F:12:DE:7F',
                        hardwareProfile: 'default',
                    },
                ],
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
                name: 'ocp-release43',
            },
            sshKnownHosts: ['sshKnownHosts'],
        },
        pullSecretRef: {
            name: 'test-pull-secret',
        },
    },
}

const patchBareMetalAssetReq: BareMetalAsset = {
    kind: 'BareMetalAsset',
    apiVersion: 'inventory.open-cluster-management.io/v1alpha1',
    metadata: {
        name: 'test-bare-metal-asset-0',
        namespace: 'test-bare-metal-asset-namespace',
    },
    spec: {
        bmc: {
            address: 'example.com:80/patched',
            credentialsName: 'test-bma-bmc-secret',
        },
        bootMACAddress: '00:90:7F:12:DE:7F',
    },
}

const mockPatchBareMetalReq = Array.from({ length: 5 }, (val, inx) => {
    const mockedPatchBareMetalAsset = cloneDeep(patchBareMetalAssetReq)
    mockedPatchBareMetalAsset.metadata.name = `test-bare-metal-asset-${inx}`
    return mockedPatchBareMetalAsset
})

const patchBareMetalAssetMasterRes = {
    spec: {
        role: 'master',
        clusterDeployment: {
            name: 'test',
            namespace: 'test',
        },
    },
}

const patchBareMetalAssetWorkerRes = {
    spec: {
        role: 'worker',
        clusterDeployment: {
            name: 'test',
            namespace: 'test',
        },
    },
}

///////////////////////////////// TESTS /////////////////////////////////////////////////////

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
    withTranslation: () => (Component: any) => {
        Component.defaultProps = { ...Component.defaultProps, t: () => '' }
        return Component
    },
}))

describe('CreateCluster', () => {
    const Component = () => {
        return (
            <RecoilRoot
                initializeState={(snapshot) => {
                    snapshot.set(managedClusterSetsState, [])
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
        console.info = console.groupCollapsed = console.group = (message?: any, ...optionalParams: any[]) => {
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

    test('can create bare metal cluster', async () => {
        window.scrollBy = () => {}

        const initialNocks = [
            nockList(clusterImageSet, mockClusterImageSet),
            nockList(providerConnection, mockProviderConnection, [
                'cluster.open-cluster-management.io/cloudconnection=',
            ]),
            nockList(bareMetalAsset, mockBareMetalAssets),
        ]

        // create the form
        const { container } = render(<Component />)

        await new Promise((resolve) => setTimeout(resolve, 500))

        // start filling in the form
        await typeByTestId('eman', clusterName!)
        await clickByTestId('cluster.create.baremetal.subtitle')

        // wait for tables/combos to fill in
        await waitForNocks(initialNocks)

        // finish the form
        await typeByTestId('imageSet', clusterImageSet!.spec!.releaseImage!)
        container.querySelector<HTMLButtonElement>('.pf-c-select__toggle')?.click()
        await clickByRole('option', 0)

        await clickByPlaceholderText('creation.ocp.cloud.select.connection')
        await clickByText(mockProviderConnection[0].metadata.name!)

        const checkAll = container.querySelector('[name="check-all"]')
        if (checkAll) {
            userEvent.click(checkAll)
        }
        await typeByTestId('provisioningNetworkCIDR', '10.4.5.3')

        // nocks for cluster creation
        const createNocks = [
            // list only 4 bmas so that one is created
            // creates 1 less bmas so that backend creates that 1
            nockList(bareMetalAsset, mockBareMetalAssets2),

            // create bma namespace
            nockCreate(mockBmaProject, mockBmaProjectResponse),

            // create bmas/secrets
            nockCreate(mockBareMetalAssets3[0]),
            nockGet(mockBareMetalSecrets[0]),
            nockGet(mockBareMetalSecrets[1]),
            nockGet(mockBareMetalSecrets[2]),
            nockGet(mockBareMetalSecrets[3]),

            // list no clusters so that creating this cluster doesn't think it already exists
            nockList({ apiVersion: ManagedClusterInfoApiVersion, kind: ManagedClusterInfoKind }, [], undefined, {
                managedNamespacesOnly: '',
            }),

            // create the cluster's namespace (project)
            nockCreate(mockClusterProject, mockClusterProjectResponse),

            // create the managed cluster
            nockCreate(mockManagedCluster),
            nockCreate(mockPullSecret),
            nockCreate(mockInstallConfigSecret),
            nockCreate(mockPrivateSecret),
            nockCreate(mockKlusterletAddonSecret),
            nockCreate(mockClusterDeployment),

            // assigns cluster name to bmas
            nockPatch(mockPatchBareMetalReq[0], patchBareMetalAssetMasterRes),
            nockPatch(mockPatchBareMetalReq[1], patchBareMetalAssetMasterRes),
            nockPatch(mockPatchBareMetalReq[2], patchBareMetalAssetMasterRes),
            nockPatch(mockPatchBareMetalReq[3], patchBareMetalAssetWorkerRes),
            nockPatch(mockPatchBareMetalReq[4], patchBareMetalAssetWorkerRes),
        ]

        // click create button
        await clickByTestId('create-button-portal-id-btn')

        expect(consoleInfos).hasNoConsoleLogs()
        await waitForText('success.create.creating')

        // make sure creating
        await waitForNocks(createNocks)

        await waitForText('success.create.created')
    })
})
