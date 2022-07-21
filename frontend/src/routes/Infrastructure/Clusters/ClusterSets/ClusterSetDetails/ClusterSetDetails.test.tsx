/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { MemoryRouter, Route, Switch } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import {
    certificateSigningRequestsState,
    clusterDeploymentsState,
    clusterPoolsState,
    managedClusterAddonsState,
    managedClusterInfosState,
    managedClusterSetsState,
    managedClustersState,
    submarinerConfigsState,
} from '../../../../../atoms'
import {
    nockClusterList,
    nockCreate,
    nockDelete,
    nockIgnoreRBAC,
    nockNamespacedList,
    nockPatch,
} from '../../../../../lib/nock-util'
import { PluginContext } from '../../../../../lib/PluginContext'
import { mockGlobalManagedClusterSet, mockManagedClusterSet } from '../../../../../lib/test-metadata'
import {
    clickByLabel,
    clickByPlaceholderText,
    clickByText,
    typeByTestId,
    waitForNocks,
    waitForNotTestId,
    waitForNotText,
    waitForTestId,
    waitForText,
} from '../../../../../lib/test-util'
import { NavigationPath } from '../../../../../NavigationPath'
import {
    ClusterRoleBinding,
    ClusterRoleBindingKind,
    ManagedCluster,
    ManagedClusterAddOn,
    ManagedClusterAddOnApiVersion,
    ManagedClusterAddOnKind,
    ManagedClusterApiVersion,
    ManagedClusterInfo,
    ManagedClusterInfoApiVersion,
    ManagedClusterInfoKind,
    ManagedClusterKind,
    managedClusterSetLabel,
    RbacApiVersion,
    Secret,
    SecretApiVersion,
    SecretKind,
    SubmarinerConfig,
    SubmarinerConfigApiVersion,
    submarinerConfigDefault,
    SubmarinerConfigKind,
} from '../../../../../resources'
import {
    mockClusterDeployments,
    mockManagedClusterInfos,
    mockManagedClusters,
} from '../../ManagedClusters/ManagedClusters.test'
import ClusterSetDetailsPage from './ClusterSetDetails'

const clusterSetCluster: ManagedCluster = mockManagedClusters.find(
    (mc: ManagedCluster) => mc.metadata.labels?.[managedClusterSetLabel] === mockManagedClusterSet.metadata.name!
)!

const mockManagedClusterExtra: ManagedCluster = {
    apiVersion: ManagedClusterApiVersion,
    kind: ManagedClusterKind,
    metadata: {
        name: 'managed-cluster-extra-clusterset',
        labels: { [managedClusterSetLabel]: mockManagedClusterSet.metadata.name! },
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

const mockManagedClusterInfoExtra: ManagedClusterInfo = {
    apiVersion: ManagedClusterInfoApiVersion,
    kind: ManagedClusterInfoKind,
    metadata: {
        name: mockManagedClusterExtra.metadata.name!,
        namespace: mockManagedClusterExtra.metadata.name!,
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
        labels: { [managedClusterSetLabel]: mockManagedClusterSet.metadata.name! },
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
        IPSecNATTPort: submarinerConfigDefault.nattPort,
        NATTEnable: submarinerConfigDefault.nattEnable,
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
        IPSecNATTPort: submarinerConfigDefault.nattPort,
        NATTEnable: submarinerConfigDefault.nattEnable,
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

const Component = (props: { isGlobal?: boolean }) => (
    <RecoilRoot
        initializeState={(snapshot) => {
            snapshot.set(managedClusterSetsState, [
                props.isGlobal ? mockGlobalManagedClusterSet : mockManagedClusterSet,
            ])
            snapshot.set(clusterDeploymentsState, mockClusterDeployments)
            snapshot.set(managedClusterInfosState, [
                ...mockManagedClusterInfos,
                mockManagedClusterInfoExtra,
                mockManagedClusterInfoNoCredentials,
            ])
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
            initialEntries={[
                NavigationPath.clusterSetDetails.replace(
                    ':id',
                    props.isGlobal ? mockGlobalManagedClusterSet.metadata.name! : mockManagedClusterSet.metadata.name!
                ),
            ]}
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

const mockGlobalClusterRoleBinding: ClusterRoleBinding = {
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
        name: `open-cluster-management:managedclusterset:admin:${mockGlobalManagedClusterSet.metadata.name!}`,
    },
}

describe('ClusterSetDetails page', () => {
    beforeEach(async () => {
        const getNocks = [
            nockClusterList(mockUser, [mockUser]),
            nockClusterList(mockGroup, [mockGroup]),
            nockClusterList(mockClusterRoleBinding, [mockClusterRoleBinding]),
        ]
        nockIgnoreRBAC()
        render(<Component />)
        await waitForNocks(getNocks)
    })
    test('renders', async () => {
        await waitForText(mockManagedClusterSet.metadata.name!, true)
        await waitForText('Details')

        await clickByText('Managed clusters')
        await waitForText(clusterSetCluster.metadata.name!)

        await clickByText('Cluster pools')
    })
    test('can install submariner add-ons', async () => {
        await waitForText(mockManagedClusterSet.metadata.name!, true)
        await waitForText('Details')

        await clickByText('Submariner add-ons', 0)

        await waitForText(mockSubmarinerAddon!.metadata.namespace!)

        const nockListExtraSecrets = nockNamespacedList(mockManagedClusterExtraSecret, [mockManagedClusterExtraSecret])
        const nockListNoCredsSecrets = nockNamespacedList(mockManagedClusterNoCredentialsSecret, [])
        await clickByText('Install Submariner add-ons', 0)
        await waitForNocks([nockListExtraSecrets, nockListNoCredsSecrets])

        await waitForText('Select clusters', true)

        await clickByPlaceholderText('Select clusters')
        await clickByText(mockManagedClusterExtra!.metadata.name!)
        await clickByText(mockManagedClusterNoCredentials!.metadata.name!)
        await clickByText('Next')

        // mockManagedClusterExtra
        await waitForTestId('credential-secret')
        await waitForNotTestId('awsAccessKeyID')
        await waitForNotTestId('awsSecretAccessKeyID')
        await clickByText('Next')

        // mockManagedClusterNoCredentials
        await waitForNotTestId('credential-secret')
        await typeByTestId('awsAccessKeyID', mockManagedClusterNoCredentialsSecret.data!.aws_access_key_id)
        await typeByTestId('awsSecretAccessKeyID', mockManagedClusterNoCredentialsSecret.data!.aws_secret_access_key)

        await clickByText('Next')

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

        await clickByText('Install')
        await waitForNocks([nockMCAExtra, nockSCExtra, nockMCANoCreds, nockSecretNoCreds, nockSCNoCreds])
    })
    test('can uninstall submariner add-ons', async () => {
        await waitForText(mockManagedClusterSet.metadata.name!, true)
        await waitForText('Details')

        await clickByText('Submariner add-ons', 0)

        await waitForText(mockSubmarinerAddon!.metadata.namespace!)
        await clickByLabel('Actions', 0)
        await clickByText('Uninstall add-on')
        await waitForText('Uninstall Submariner add-ons?')

        const deleteAddon = nockDelete(mockSubmarinerAddon)
        const deleteConfig = nockDelete(mockSubmarinerConfig)
        await clickByText('Uninstall')
        await waitForNocks([deleteAddon, deleteConfig])
    })
    test('can update a submariner config', async () => {
        await waitForText(mockManagedClusterSet.metadata.name!, true)
        await waitForText('Details')

        await clickByText('Submariner add-ons', 0)

        await waitForText(mockSubmarinerAddon!.metadata.namespace!)

        await clickByLabel('Actions', 0)
        await clickByText('Edit configuration')
        await waitForText('Edit Submariner configuration')

        const patch = nockPatch(mockSubmarinerConfig, [
            {
                op: 'replace',
                path: '/spec/IPSecNATTPort',
                value: submarinerConfigDefault.nattPort,
            },
            {
                op: 'replace',
                path: '/spec/NATTEnable',
                value: submarinerConfigDefault.nattEnable,
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
        await clickByText('Save')
        await waitForNocks([patch])
    })
    test('can remove users from cluster set', async () => {
        const nock = nockClusterList({ apiVersion: RbacApiVersion, kind: ClusterRoleBindingKind }, [
            mockClusterRoleBinding,
        ])
        await waitForText(mockManagedClusterSet.metadata.name!, true)
        await clickByText('User management', 0)
        await waitForNocks([nock])
        await waitForText('mock-user')
        await clickByLabel('Actions', 0)
        await clickByText('Remove')
        await waitForText('Remove users or groups?')
        const deleteNock = nockDelete(mockClusterRoleBinding)
        await clickByText('Remove')
        await waitForNocks([deleteNock])
    })
    test('can add users to the cluster set', async () => {
        const nock = nockClusterList({ apiVersion: RbacApiVersion, kind: ClusterRoleBindingKind }, [
            mockClusterRoleBinding,
        ])
        await waitForText(mockManagedClusterSet.metadata.name!, true)
        await clickByText('User management', 0)
        await waitForNocks([nock])
        await clickByText('Add user or group')
        await waitForText(
            'Adding a user or group will grant access permissions to the cluster set and all of its associated clusters. These permissions can be revoked at any time.'
        )
        await clickByPlaceholderText('Select user')
        await clickByText(mockUser.metadata.name!)
        await clickByText('Select role')
        await waitForText('Cluster set admin', true)
        await waitForText('Cluster set view', true)
        await waitForText('Cluster set bind', true)
        await clickByText('Cluster set admin', 1)
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
        await clickByText('Add')
        await waitForNocks([createNock])
    })

    test('can add groups to the cluster set', async () => {
        const nock = nockClusterList({ apiVersion: RbacApiVersion, kind: ClusterRoleBindingKind }, [
            mockClusterRoleBinding,
        ])
        await waitForText(mockManagedClusterSet.metadata.name!, true)
        await clickByText('User management', 0)
        await waitForNocks([nock])
        await clickByText('Add user or group')
        await waitForText(
            'Adding a user or group will grant access permissions to the cluster set and all of its associated clusters. These permissions can be revoked at any time.'
        )
        await clickByText('Groups')
        await clickByPlaceholderText('Select group')
        await clickByText(mockGroup.metadata.name!)
        await clickByText('Select role')
        await clickByText('Cluster set view')
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
        await clickByText('Add')
        await waitForNocks([createNock])
    })
})

describe('Global ClusterSetDetails page', () => {
    beforeEach(async () => {
        const getNocks = [
            nockClusterList(mockUser, [mockUser]),
            nockClusterList(mockGroup, [mockGroup]),
            nockClusterList(mockClusterRoleBinding, [mockClusterRoleBinding]),
        ]
        nockIgnoreRBAC()
        render(<Component isGlobal />)
        await waitForNocks(getNocks)
    })
    test('correct roles are present for global clustersets', async () => {
        const nock = nockClusterList({ apiVersion: RbacApiVersion, kind: ClusterRoleBindingKind }, [
            mockClusterRoleBinding,
        ])
        await waitForText(mockGlobalManagedClusterSet.metadata.name!, true)
        await clickByText('User management', 0)
        await waitForNocks([nock])
        await clickByText('Add user or group', 1)
        await waitForText(
            'Adding a user or group will grant access permissions to the cluster set and all of its associated clusters. These permissions can be revoked at any time.'
        )
        await clickByPlaceholderText('Select user')
        await clickByText(mockUser.metadata.name!)
        await clickByText('Select role')
        await waitForNotText('Cluster set admin')
        await waitForText('Cluster set view', true)
        await waitForText('Cluster set bind', true)
        await clickByText('Cluster set bind')
        const createNock = nockCreate({
            apiVersion: RbacApiVersion,
            kind: ClusterRoleBindingKind,
            metadata: {
                generateName: `${mockGlobalManagedClusterSet?.metadata.name}-`,
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
                name: `open-cluster-management:managedclusterset:bind:${mockGlobalManagedClusterSet!.metadata.name!}`,
            },
        })
        await clickByText('Add')
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
        nockClusterList(mockClusterRoleBinding, [mockClusterRoleBinding])
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
        nockClusterList(mockClusterRoleBinding, [mockClusterRoleBinding])
        render(<Component />)
        await waitForText('test-cluster-set is being deleted.')
    })
})

describe('ClusterSetDetails page without Submariner', () => {
    beforeEach(async () => {
        const getNocks = [
            nockClusterList(mockUser, [mockUser]),
            nockClusterList(mockGroup, [mockGroup]),
            nockClusterList(mockClusterRoleBinding, [mockClusterRoleBinding]),
        ]
        nockIgnoreRBAC()
        render(
            <PluginContext.Provider value={{ isSubmarinerAvailable: false }}>
                <Component />
            </PluginContext.Provider>
        )
        await waitForNocks(getNocks)
    })
    test('does not render Submariner add-ons tab', async () => {
        await waitForText(mockManagedClusterSet.metadata.name!, true)
        await waitForText('Details')

        await waitForNotText('Submariner add-ons')
    })
})

describe('ClusterSetDetails page global clusterset', () => {
    beforeEach(async () => {
        const getNocks = [
            nockClusterList(mockUser, [mockUser]),
            nockClusterList(mockGroup, [mockGroup]),
            nockClusterList(mockGlobalClusterRoleBinding, [mockGlobalClusterRoleBinding]),
        ]
        nockIgnoreRBAC()
        render(
            <PluginContext.Provider value={{ isSubmarinerAvailable: false }}>
                <Component isGlobal />
            </PluginContext.Provider>
        )
        await waitForNocks(getNocks)
    })
    test('does not render Submariner, Cluster pools or Discovered clusters tab', async () => {
        await waitForText(mockGlobalManagedClusterSet.metadata.name!, true)
        await waitForNotText('Submariner add-ons')
        await waitForNotText('Managed clusters')
        await waitForNotText('Cluster pools')
    })
})
