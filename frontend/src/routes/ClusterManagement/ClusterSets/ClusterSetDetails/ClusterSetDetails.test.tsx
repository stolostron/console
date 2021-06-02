/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { MemoryRouter, Switch, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import ClusterSetDetailsPage from './ClusterSetDetails'
import {
    waitForText,
    clickByText,
    clickByLabel,
    waitForNocks,
    clickByPlaceholderText,
    typeByTestId,
    waitForTestId,
    waitForNotTestId,
} from '../../../../lib/test-util'
import { nockIgnoreRBAC, nockDelete, nockCreate, nockPatch } from '../../../../lib/nock-util'
import { mockManagedClusterSet } from '../../../../lib/test-metadata'
import { managedClusterSetLabel } from '../../../../resources/managed-cluster-set'
import { ManagedCluster, ManagedClusterApiVersion, ManagedClusterKind } from '../../../../resources/managed-cluster'
import {
    ManagedClusterInfo,
    ManagedClusterInfoApiVersion,
    ManagedClusterInfoKind,
} from '../../../../resources/managed-cluster-info'
import { ClusterRoleBinding, ClusterRoleBindingKind, RbacApiVersion } from '../../../../resources/rbac'
import {
    ManagedClusterAddOn,
    ManagedClusterAddOnApiVersion,
    ManagedClusterAddOnKind,
} from '../../../../resources/managed-cluster-add-on'
import { Secret, SecretApiVersion, SecretKind } from '../../../../resources/secret'
import {
    SubmarinerConfig,
    SubmarinerConfigApiVersion,
    SubmarinerConfigKind,
    submarinerConfigDefault,
} from '../../../../resources/submariner-config'
import {
    certificateSigningRequestsState,
    clusterDeploymentsState,
    managedClusterInfosState,
    managedClustersState,
    managedClusterSetsState,
    managedClusterAddonsState,
    clusterPoolsState,
    submarinerConfigsState,
} from '../../../../atoms'
import { mockClusterDeployments, mockManagedClusterInfos, mockManagedClusters } from '../../Clusters/Clusters.test'
import { NavigationPath } from '../../../../NavigationPath'
import { nockClusterList, nockNamespacedList } from '../../../../lib/nock-util'

const clusterSetCluster: ManagedCluster = mockManagedClusters.find(
    (mc: ManagedCluster) => mc.metadata.labels?.[managedClusterSetLabel] === mockManagedClusterSet.metadata.name!
)!

const mockManagedClusterExtra: ManagedCluster = {
    apiVersion: ManagedClusterApiVersion,
    kind: ManagedClusterKind,
    metadata: {
        name: 'managed-cluster-extra-clusterset',
        labels: { [managedClusterSetLabel!]: mockManagedClusterSet.metadata.name },
    },
    spec: { hubAcceptsClient: true },
    status: {
        allocatable: { cpu: '', memory: '' },
        capacity: { cpu: '', memory: '' },
        clusterClaims: [{ name: 'platform.open-cluster-management.io', value: 'AWS' }],
        conditions: [],
        version: { kubernetes: '' },
    },
}

const mockManagedClusterExtraSecret: Secret = {
    apiVersion: SecretApiVersion,
    kind: SecretKind,
    metadata: {
        name: `${mockManagedClusterExtra.metadata.name}-aws-creds`,
        namespace: mockManagedClusterExtra.metadata.name,
    },
    data: {
        aws_access_key_id: 'abcdefg',
    },
    type: 'Opaque',
}

const mockManagedClusterNoCredentials: ManagedCluster = {
    apiVersion: ManagedClusterApiVersion,
    kind: ManagedClusterKind,
    metadata: {
        name: 'managed-cluster-no-credentials',
        labels: { [managedClusterSetLabel!]: mockManagedClusterSet.metadata.name },
    },
    spec: { hubAcceptsClient: true },
    status: {
        allocatable: { cpu: '', memory: '' },
        capacity: { cpu: '', memory: '' },
        clusterClaims: [{ name: 'platform.open-cluster-management.io', value: 'AWS' }],
        conditions: [],
        version: { kubernetes: '' },
    },
}

const mockManagedClusterInfoNoCredentials: ManagedClusterInfo = {
    apiVersion: ManagedClusterInfoApiVersion,
    kind: ManagedClusterInfoKind,
    metadata: {
        name: mockManagedClusterNoCredentials.metadata.name!,
        namespace: mockManagedClusterNoCredentials.metadata.name!,
    },
    status: {
        conditions: [],
        version: '1.17',
        distributionInfo: {
            type: 'ocp',
            ocp: {
                version: '1.2.3',
                availableUpdates: ['1.2.4', '1.2.5'],
                desiredVersion: '1.2.4',
                upgradeFailed: false,
                versionAvailableUpdates: [],
            },
        },
    },
}

const mockManagedClusterNoCredentialsSecret: Secret = {
    apiVersion: SecretApiVersion,
    kind: SecretKind,
    metadata: {
        name: `${mockManagedClusterNoCredentials.metadata.name}-aws-creds`,
        namespace: mockManagedClusterNoCredentials.metadata.name,
    },
    data: {
        aws_access_key_id: 'abcdefg',
        aws_secret_access_key: '123456',
    },
    type: 'Opaque',
}

const mockManagedClusterNoCredentialsSecretRequest: Secret = {
    apiVersion: SecretApiVersion,
    kind: SecretKind,
    metadata: {
        name: `${mockManagedClusterNoCredentials.metadata.name}-aws-creds`,
        namespace: mockManagedClusterNoCredentials.metadata.name,
    },
    stringData: {
        aws_access_key_id: mockManagedClusterNoCredentialsSecret.data!.aws_access_key_id,
        aws_secret_access_key: mockManagedClusterNoCredentialsSecret.data!.aws_secret_access_key,
    },
    type: 'Opaque',
}

const mockManagedClusterNoCredentialsSubmarinerConfig: SubmarinerConfig = {
    apiVersion: SubmarinerConfigApiVersion,
    kind: SubmarinerConfigKind,
    metadata: {
        name: 'submariner',
        namespace: mockManagedClusterNoCredentials.metadata.name,
    },
    spec: {
        gatewayConfig: {
            gateways: submarinerConfigDefault.gateways,
            aws: {
                instanceType: submarinerConfigDefault.awsInstanceType,
            },
        },
        IPSecIKEPort: submarinerConfigDefault.ikePort,
        IPSecNATTPort: submarinerConfigDefault.nattPort,
        cableDriver: submarinerConfigDefault.cableDriver,
        credentialsSecret: {
            name: mockManagedClusterNoCredentialsSecret.metadata.name!,
        },
    },
}

const mockNoCredentialsAddOn: ManagedClusterAddOn = {
    apiVersion: ManagedClusterAddOnApiVersion,
    kind: ManagedClusterAddOnKind,
    metadata: {
        name: 'submariner',
        namespace: mockManagedClusterNoCredentials.metadata.name,
    },
    spec: {
        installNamespace: 'submariner-operator',
    },
}

const mockManagedClusterExtraSubmarinerConfig: SubmarinerConfig = {
    apiVersion: SubmarinerConfigApiVersion,
    kind: SubmarinerConfigKind,
    metadata: {
        name: 'submariner',
        namespace: mockManagedClusterExtra.metadata.name,
    },
    spec: {
        gatewayConfig: {
            gateways: submarinerConfigDefault.gateways,
            aws: {
                instanceType: submarinerConfigDefault.awsInstanceType,
            },
        },
        IPSecIKEPort: submarinerConfigDefault.ikePort,
        IPSecNATTPort: submarinerConfigDefault.nattPort,
        cableDriver: submarinerConfigDefault.cableDriver,
        credentialsSecret: {
            name: mockManagedClusterExtraSecret.metadata.name!,
        },
    },
}

const mockSubmarinerAddon: ManagedClusterAddOn = {
    apiVersion: ManagedClusterAddOnApiVersion,
    kind: ManagedClusterAddOnKind,
    metadata: {
        name: 'submariner',
        namespace: clusterSetCluster.metadata.name,
    },
    spec: {
        installNamespace: 'submariner-operator',
    },
}

const mockSubmarinerConfig: SubmarinerConfig = {
    apiVersion: SubmarinerConfigApiVersion,
    kind: SubmarinerConfigKind,
    metadata: {
        name: 'submariner',
        namespace: mockSubmarinerAddon.metadata.namespace!,
    },
    spec: {
        credentialsSecret: {
            name: `${mockSubmarinerAddon.metadata.namespace}-aws-creds`,
        },
    },
}

const mockSubmarinerAddonExtra: ManagedClusterAddOn = {
    apiVersion: ManagedClusterAddOnApiVersion,
    kind: ManagedClusterAddOnKind,
    metadata: {
        name: 'submariner',
        namespace: mockManagedClusterExtra.metadata.name,
    },
    spec: {
        installNamespace: 'submariner-operator',
    },
}

const Component = () => (
    <RecoilRoot
        initializeState={(snapshot) => {
            snapshot.set(managedClusterSetsState, [mockManagedClusterSet])
            snapshot.set(clusterDeploymentsState, mockClusterDeployments)
            snapshot.set(managedClusterInfosState, [...mockManagedClusterInfos, mockManagedClusterInfoNoCredentials])
            snapshot.set(managedClustersState, [
                ...mockManagedClusters,
                mockManagedClusterExtra,
                mockManagedClusterNoCredentials,
            ])
            snapshot.set(certificateSigningRequestsState, [])
            snapshot.set(managedClusterAddonsState, [mockSubmarinerAddon])
            snapshot.set(submarinerConfigsState, [mockSubmarinerConfig])
            snapshot.set(clusterPoolsState, [])
        }}
    >
        <MemoryRouter
            initialEntries={[NavigationPath.clusterSetDetails.replace(':id', mockManagedClusterSet.metadata.name!)]}
        >
            <Switch>
                <Route path={NavigationPath.clusterSetDetails} component={ClusterSetDetailsPage} />
            </Switch>
        </MemoryRouter>
    </RecoilRoot>
)

const mockClusterRoleBinding: ClusterRoleBinding = {
    apiVersion: RbacApiVersion,
    kind: ClusterRoleBindingKind,
    metadata: {
        name: 'cluster-set-binding',
        uid: '88723604-037e-4e42-9f46-13839752b3be',
    },
    subjects: [
        {
            kind: 'User',
            apiGroup: 'rbac.authorization.k8s.io',
            name: 'mock-user',
        },
    ],
    roleRef: {
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'ClusterRole',
        name: `open-cluster-management:managedclusterset:admin:${mockManagedClusterSet.metadata.name!}`,
    },
}

const mockUser = {
    kind: 'User',
    apiVersion: 'user.openshift.io/v1',
    metadata: {
        name: 'mock-user2',
        uid: 'e3d73187-dcf4-49a2-b0fb-d2805c5dd584',
    },
    identities: ['myuser:mock-user2'],
    groups: null,
}

const mockGroup = {
    kind: 'Group',
    apiVersion: 'user.openshift.io/v1',
    metadata: {
        name: 'mock-group',
        uid: '98d01b86-7721-4b98-b145-58df2bff2f6e',
    },
    users: [],
}

describe('ClusterSetDetails page', () => {
    beforeEach(async () => {
        const getNocks = [nockClusterList(mockUser, [mockUser]), nockClusterList(mockGroup, [mockGroup])]
        nockIgnoreRBAC()
        render(<Component />)
        await waitForNocks(getNocks)
    })
    test('renders', async () => {
        await waitForText(mockManagedClusterSet.metadata.name!, true)
        await waitForText('table.details')

        await clickByText('tab.clusters')
        await waitForText(clusterSetCluster.metadata.name!)

        await clickByText('tab.clusterPools')
    })
    test('can install submariner add-ons', async () => {
        await waitForText(mockManagedClusterSet.metadata.name!, true)
        await waitForText('table.details')

        await clickByText('tab.submariner')

        await waitForText(mockSubmarinerAddon!.metadata.namespace!)

        const nockListExtraSecrets = nockNamespacedList(mockManagedClusterExtraSecret, [mockManagedClusterExtraSecret])
        const nockListNoCredsSecrets = nockNamespacedList(mockManagedClusterNoCredentialsSecret, [])
        await clickByText('managed.clusterSets.submariner.addons.install', 0)
        await waitForNocks([nockListExtraSecrets, nockListNoCredsSecrets])

        await waitForText('submariner.install.step.clusters.title', true)

        await clickByPlaceholderText('submariner.install.form.clusters.placeholder')
        await clickByText(mockManagedClusterExtra!.metadata.name!)
        await clickByText(mockManagedClusterNoCredentials!.metadata.name!)
        await clickByText('common:next')

        // mockManagedClusterExtra
        await waitForTestId('credential-secret')
        await waitForNotTestId('awsAccessKeyID')
        await waitForNotTestId('awsSecretAccessKeyID')
        await clickByText('common:next')

        // mockManagedClusterNoCredentials
        await waitForNotTestId('credential-secret')
        await typeByTestId('awsAccessKeyID', mockManagedClusterNoCredentialsSecret.data!.aws_access_key_id)
        await typeByTestId('awsSecretAccessKeyID', mockManagedClusterNoCredentialsSecret.data!.aws_secret_access_key)

        await clickByText('common:next')

        // mockManagedClusterExtra
        const nockMCAExtra = nockCreate(mockSubmarinerAddonExtra)
        const nockSCExtra = nockCreate(mockManagedClusterExtraSubmarinerConfig)

        // mockManagedClusterNoCredentials
        const nockMCANoCreds = nockCreate(mockNoCredentialsAddOn)
        const nockSecretNoCreds = nockCreate(
            mockManagedClusterNoCredentialsSecretRequest,
            mockManagedClusterNoCredentialsSecret
        )
        const nockSCNoCreds = nockCreate(mockManagedClusterNoCredentialsSubmarinerConfig)

        await clickByText('common:install')
        await waitForNocks([nockMCAExtra, nockSCExtra, nockMCANoCreds, nockSecretNoCreds, nockSCNoCreds])
    })
    test('can uninstall submariner add-ons', async () => {
        await waitForText(mockManagedClusterSet.metadata.name!, true)
        await waitForText('table.details')

        await clickByText('tab.submariner')

        await waitForText(mockSubmarinerAddon!.metadata.namespace!)
        await clickByLabel('Actions', 0)
        await clickByText('uninstall.add-on')
        await waitForText('bulk.title.uninstallSubmariner')

        const deleteAddon = nockDelete(mockSubmarinerAddon)
        const deleteConfig = nockDelete(mockSubmarinerConfig)
        await clickByText('common:uninstall')
        await waitForNocks([deleteAddon, deleteConfig])
    })
    test('can update a submariner config', async () => {
        await waitForText(mockManagedClusterSet.metadata.name!, true)
        await waitForText('table.details')

        await clickByText('tab.submariner')

        await waitForText(mockSubmarinerAddon!.metadata.namespace!)

        await clickByLabel('Actions', 0)
        await clickByText('submariner.config.edit')
        await waitForText('submariner.update.form.title')

        await typeByTestId('ike-port', '501')

        const patch = nockPatch(mockSubmarinerConfig, [
            {
                op: 'replace',
                path: '/spec/IPSecIKEPort',
                value: 501,
            },
            {
                op: 'replace',
                path: '/spec/IPSecNATTPort',
                value: submarinerConfigDefault.nattPort,
            },
            {
                op: 'replace',
                path: '/spec/cableDriver',
                value: submarinerConfigDefault.cableDriver,
            },
            { op: 'add', path: '/spec/gatewayConfig', value: {} },
            {
                op: 'replace',
                path: '/spec/gatewayConfig/gateways',
                value: submarinerConfigDefault.gateways,
            },
        ])
        await clickByText('common:save')
        await waitForNocks([patch])
    })
    test('can remove users from cluster set', async () => {
        const nock = nockClusterList({ apiVersion: RbacApiVersion, kind: ClusterRoleBindingKind }, [
            mockClusterRoleBinding,
        ])
        await waitForText(mockManagedClusterSet.metadata.name!, true)
        await clickByText('tab.access')
        await waitForNocks([nock])
        await waitForText('mock-user')
        await clickByLabel('Actions', 0)
        await clickByText('access.remove')
        await waitForText('bulk.title.removeAuthorization')
        const deleteNock = nockDelete(mockClusterRoleBinding)
        await clickByText('remove')
        await waitForNocks([deleteNock])
    })
    test('can add users to the cluster set', async () => {
        const nock = nockClusterList({ apiVersion: RbacApiVersion, kind: ClusterRoleBindingKind }, [
            mockClusterRoleBinding,
        ])
        await waitForText(mockManagedClusterSet.metadata.name!, true)
        await clickByText('tab.access')
        await waitForNocks([nock])
        await clickByText('access.add')
        await waitForText('access.add.title')
        await clickByPlaceholderText('access.select.user')
        await clickByText(mockUser.metadata.name!)
        await clickByText('access.select.role')
        await clickByText('access.clusterSet.role.admin', 1)
        const createNock = nockCreate({
            apiVersion: RbacApiVersion,
            kind: ClusterRoleBindingKind,
            metadata: {
                generateName: `${mockManagedClusterSet?.metadata.name}-`,
            },
            subjects: [
                {
                    kind: 'User',
                    apiGroup: 'rbac.authorization.k8s.io',
                    name: mockUser!.metadata.name!,
                },
            ],
            roleRef: {
                apiGroup: 'rbac.authorization.k8s.io',
                kind: 'ClusterRole',
                name: `open-cluster-management:managedclusterset:admin:${mockManagedClusterSet!.metadata.name!}`,
            },
        })
        await clickByText('common:add')
        await waitForNocks([createNock])
    })
    test('can add groups to the cluster set', async () => {
        const nock = nockClusterList({ apiVersion: RbacApiVersion, kind: ClusterRoleBindingKind }, [
            mockClusterRoleBinding,
        ])
        await waitForText(mockManagedClusterSet.metadata.name!, true)
        await clickByText('tab.access')
        await waitForNocks([nock])
        await clickByText('access.add')
        await waitForText('access.add.title')
        await clickByText('access.groups')
        await clickByPlaceholderText('access.select.group')
        await clickByText(mockGroup.metadata.name!)
        await clickByText('access.select.role')
        await clickByText('access.clusterSet.role.view')
        const createNock = nockCreate({
            apiVersion: RbacApiVersion,
            kind: ClusterRoleBindingKind,
            metadata: {
                generateName: `${mockManagedClusterSet?.metadata.name}-`,
            },
            subjects: [
                {
                    kind: 'Group',
                    apiGroup: 'rbac.authorization.k8s.io',
                    name: mockGroup!.metadata.name!,
                },
            ],
            roleRef: {
                apiGroup: 'rbac.authorization.k8s.io',
                kind: 'ClusterRole',
                name: `open-cluster-management:managedclusterset:view:${mockManagedClusterSet!.metadata.name!}`,
            },
        })
        await clickByText('common:add')
        await waitForNocks([createNock])
    })
})

describe('ClusterSetDetails error', () => {
    const Component = () => (
        <RecoilRoot
            initializeState={(snapshot) => {
                snapshot.set(managedClusterSetsState, [])
                snapshot.set(clusterDeploymentsState, [])
                snapshot.set(managedClusterInfosState, [])
                snapshot.set(managedClustersState, [])
                snapshot.set(certificateSigningRequestsState, [])
            }}
        >
            <MemoryRouter
                initialEntries={[NavigationPath.clusterSetDetails.replace(':id', mockManagedClusterSet.metadata.name!)]}
            >
                <Switch>
                    <Route path={NavigationPath.clusterSetDetails} component={ClusterSetDetailsPage} />
                </Switch>
            </MemoryRouter>
        </RecoilRoot>
    )
    test('renders error page when cluster set does not exist', async () => {
        render(<Component />)
        await waitForText('Not found')
    })
})

describe('ClusterSetDetails deletion', () => {
    const clusterSet = JSON.parse(JSON.stringify(mockManagedClusterSet))
    clusterSet.metadata.deletionTimestamp = '2021-04-16T15:26:18Z'
    const Component = () => (
        <RecoilRoot
            initializeState={(snapshot) => {
                snapshot.set(managedClusterSetsState, [clusterSet])
                snapshot.set(clusterDeploymentsState, [])
                snapshot.set(managedClusterInfosState, [])
                snapshot.set(managedClustersState, [])
                snapshot.set(certificateSigningRequestsState, [])
            }}
        >
            <MemoryRouter
                initialEntries={[NavigationPath.clusterSetDetails.replace(':id', mockManagedClusterSet.metadata.name!)]}
            >
                <Switch>
                    <Route path={NavigationPath.clusterSetDetails} component={ClusterSetDetailsPage} />
                </Switch>
            </MemoryRouter>
        </RecoilRoot>
    )
    test('renders deletion page when the cluster set has a deletionTimestamp', async () => {
        render(<Component />)
        await waitForText('deleting.managedClusterSet.inprogress')
    })
})
