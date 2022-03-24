/* Copyright Contributors to the Open Cluster Management project */

import {
    BareMetalAsset,
    BareMetalAssetApiVersion,
    BareMetalAssetKind,
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
    SecretApiVersion,
    SecretKind,
} from '../../../../../resources'
import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { cloneDeep, pick } from 'lodash'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import {
    clusterCuratorsState,
    managedClusterSetsState,
    managedClustersState,
    secretsState,
    settingsState,
} from '../../../../../atoms'
import { nockCreate, nockGet, nockIgnoreRBAC, nockList, nockPatch } from '../../../../../lib/nock-util'
import {
    clickByLabel,
    clickByPlaceholderText,
    clickByTestId,
    clickByText,
    typeByPlaceholderText,
    typeByTestId,
    typeByText,
    waitForLabelText,
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

const bmaProjectNamespace = 'test-bare-metal-asset-namespace'
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
        namespace: clusterName,
        labels: {
            'open-cluster-management': 'curator',
        },
    },
    spec: {
        desiredCuration: undefined,
        install: {
            towerAuthSecret: 'ansible-connection',
        },
    },
}

const mockClusterCuratorInstall: ClusterCurator = {
    apiVersion: ClusterCuratorApiVersion,
    kind: ClusterCuratorKind,
    metadata: {
        name: 'test',
        namespace: clusterName,
        labels: {
            'open-cluster-management': 'curator',
        },
    },
    spec: {
        install: { towerAuthSecret: 'toweraccess' },
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
        name: 'toweraccess',
        namespace: clusterName,
        labels: {
            'cluster.open-cluster-management.io/type': 'ans',
            'cluster.open-cluster-management.io/copiedFromNamespace': 'test-ii',
            'cluster.open-cluster-management.io/copiedFromSecretName': 'ansible-connection',
        },
    },
    stringData: {
        host: 'test',
        token: 'test',
    },
    type: 'Opaque',
}

const mockClusterCurators = [clusterCurator]

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
const mockBareMetalAssets = Array.from({ length: 5 }, (_val, inx) => {
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

const mockBareMetalSecrets = Array.from({ length: 5 }, (_val, inx) => {
    const mockedSecret = cloneDeep(bmaSecret)
    mockedSecret.metadata.name = `secret-test-bare-metal-asset-${inx}`
    return mockedSecret
})

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
const mockBareMetalAssets2 = Array.from({ length: 4 }, (_val, inx) => {
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

const mockBareMetalAssets3 = Array.from({ length: 1 }, (_val, inx) => {
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

const mockPullSecret = {
    apiVersion: 'v1',
    kind: 'Secret',
    metadata: {
        name: 'test-pull-secret',
        namespace: 'test',
        labels: {
            'cluster.open-cluster-management.io/backup': 'cluster',
            'cluster.open-cluster-management.io/copiedFromNamespace': providerConnection.metadata.namespace!,
            'cluster.open-cluster-management.io/copiedFromSecretName': providerConnection.metadata.name!,
        },
    },
    stringData: {
        '.dockerconfigjson': '{"pullSecret":"secret"}',
    },
    type: 'kubernetes.io/dockerconfigjson',
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

const mockInstallConfigSecret = {
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
            'YXBpVmVyc2lvbjogdjEKbWV0YWRhdGE6CiAgbmFtZTogdGVzdApiYXNlRG9tYWluOiBiYXNlLmRvbWFpbi5jb20KY29udHJvbFBsYW5lOgogIG5hbWU6IG1hc3RlcgogIHJlcGxpY2FzOiAzCiAgcGxhdGZvcm06CiAgICBiYXJlbWV0YWw6IHt9CmNvbXB1dGU6CiAgLSBuYW1lOiB3b3JrZXIKICAgIHJlcGxpY2FzOiAyCm5ldHdvcmtpbmc6CiAgbmV0d29ya1R5cGU6IE9wZW5TaGlmdFNETgogIGNsdXN0ZXJOZXR3b3JrOgogICAgLSBjaWRyOiAxMC4xMjguMC4wLzE0CiAgICAgIGhvc3RQcmVmaXg6IDIzCiAgbWFjaGluZU5ldHdvcms6CiAgICAtIGNpZHI6IDEwLjAuMC4wLzE2CiAgc2VydmljZU5ldHdvcms6CiAgICAtIDE3Mi4zMC4wLjAvMTYKcGxhdGZvcm06CiAgYmFyZW1ldGFsOgogICAgbGlidmlydFVSSTogcWVtdStzc2g6Ly9saWJ2aXJ0VVJJCiAgICBwcm92aXNpb25pbmdOZXR3b3JrQ0lEUjogMTAuNC41LjMKICAgIHByb3Zpc2lvbmluZ05ldHdvcmtJbnRlcmZhY2U6IGVucDFzMAogICAgcHJvdmlzaW9uaW5nQnJpZGdlOiBwcm92aXNpb25pbmcKICAgIGV4dGVybmFsQnJpZGdlOiBiYXJlbWV0YWwKICAgIGFwaVZJUDogbnVsbAogICAgaW5ncmVzc1ZJUDogbnVsbAogICAgYm9vdHN0cmFwT1NJbWFnZTogYm9vdHN0cmFwT1NJbWFnZQogICAgY2x1c3Rlck9TSW1hZ2U6IGNsdXN0ZXJPU0ltYWdlCiAgICBob3N0czoKICAgICAgLSBuYW1lOiB0ZXN0LWJhcmUtbWV0YWwtYXNzZXQtMAogICAgICAgIHJvbGU6IG1hc3RlcgogICAgICAgIGJtYzoKICAgICAgICAgIGFkZHJlc3M6IGV4YW1wbGUuY29tOjgwCiAgICAgICAgICBkaXNhYmxlQ2VydGlmaWNhdGVWZXJpZmljYXRpb246IHRydWUKICAgICAgICAgIHVzZXJuYW1lOiB0ZXN0CiAgICAgICAgICBwYXNzd29yZDogdGVzdAogICAgICAgIGJvb3RNQUNBZGRyZXNzOiAwMDo5MDo3RjoxMjpERTo3RgogICAgICAgIGhhcmR3YXJlUHJvZmlsZTogZGVmYXVsdAogICAgICAtIG5hbWU6IHRlc3QtYmFyZS1tZXRhbC1hc3NldC0xCiAgICAgICAgcm9sZTogbWFzdGVyCiAgICAgICAgYm1jOgogICAgICAgICAgYWRkcmVzczogZXhhbXBsZS5jb206ODAKICAgICAgICAgIGRpc2FibGVDZXJ0aWZpY2F0ZVZlcmlmaWNhdGlvbjogdHJ1ZQogICAgICAgICAgdXNlcm5hbWU6IHRlc3QKICAgICAgICAgIHBhc3N3b3JkOiB0ZXN0CiAgICAgICAgYm9vdE1BQ0FkZHJlc3M6IDAwOjkwOjdGOjEyOkRFOjdGCiAgICAgICAgaGFyZHdhcmVQcm9maWxlOiBkZWZhdWx0CiAgICAgIC0gbmFtZTogdGVzdC1iYXJlLW1ldGFsLWFzc2V0LTIKICAgICAgICByb2xlOiBtYXN0ZXIKICAgICAgICBibWM6CiAgICAgICAgICBhZGRyZXNzOiBleGFtcGxlLmNvbTo4MAogICAgICAgICAgZGlzYWJsZUNlcnRpZmljYXRlVmVyaWZpY2F0aW9uOiB0cnVlCiAgICAgICAgICB1c2VybmFtZTogdGVzdAogICAgICAgICAgcGFzc3dvcmQ6IHRlc3QKICAgICAgICBib290TUFDQWRkcmVzczogMDA6OTA6N0Y6MTI6REU6N0YKICAgICAgICBoYXJkd2FyZVByb2ZpbGU6IGRlZmF1bHQKICAgICAgLSBuYW1lOiB0ZXN0LWJhcmUtbWV0YWwtYXNzZXQtMwogICAgICAgIHJvbGU6IHdvcmtlcgogICAgICAgIGJtYzoKICAgICAgICAgIGFkZHJlc3M6IGV4YW1wbGUuY29tOjgwCiAgICAgICAgICBkaXNhYmxlQ2VydGlmaWNhdGVWZXJpZmljYXRpb246IHRydWUKICAgICAgICAgIHVzZXJuYW1lOiB0ZXN0CiAgICAgICAgICBwYXNzd29yZDogdGVzdAogICAgICAgIGJvb3RNQUNBZGRyZXNzOiAwMDo5MDo3RjoxMjpERTo3RgogICAgICAgIGhhcmR3YXJlUHJvZmlsZTogZGVmYXVsdAogICAgICAtIG5hbWU6IHRlc3QtYmFyZS1tZXRhbC1hc3NldC00CiAgICAgICAgcm9sZTogd29ya2VyCiAgICAgICAgYm1jOgogICAgICAgICAgYWRkcmVzczogZXhhbXBsZS5jb206ODAKICAgICAgICAgIGRpc2FibGVDZXJ0aWZpY2F0ZVZlcmlmaWNhdGlvbjogdHJ1ZQogICAgICAgICAgdXNlcm5hbWU6IG51bGwKICAgICAgICAgIHBhc3N3b3JkOiBudWxsCiAgICAgICAgYm9vdE1BQ0FkZHJlc3M6IDAwOjkwOjdGOjEyOkRFOjdGCiAgICAgICAgaGFyZHdhcmVQcm9maWxlOiBkZWZhdWx0CnB1bGxTZWNyZXQ6ICcnCnNzaEtleTogc3NoLXJzYSBBQUFBQjEgZmFrZUBlbWFpbC5jb20KYWRkaXRpb25hbFRydXN0QnVuZGxlOiB8LQogIC0tLS0tQkVHSU4gQ0VSVElGSUNBVEUtLS0tLQogIGNlcnRkYXRhCiAgLS0tLS1FTkQgQ0VSVElGSUNBVEUtLS0tLQppbWFnZUNvbnRlbnRTb3VyY2VzOgogIC0gbWlycm9yczoKICAgICAgLSBpbWFnZS5taXJyb3I6MTIzL2FiYwogICAgc291cmNlOiBxdWF5LmlvL29wZW5zaGlmdC1yZWxlYXNlLWRldi9vY3AtcmVsZWFzZS1uaWdodGx5CiAgLSBtaXJyb3JzOgogICAgICAtIGltYWdlLm1pcnJvcjoxMjMvYWJjCiAgICBzb3VyY2U6IHF1YXkuaW8vb3BlbnNoaWZ0LXJlbGVhc2UtZGV2L29jcC1yZWxlYXNlCiAgLSBtaXJyb3JzOgogICAgICAtIGltYWdlLm1pcnJvcjoxMjMvYWJjCiAgICBzb3VyY2U6IHF1YXkuaW8vb3BlbnNoaWZ0LXJlbGVhc2UtZGV2L29jcC12NC4wLWFydC1kZXYK',
    },
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

const mockPrivateSecret = {
    apiVersion: 'v1',
    kind: 'Secret',
    metadata: {
        name: 'test-ssh-private-key',
        namespace: 'test',
        labels: {
            'cluster.open-cluster-management.io/backup': 'cluster',
            'cluster.open-cluster-management.io/copiedFromNamespace': providerConnection.metadata.namespace!,
            'cluster.open-cluster-management.io/copiedFromSecretName': providerConnection.metadata.name!,
        },
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

const mockClusterDeploymentAnsible = {
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
        baseDomain,
        clusterName: 'test',
        controlPlaneConfig: {
            servingCertificates: {},
        },
        installAttemptsLimit: 0,
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
                name: 'ocp-release48',
            },
            sshKnownHosts: ['sshKnownHosts'],
        },
        pullSecretRef: {
            name: 'test-pull-secret',
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
        baseDomain,
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
                name: 'ocp-release48',
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

const mockPatchBareMetalReq = Array.from({ length: 5 }, (_val, inx) => {
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

    test('can create bare metal cluster without ansible template', async () => {
        window.scrollBy = () => {}

        const initialNocks = [
            nockList(clusterImageSet, mockClusterImageSet),
            nockList(pick(bareMetalAsset, ['apiVersion', 'kind']), mockBareMetalAssets),
        ]

        // create the form
        const { container } = render(<Component />)

        await new Promise((resolve) => setTimeout(resolve, 500))

        // step 1 -- the infrastructure
        await clickByTestId('bare-metal')

        // wait for tables/combos to fill in
        await waitForNocks(initialNocks)

        // connection
        await clickByPlaceholderText('Select a credential')
        await clickByText(providerConnection.metadata.name!)
        await clickByText('Next')

        // step 2 -- the name and imageset
        await typeByTestId('eman', clusterName!)
        await typeByTestId('imageSet', clusterImageSet!.spec!.releaseImage!)
        container.querySelector<HTMLButtonElement>('.tf--list-box__menu-item')?.click()
        await clickByText('Next')

        // step 3 -- the hosts
        await waitFor(() => expect(container.querySelector('[name="check-all"]')).not.toBeNull())
        const checkAll = container.querySelector('[name="check-all"]')
        if (checkAll) {
            userEvent.click(checkAll)
        }
        await clickByText('Next')

        // step 4 -- the network
        await typeByTestId('provisioningNetworkCIDR', '10.4.5.3')
        await clickByText('Next')

        // skipping proxy
        await clickByText('Next')

        // skipping ansible template
        await clickByText('Next')

        // nocks for cluster creation
        const createNocks = [
            // list only 4 bmas so that one is created
            // creates 1 less bmas so that backend creates that 1
            nockList(pick(bareMetalAsset, ['apiVersion', 'kind']), mockBareMetalAssets2),

            // create bma namespace
            nockCreate(mockBmaProject, mockBmaProjectResponse),

            // create bmas/secrets
            nockCreate(mockBareMetalAssets3[0]),
            nockGet(mockBareMetalSecrets[0]),
            nockGet(mockBareMetalSecrets[1]),
            nockGet(mockBareMetalSecrets[2]),
            nockGet(mockBareMetalSecrets[3]),

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
        await clickByText('Create')

        expect(consoleInfos).hasNoConsoleLogs()
        await waitForText('Creating cluster ...')

        // make sure creating
        await waitForNocks(createNocks)
    })

    test('can create bare metal cluster with ansible template', async () => {
        window.scrollBy = () => {}

        const initialNocks = [
            nockList(clusterImageSet, mockClusterImageSet),
            nockList(pick(bareMetalAsset, ['apiVersion', 'kind']), mockBareMetalAssets),
        ]

        // create the form
        const { container } = render(<Component />)

        await new Promise((resolve) => setTimeout(resolve, 500))

        // step 1 -- the infrastructure
        await clickByTestId('bare-metal')

        // wait for tables/combos to fill in
        await waitForNocks(initialNocks)

        // connection
        await clickByPlaceholderText('Select a credential')
        await clickByText(providerConnection.metadata.name!)
        await new Promise((resolve) => setTimeout(resolve, 500))
        await clickByText('Next')

        // step 2 -- the name and imageset
        await typeByTestId('eman', clusterName!)
        await typeByTestId('imageSet', clusterImageSet!.spec!.releaseImage!)
        container.querySelector<HTMLButtonElement>('.tf--list-box__menu-item')?.click()
        await clickByText('Next')

        // step 3 -- the hosts
        await waitForLabelText('Select all rows')
        await clickByLabel('Select all rows')
        await clickByText('Next')

        // step 4 -- the network
        await typeByTestId('provisioningNetworkCIDR', '10.4.5.3')
        await clickByText('Next')

        // skipping proxy
        await clickByText('Next')

        // ansible template
        await clickByPlaceholderText('Select an Ansible job template')
        await clickByText(mockClusterCurators[0].metadata.name!)
        await clickByText('Next')

        // nocks for cluster creation
        const createNocks = [
            // list only 4 bmas so that one is created
            // creates 1 less bmas so that backend creates that 1
            nockList(pick(bareMetalAsset, ['apiVersion', 'kind']), mockBareMetalAssets2),

            // create bma namespace
            nockCreate(mockBmaProject, mockBmaProjectResponse),

            // create bmas/secrets
            nockCreate(mockBareMetalAssets3[0]),
            nockGet(mockBareMetalSecrets[0]),
            nockGet(mockBareMetalSecrets[1]),
            nockGet(mockBareMetalSecrets[2]),
            nockGet(mockBareMetalSecrets[3]),

            // create the cluster's namespace (project)
            nockCreate(mockClusterProject, mockClusterProjectResponse),

            // create the managed cluster
            nockCreate(mockManagedCluster),
            nockCreate(mockPullSecret),
            nockCreate(mockInstallConfigSecret),
            nockCreate(mockPrivateSecret),
            nockCreate(mockKlusterletAddonSecret),
            nockCreate(mockClusterDeploymentAnsible),
            nockCreate(mockProviderConnectionAnsibleCopied),
            nockCreate(mockClusterCuratorInstall),

            // assigns cluster name to bmas
            nockPatch(mockPatchBareMetalReq[0], patchBareMetalAssetMasterRes),
            nockPatch(mockPatchBareMetalReq[1], patchBareMetalAssetMasterRes),
            nockPatch(mockPatchBareMetalReq[2], patchBareMetalAssetMasterRes),
            nockPatch(mockPatchBareMetalReq[3], patchBareMetalAssetWorkerRes),
            nockPatch(mockPatchBareMetalReq[4], patchBareMetalAssetWorkerRes),
        ]

        // click create button
        await clickByText('Create')

        // expect(consoleInfos).hasNoConsoleLogs()
        await waitForText('Creating cluster ...')

        // make sure creating
        await waitForNocks(createNocks)
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
        await typeByText('Hosted Zone', 'aws-hosted-zone.com')
        await typeByPlaceholderText('Enter amiID', 'ami-0876eacb38191e91f')
        await clickByText('Subnets')
        await typeByPlaceholderText('Enter one or more subnet IDs', 'subnet-02216dd4dae7c45d0')
        await clickByText('Service Endpoints')
        await typeByPlaceholderText('Enter AWS service endpoint name', 'endpoint-1')
        await typeByPlaceholderText('Enter AWS service endpoint url', 'aws.endpoint-1.com')
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

    test(
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
