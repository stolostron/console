import React from 'react'
import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route } from 'react-router-dom'
import { NavigationPath } from '../../../../NavigationPath'
import CreateClusterPage from './CreateCluster'

import { nockList, nockGet, nockPatch, nockOptions, nockCreate } from '../../../../lib/nock-util'
import {
    Project,
    ProjectApiVersion,
    ProjectKind,
    ProjectRequest,
    ProjectRequestApiVersion,
    ProjectRequestKind,
} from '../../../../resources/project'
import { ManagedClusterInfoApiVersion, ManagedClusterInfoKind } from '../../../../resources/managed-cluster-info'
import { ManagedCluster, ManagedClusterApiVersion, ManagedClusterKind } from '../../../../resources/managed-cluster'
import { BareMetalAsset, BareMetalAssetApiVersion, BareMetalAssetKind } from '../../../../resources/bare-metal-asset'
import {
    ClusterImageSet,
    ClusterImageSetApiVersion,
    ClusterImageSetKind,
} from '../../../../resources/cluster-image-set'
import {
    ProviderConnection,
    ProviderConnectionApiVersion,
    ProviderConnectionKind,
    packProviderConnection,
} from '../../../../resources/provider-connection'
import { Secret, SecretApiVersion, SecretKind } from '../../../../resources/secret'

import { cloneDeep } from 'lodash'

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
        releaseImage: 'quay.io/openshift-release-dev/ocp-release:4.3.40-x86_64',
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
    mockedBma.metadata.name = `test-bare-metal-asset-${inx}`
    mockedBma.spec.bmc.credentialsName = `secret-test-bare-metal-asset-${inx}`
    return mockedBma
})

const bmaSecret: Secret = {
    kind: SecretKind,
    apiVersion: SecretApiVersion,
    metadata: {
        name: 'test-bma-bmc-secret',
        namespace: 'test-bare-metal-asset-namespace',
    },
    data: { password: btoa('pass'), username: btoa('user') },
}

const bmaSecretRes: Secret = {
    kind: SecretKind,
    apiVersion: SecretApiVersion,
    metadata: {
        namespace: 'test-bare-metal-asset-namespace',
        name: 'test-bma-bmc-secret',
    },
    data: { password: btoa('pass'), username: btoa('user') },
}

const mockBareMetalSecrets = Array.from({ length: 5 }, (val, inx) => {
    const mockedSecret = cloneDeep(bmaSecret)
    mockedSecret.metadata.name = `secret-test-bare-metal-asset-${inx}`
    return mockedSecret
})

//////////////////////////////// CREATE MOCKS //////////////////////////////////////////
const mockBareMetalAssets2 = Array.from({ length: 3 }, (val, inx) => {
    const mockedBma = cloneDeep(bareMetalAsset)
    mockedBma.metadata.name = `test-bare-metal-asset-${inx}`
    mockedBma.spec.bmc.credentialsName = `secret-test-bare-metal-asset-${inx}`
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

const mockBareMetalAssets3 = Array.from({ length: 2 }, (val, inx) => {
    const mockedBma = cloneDeep(bareMetalAsset)
    mockedBma.metadata.name = `test-bare-metal-asset-${inx + 3}`
    mockedBma.spec.bmc.credentialsName = `test-bare-metal-asset-${inx + 3}-bmc-secret`
    return mockedBma
})

const createBmaSecretReq = Array.from({ length: 2 }, (val, inx) => {
    const mockedSecret = cloneDeep(bmaSecret)
    mockedSecret.metadata.name = `test-bare-metal-asset-${inx + 3}-bmc-secret`
    delete mockedSecret.data
    mockedSecret.stringData = { password: 'pass', username: 'user' }
    return mockedSecret
})

const createBmaSecretRes = Array.from({ length: 2 }, (val, inx) => {
    const mockedSecret = cloneDeep(bmaSecretRes)
    mockedSecret.metadata.name = `test-bare-metal-asset-${inx + 3}-bmc-secret`
    mockedSecret.data = { password: 'encoded', username: 'encoded' }
    return mockedSecret
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
            'YXBpVmVyc2lvbjogdjEKbWV0YWRhdGE6CiAgbmFtZTogdGVzdApiYXNlRG9tYWluOiBiYXNlLmRvbWFpbgpjb250cm9sUGxhbmU6CiAgbmFtZTogbWFzdGVyCiAgcmVwbGljYXM6IDMKICBwbGF0Zm9ybToKICAgIGJhcmVtZXRhbDoge30KY29tcHV0ZToKLSBuYW1lOiB3b3JrZXIKICByZXBsaWNhczogMgpuZXR3b3JraW5nOgogIGNsdXN0ZXJOZXR3b3JrOgogIC0gY2lkcjogMTAuMTI4LjAuMC8xNAogICAgaG9zdFByZWZpeDogMjMKICBtYWNoaW5lQ0lEUjogMTAuMC4wLjAvMTYKICBuZXR3b3JrVHlwZTogT3BlblNoaWZ0U0ROCiAgc2VydmljZU5ldHdvcms6CiAgLSAxNzIuMzAuMC4wLzE2CnBsYXRmb3JtOgogIGJhcmVtZXRhbDoKICAgIGxpYnZpcnRVUkk6IHFlbXUrc3NoOi8vbGlidmlydFVSSQogICAgcHJvdmlzaW9uaW5nTmV0d29ya0NJRFI6IDEwLjQuNS4zCiAgICBwcm92aXNpb25pbmdOZXR3b3JrSW50ZXJmYWNlOiBlbnAxczAKICAgIHByb3Zpc2lvbmluZ0JyaWRnZTogcHJvdmlzaW9uaW5nCiAgICBleHRlcm5hbEJyaWRnZTogYmFyZW1ldGFsCiAgICBkbnNWSVA6IDEwLjAuMC4zCiAgICBhcGlWSVA6CiAgICBpbmdyZXNzVklQOgogICAgYm9vdHN0cmFwT1NJbWFnZTogPi0KICAgICAgYm9vdHN0cmFwT1NJbWFnZQogICAgY2x1c3Rlck9TSW1hZ2U6ID4tCiAgICAgIGNsdXN0ZXJPU0ltYWdlCiAgICBob3N0czoKICAgICAgLSBuYW1lOiB0ZXN0LWJhcmUtbWV0YWwtYXNzZXQtMAogICAgICAgIG5hbWVzcGFjZTogdGVzdC1iYXJlLW1ldGFsLWFzc2V0LW5hbWVzcGFjZQogICAgICAgIHJvbGU6IG1hc3RlcgogICAgICAgIGJtYzoKICAgICAgICAgIGFkZHJlc3M6ICdleGFtcGxlLmNvbTo4MCcKICAgICAgICAgIGRpc2FibGVDZXJ0aWZpY2F0ZVZlcmlmaWNhdGlvbjogdHJ1ZQogICAgICAgICAgdXNlcm5hbWU6IHVzZXIKICAgICAgICAgIHBhc3N3b3JkOiBwYXNzCiAgICAgICAgYm9vdE1BQ0FkZHJlc3M6IDAwOjkwOjdGOjEyOkRFOjdGCiAgICAgICAgaGFyZHdhcmVQcm9maWxlOiBkZWZhdWx0CiAgICAgIC0gbmFtZTogdGVzdC1iYXJlLW1ldGFsLWFzc2V0LTEKICAgICAgICBuYW1lc3BhY2U6IHRlc3QtYmFyZS1tZXRhbC1hc3NldC1uYW1lc3BhY2UKICAgICAgICByb2xlOiBtYXN0ZXIKICAgICAgICBibWM6CiAgICAgICAgICBhZGRyZXNzOiAnZXhhbXBsZS5jb206ODAnCiAgICAgICAgICBkaXNhYmxlQ2VydGlmaWNhdGVWZXJpZmljYXRpb246IHRydWUKICAgICAgICAgIHVzZXJuYW1lOiB1c2VyCiAgICAgICAgICBwYXNzd29yZDogcGFzcwogICAgICAgIGJvb3RNQUNBZGRyZXNzOiAwMDo5MDo3RjoxMjpERTo3RgogICAgICAgIGhhcmR3YXJlUHJvZmlsZTogZGVmYXVsdAogICAgICAtIG5hbWU6IHRlc3QtYmFyZS1tZXRhbC1hc3NldC0yCiAgICAgICAgbmFtZXNwYWNlOiB0ZXN0LWJhcmUtbWV0YWwtYXNzZXQtbmFtZXNwYWNlCiAgICAgICAgcm9sZTogbWFzdGVyCiAgICAgICAgYm1jOgogICAgICAgICAgYWRkcmVzczogJ2V4YW1wbGUuY29tOjgwJwogICAgICAgICAgZGlzYWJsZUNlcnRpZmljYXRlVmVyaWZpY2F0aW9uOiB0cnVlCiAgICAgICAgICB1c2VybmFtZTogdXNlcgogICAgICAgICAgcGFzc3dvcmQ6IHBhc3MKICAgICAgICBib290TUFDQWRkcmVzczogMDA6OTA6N0Y6MTI6REU6N0YKICAgICAgICBoYXJkd2FyZVByb2ZpbGU6IGRlZmF1bHQKICAgICAgLSBuYW1lOiB0ZXN0LWJhcmUtbWV0YWwtYXNzZXQtMwogICAgICAgIG5hbWVzcGFjZTogdGVzdC1iYXJlLW1ldGFsLWFzc2V0LW5hbWVzcGFjZQogICAgICAgIHJvbGU6IHdvcmtlcgogICAgICAgIGJtYzoKICAgICAgICAgIGFkZHJlc3M6ICdleGFtcGxlLmNvbTo4MCcKICAgICAgICAgIGRpc2FibGVDZXJ0aWZpY2F0ZVZlcmlmaWNhdGlvbjogdHJ1ZQogICAgICAgICAgdXNlcm5hbWU6IHVzZXIKICAgICAgICAgIHBhc3N3b3JkOiBwYXNzCiAgICAgICAgYm9vdE1BQ0FkZHJlc3M6IDAwOjkwOjdGOjEyOkRFOjdGCiAgICAgICAgaGFyZHdhcmVQcm9maWxlOiBkZWZhdWx0CiAgICAgIC0gbmFtZTogdGVzdC1iYXJlLW1ldGFsLWFzc2V0LTQKICAgICAgICBuYW1lc3BhY2U6IHRlc3QtYmFyZS1tZXRhbC1hc3NldC1uYW1lc3BhY2UKICAgICAgICByb2xlOiB3b3JrZXIKICAgICAgICBibWM6CiAgICAgICAgICBhZGRyZXNzOiAnZXhhbXBsZS5jb206ODAnCiAgICAgICAgICBkaXNhYmxlQ2VydGlmaWNhdGVWZXJpZmljYXRpb246IHRydWUKICAgICAgICAgIHVzZXJuYW1lOiB1c2VyCiAgICAgICAgICBwYXNzd29yZDogcGFzcwogICAgICAgIGJvb3RNQUNBZGRyZXNzOiAwMDo5MDo3RjoxMjpERTo3RgogICAgICAgIGhhcmR3YXJlUHJvZmlsZTogZGVmYXVsdApwdWxsU2VjcmV0OiAiIiAjIHNraXAsIGhpdmUgd2lsbCBpbmplY3QgYmFzZWQgb24gaXQncyBzZWNyZXRzCnNzaEtleTogfC0KICAgIHNzaC1yc2EgQUFBQUIxIGZha2VAZW1haWwuY29tCmFkZGl0aW9uYWxUcnVzdEJ1bmRsZTogfC0KICAgIC0tLS0tQkVHSU4gQ0VSVElGSUNBVEUtLS0tLQogICAgY2VydGRhdGEKICAgIC0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0KaW1hZ2VDb250ZW50U291cmNlczoKLSBtaXJyb3JzOgogIC0gaW1hZ2UubWlycm9yOjEyMy9hYmMKICBzb3VyY2U6IHF1YXkuaW8vb3BlbnNoaWZ0LXJlbGVhc2UtZGV2L29jcC1yZWxlYXNlLW5pZ2h0bHkKLSBtaXJyb3JzOgogIC0gaW1hZ2UubWlycm9yOjEyMy9hYmMKICBzb3VyY2U6IHF1YXkuaW8vb3BlbnNoaWZ0LXJlbGVhc2UtZGV2L29jcC1yZWxlYXNlCi0gbWlycm9yczoKICAtIGltYWdlLm1pcnJvcjoxMjMvYWJjCiAgc291cmNlOiBxdWF5LmlvL29wZW5zaGlmdC1yZWxlYXNlLWRldi9vY3AtdjQuMC1hcnQtZGV2Cg==',
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
        version: '2.2.0',
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
        installAttemptsLimit: 2,
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
                            username: 'user',
                            password: 'pass',
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
                            username: 'user',
                            password: 'pass',
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
                            username: 'user',
                            password: 'pass',
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
                            username: 'user',
                            password: 'pass',
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
                            username: 'user',
                            password: 'pass',
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
            <MemoryRouter initialEntries={[NavigationPath.createCluster]}>
                <Route path={NavigationPath.createCluster}>
                    <CreateClusterPage />
                </Route>
            </MemoryRouter>
        )
    }

    test('can create bare metal cluster', async () => {
        // simulated resources
        const listImageSetsNock = nockList(clusterImageSet, mockClusterImageSet)
        const listConnections = nockList(providerConnection, mockProviderConnection, [
            'cluster.open-cluster-management.io/cloudconnection=',
        ])
        window.scrollBy = () => {}
        const listHosts = nockList(bareMetalAsset, mockBareMetalAssets)
        const getSecret0 = nockGet(mockBareMetalSecrets[0])
        const getSecret1 = nockGet(mockBareMetalSecrets[1])
        const getSecret2 = nockGet(mockBareMetalSecrets[2])
        const getSecret3 = nockGet(mockBareMetalSecrets[3])
        const getSecret4 = nockGet(mockBareMetalSecrets[4])

        // create the form
        const { getByTestId, getByText, container, getAllByRole } = render(<Component />)

        // start filling in the form
        userEvent.type(getByTestId('eman'), clusterName!)
        userEvent.click(getByTestId('cluster.create.baremetal.subtitle'))

        // wait for tables/combos to fill in
        await waitFor(() => expect(listImageSetsNock.isDone()).toBeTruthy())
        await waitFor(() => expect(listConnections.isDone()).toBeTruthy())
        await waitFor(() => expect(listHosts.isDone()).toBeTruthy())
        await waitFor(() => expect(getSecret0.isDone()).toBeTruthy())
        await waitFor(() => expect(getSecret1.isDone()).toBeTruthy())
        await waitFor(() => expect(getSecret2.isDone()).toBeTruthy())
        await waitFor(() => expect(getSecret3.isDone()).toBeTruthy())
        await waitFor(() => expect(getSecret4.isDone()).toBeTruthy())

        // finish the form
        await waitFor(() => expect(getByTestId('imageSet')))
        userEvent.type(getByTestId('imageSet'), clusterImageSet.spec.releaseImage!)
        container.querySelector<HTMLButtonElement>('.pf-c-select__toggle')?.click()
        getAllByRole('option')[0].click()
        //userEvent.type(getByPlaceholderText('creation.ocp.cloud.select.connection'), providerConnection.metadata.name!)
        userEvent.click(container.querySelector('[name="check-all"]'))
        userEvent.type(getByTestId('provisioningNetworkCIDR'), '10.4.5.3')
        userEvent.type(getByTestId('dnsVIP'), `10.0.0.3{enter}`)

        // nocks for cluster creation
        // creates 2 less bmas so that backend creates those 2
        const listBmas = nockList(bareMetalAsset, mockBareMetalAssets2)
        const bmaProjectNock = nockCreate(mockBmaProject, mockBmaProjectResponse)
        const secretCreateNock1 = nockCreate(createBmaSecretReq[0], createBmaSecretRes[0])
        const secretCreateNock2 = nockCreate(createBmaSecretReq[1], createBmaSecretRes[1])
        const bmaCreateNock1 = nockCreate(mockBareMetalAssets3[0])
        const bmaCreateNock2 = nockCreate(mockBareMetalAssets3[1])
        const listManagedClusterNock = nockList(
            { apiVersion: ManagedClusterInfoApiVersion, kind: ManagedClusterInfoKind },
            [],
            undefined,
            { managedNamespacesOnly: '' }
        )
        const clusterProjectNock = nockCreate(mockClusterProject, mockClusterProjectResponse)
        const clusterCreateNock = nockCreate(mockManagedCluster)
        const clusterPullSecret = nockCreate(mockPullSecret)
        const clusterInstallConfigSecret = nockCreate(mockInstallConfigSecret)
        const clusterPrivateSecretSecret = nockCreate(mockPrivateSecret)
        const clusterKlusterletAddonSecret = nockCreate(mockKlusterletAddonSecret)
        const createClusterDeployment = nockCreate(mockClusterDeployment)
        const optionNock0 = nockOptions(mockPatchBareMetalReq[0], mockPatchBareMetalReq[0])
        const optionNock1 = nockOptions(mockPatchBareMetalReq[1], mockPatchBareMetalReq[1])
        const optionNock2 = nockOptions(mockPatchBareMetalReq[2], mockPatchBareMetalReq[2])
        const optionNock3 = nockOptions(mockPatchBareMetalReq[3], mockPatchBareMetalReq[3])
        const optionNock4 = nockOptions(mockPatchBareMetalReq[4], mockPatchBareMetalReq[4])
        const patchNock0 = nockPatch(mockPatchBareMetalReq[0], patchBareMetalAssetMasterRes)
        const patchNock1 = nockPatch(mockPatchBareMetalReq[1], patchBareMetalAssetMasterRes)
        const patchNock2 = nockPatch(mockPatchBareMetalReq[2], patchBareMetalAssetMasterRes)
        const patchNock3 = nockPatch(mockPatchBareMetalReq[3], patchBareMetalAssetWorkerRes)
        const patchNock4 = nockPatch(mockPatchBareMetalReq[4], patchBareMetalAssetWorkerRes)

        // click create button
        userEvent.click(getByTestId('create-button-portal-id-btn'))

        // make sure creating
        await waitFor(() => expect(getByText('success.create.creating')).toBeInTheDocument())

        // list only 3 bmas so that 2 are created
        await waitFor(() => expect(listBmas.isDone()).toBeTruthy())
        // create bma namespace
        await waitFor(() => expect(bmaProjectNock.isDone()).toBeTruthy())
        // create two bmas/secrets
        await new Promise((r) => setTimeout(r, 1000));
        await waitFor(() => expect(secretCreateNock1.isDone()).toBeTruthy())
        await waitFor(() => expect(secretCreateNock2.isDone()).toBeTruthy())
        await waitFor(() => expect(bmaCreateNock1.isDone()).toBeTruthy())
        await waitFor(() => expect(bmaCreateNock2.isDone()).toBeTruthy())
        // list no clusters so that creating this cluster doesn't think it already exists
        await waitFor(() => expect(listManagedClusterNock.isDone()).toBeTruthy())
        // create the cluster's namespace (project)
        await waitFor(() => expect(clusterProjectNock.isDone()).toBeTruthy())
        // create the managed cluster
        await waitFor(() => expect(clusterCreateNock.isDone()).toBeTruthy())
        await waitFor(() => expect(clusterPullSecret.isDone()).toBeTruthy())
        await waitFor(() => expect(clusterInstallConfigSecret.isDone()).toBeTruthy())
        await waitFor(() => expect(clusterPrivateSecretSecret.isDone()).toBeTruthy())
        await waitFor(() => expect(clusterKlusterletAddonSecret.isDone()).toBeTruthy())
        await waitFor(() => expect(createClusterDeployment.isDone()).toBeTruthy())

        // assigns cluster name to bmas
        await waitFor(() => expect(optionNock0.isDone()).toBeTruthy())
        await waitFor(() => expect(optionNock1.isDone()).toBeTruthy())
        await waitFor(() => expect(optionNock2.isDone()).toBeTruthy())
        await waitFor(() => expect(optionNock3.isDone()).toBeTruthy())
        await waitFor(() => expect(optionNock4.isDone()).toBeTruthy())
        await waitFor(() => expect(patchNock0.isDone()).toBeTruthy())
        await waitFor(() => expect(patchNock1.isDone()).toBeTruthy())
        await waitFor(() => expect(patchNock2.isDone()).toBeTruthy())
        await waitFor(() => expect(patchNock3.isDone()).toBeTruthy())
        await waitFor(() => expect(patchNock4.isDone()).toBeTruthy())
    })
})
