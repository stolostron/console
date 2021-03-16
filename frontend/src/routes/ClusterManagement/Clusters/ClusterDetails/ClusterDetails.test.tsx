/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { Scope } from 'nock/types'
import { MemoryRouter, Route, Switch } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { AppContext } from '../../../../components/AppContext'
import {
    mockBadRequestStatus,
    nockClusterList,
    nockCreate,
    nockRBAC,
    nockDelete,
    nockGet,
    nockNamespacedList,
} from '../../../../lib/nock-util'
import {
    clickByLabel,
    clickByText,
    typeByText,
    waitForCalled,
    waitForNock,
    waitForNocks,
    waitForText,
    waitForNotText,
} from '../../../../lib/test-util'
import { NavigationPath } from '../../../../NavigationPath'
import {
    CertificateSigningRequestApiVersion,
    CertificateSigningRequestKind,
    CertificateSigningRequestList,
    CertificateSigningRequestListApiVersion,
    CertificateSigningRequestListKind,
} from '../../../../resources/certificate-signing-requests'
import {
    ClusterDeployment,
    ClusterDeploymentApiVersion,
    ClusterDeploymentKind,
} from '../../../../resources/cluster-deployment'
import { ClusterManagementAddOn } from '../../../../resources/cluster-management-add-on'
import { ClusterProvisionApiVersion, ClusterProvisionKind } from '../../../../resources/cluster-provision'
import { ManagedCluster, ManagedClusterApiVersion, ManagedClusterKind } from '../../../../resources/managed-cluster'
import {
    ManagedClusterAddOn,
    ManagedClusterAddOnApiVersion,
    ManagedClusterAddOnKind,
} from '../../../../resources/managed-cluster-add-on'
import {
    ManagedClusterInfo,
    ManagedClusterInfoApiVersion,
    ManagedClusterInfoKind,
} from '../../../../resources/managed-cluster-info'
import { PodApiVersion, PodKind, PodList } from '../../../../resources/pod'
import { ResourceAttributes, SelfSubjectAccessReview } from '../../../../resources/self-subject-access-review'
import ClusterDetails from './ClusterDetails'
import { configMapsState } from '../../../../atoms'
import { mockOpenShiftConsoleConfigMap } from '../../../../lib/test-metadata'

const clusterName = 'test-cluster'

const mockManagedClusterInfo: ManagedClusterInfo = {
    apiVersion: ManagedClusterInfoApiVersion,
    kind: ManagedClusterInfoKind,
    metadata: { name: clusterName, namespace: clusterName },
    status: {
        conditions: [
            {
                message: 'Accepted by hub cluster admin',
                reason: 'HubClusterAdminAccepted',
                status: 'True',
                type: 'HubAcceptedManagedCluster',
            },
        ],
        nodeList: [
            {
                name: 'ip-10-0-134-240.ec2.internal',
                labels: {
                    'beta.kubernetes.io/instance-type': 'm5.xlarge',
                    'failure-domain.beta.kubernetes.io/region': 'us-west-1',
                    'failure-domain.beta.kubernetes.io/zone': 'us-east-1c',
                    'node-role.kubernetes.io/worker': '',
                    'node.kubernetes.io/instance-type': 'm5.xlarge',
                },
                conditions: [
                    {
                        status: 'True',
                        type: 'Ready',
                    },
                ],
            },
            {
                name: 'ip-10-0-130-30.ec2.internal',
                labels: {
                    'beta.kubernetes.io/instance-type': 'm5.xlarge',
                    'failure-domain.beta.kubernetes.io/region': 'us-east-1',
                    'failure-domain.beta.kubernetes.io/zone': 'us-east-1a',
                    'node-role.kubernetes.io/master': '',
                    'node.kubernetes.io/instance-type': 'm5.xlarge',
                },
                capacity: {
                    cpu: '4',
                    memory: '15944104Ki',
                },
                conditions: [
                    {
                        status: 'Unknown',
                        type: 'Ready',
                    },
                ],
            },
            {
                name: 'ip-10-0-151-254.ec2.internal',
                labels: {
                    'beta.kubernetes.io/instance-type': 'm5.xlarge',
                    'failure-domain.beta.kubernetes.io/region': 'us-south-1',
                    'failure-domain.beta.kubernetes.io/zone': 'us-east-1b',
                    'node-role.kubernetes.io/master': '',
                    'node.kubernetes.io/instance-type': 'm5.xlarge',
                },
                capacity: {
                    cpu: '4',
                    memory: '8194000Pi',
                },
                conditions: [
                    {
                        status: 'False',
                        type: 'Ready',
                    },
                ],
            },
        ],
    },
}

const mockManagedCluster: ManagedCluster = {
    apiVersion: ManagedClusterApiVersion,
    kind: ManagedClusterKind,
    metadata: { name: clusterName },
    spec: { hubAcceptsClient: true },
}

const mockClusterDeployment: ClusterDeployment = {
    apiVersion: ClusterDeploymentApiVersion,
    kind: ClusterDeploymentKind,
    metadata: {
        labels: {
            cloud: 'AWS',
            'hive.openshift.io/cluster-platform': 'aws',
            'hive.openshift.io/cluster-region': 'us-east-1',
            region: 'us-east-1',
            vendor: 'OpenShift',
        },
        name: clusterName,
        namespace: clusterName,
        resourceVersion: '47731421',
        selfLink: '/apis/hive.openshift.io/v1/namespaces/test-cluster/clusterdeployments/test-cluster',
        uid: 'f8014b27-4756-4c0e-83ea-42833be4bf52',
    },
    spec: {
        baseDomain: 'dev02.test-chesterfield.com',
        clusterName: clusterName,
        installed: false,
        platform: {
            aws: {
                credentialsSecretRef: {
                    name: 'test-cluster-aws-creds',
                },
                region: 'us-east-1',
            },
        },
        provisioning: {
            imageSetRef: {
                name: 'img4.5.15-x86-64',
            },
            installConfigSecretRef: {
                name: 'test-cluster-install-config',
            },
            sshPrivateKeySecretRef: {
                name: 'test-cluster-ssh-private-key',
            },
        },
        pullSecretRef: {
            name: 'test-cluster-pull-secret',
        },
    },
    status: {
        cliImage:
            'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:8b8e08e498c61ccec5c446d6ab50c96792799c992c78cfce7bbb8481f04a64cb',
        conditions: [],
        installerImage:
            'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:a3ed2bf438dfa5a114aa94cb923103432cd457cac51d1c4814ae0ef7e6e9853b',
        provisionRef: {
            name: 'test-cluster-31-26h5q',
        },
    },
}

const mockCertificateSigningRequestList: CertificateSigningRequestList = {
    apiVersion: CertificateSigningRequestListApiVersion,
    kind: CertificateSigningRequestListKind,
    metadata: {
        selfLink: '/apis/certificates.k8s.io/v1beta1/certificatesigningrequests',
        resourceVersion: '48341234',
    },
    items: [],
}

const mockHiveProvisionPods: PodList = {
    kind: 'PodList',
    apiVersion: 'v1',
    metadata: { selfLink: '/api/v1/namespaces/test-cluster/pods', resourceVersion: '50100517' },
    items: [
        {
            metadata: {
                name: 'test-cluster-0-92r2t-provision-wtsph',
                generateName: 'test-cluster-0-92r2t-provision-',
                namespace: clusterName,
                selfLink: '/api/v1/namespaces/test-cluster/pods/test-cluster-0-92r2t-provision-wtsph',
                uid: '4facb96d-9737-407d-ac32-0b50bf66cc45',
                resourceVersion: '50084255',
                labels: {
                    cloud: 'AWS',
                    'controller-uid': 'a399648b-429b-4a96-928e-0396a335c3af',
                    'hive.openshift.io/cluster-deployment-name': clusterName,
                    'hive.openshift.io/cluster-platform': 'aws',
                    'hive.openshift.io/cluster-provision': 'test-cluster-0-92r2t',
                    'hive.openshift.io/cluster-provision-name': 'test-cluster-0-92r2t',
                    'hive.openshift.io/cluster-region': 'us-east-1',
                    'hive.openshift.io/install': 'true',
                    'hive.openshift.io/job-type': 'provision',
                    'job-name': 'test-cluster-0-92r2t-provision',
                    region: 'us-east-1',
                    vendor: 'OpenShift',
                },
            },
        },
    ],
}

const mockmanagedClusterAddOn: ManagedClusterAddOn = {
    apiVersion: ManagedClusterAddOnApiVersion,
    kind: ManagedClusterAddOnKind,
    metadata: {
        name: 'application-manager',
        namespace: clusterName,
    },
    spec: {},
}

const mockManagedClusterAddOnApp: ManagedClusterAddOn = {
    apiVersion: ManagedClusterAddOnApiVersion,
    kind: ManagedClusterAddOnKind,
    metadata: {
        name: 'application-manager',
        namespace: clusterName,
    },
    spec: {},
    status: {
        conditions: [
            {
                lastTransitionTime: '',
                message: 'Progressing',
                reason: 'Progressing',
                status: 'True',
                type: 'Progressing',
            },
        ],
        addOnMeta: {
            displayName: 'application-manager',
            description: 'application-manager description',
        },
        addOnConfiguration: {
            crdName: 'klusterletaddonconfig',
            crName: clusterName,
        },
    },
}

const mockManagedClusterAddOnWork: ManagedClusterAddOn = {
    apiVersion: 'addon.open-cluster-management.io/v1alpha1',
    kind: 'ManagedClusterAddOn',
    metadata: {
        name: 'work-manager',
        namespace: clusterName,
    },
    spec: {},
    status: {
        conditions: [
            {
                lastTransitionTime: '',
                message: 'Degraded',
                reason: 'Degraded',
                status: 'True',
                type: 'Degraded',
            },
        ],
        addOnMeta: {
            displayName: 'work-manager',
            description: 'work-manager description',
        },
        addOnConfiguration: {
            crdName: 'klusterletaddonconfig',
            crName: clusterName,
        },
    },
}

const mockManagedClusterAddOnCert: ManagedClusterAddOn = {
    apiVersion: 'addon.open-cluster-management.io/v1alpha1',
    kind: 'ManagedClusterAddOn',
    metadata: {
        name: 'cert-policy-controller',
        namespace: clusterName,
    },
    spec: {},
    status: {
        conditions: [
            {
                lastTransitionTime: '',
                message: 'Available',
                reason: 'Available',
                status: 'True',
                type: 'Available',
            },
        ],
        addOnMeta: {
            displayName: 'cert-policy-controller',
            description: 'cert-policy-controller description',
        },
        addOnConfiguration: {
            crdName: 'klusterletaddonconfig',
            crName: clusterName,
        },
    },
}

const mockManagedClusterAddOnPolicy: ManagedClusterAddOn = {
    apiVersion: 'addon.open-cluster-management.io/v1alpha1',
    kind: 'ManagedClusterAddOn',
    metadata: {
        uid: '',
        name: 'policy-controller',
        namespace: clusterName,
    },
    spec: {},
    status: {
        conditions: [
            {
                lastTransitionTime: '',
                message: 'Progressing',
                reason: 'Progressing',
                status: 'False',
                type: 'Progressing',
            },
        ],
        addOnMeta: {
            displayName: 'policy-controller',
            description: 'policy-controller description',
        },
        addOnConfiguration: {
            crdName: 'klusterletaddonconfig',
            crName: clusterName,
        },
    },
}

const mockManagedClusterAddOnSearch: ManagedClusterAddOn = {
    apiVersion: 'addon.open-cluster-management.io/v1alpha1',
    kind: 'ManagedClusterAddOn',
    metadata: {
        uid: '',
        name: 'search-collector',
        namespace: clusterName,
    },
    spec: {},
    status: {
        conditions: [
            {
                lastTransitionTime: '',
                message: 'Unknown',
                reason: 'Unknown',
                status: 'True',
                type: 'Unknown',
            },
        ],
        addOnMeta: {
            displayName: 'search-collector',
            description: 'search-collector description',
        },
        addOnConfiguration: {
            crdName: 'klusterletaddonconfig',
            crName: clusterName,
        },
    },
}

const mockSelfSubjectAccessResponse: SelfSubjectAccessReview = {
    apiVersion: 'authorization.k8s.io/v1',
    kind: 'SelfSubjectAccessReview',
    metadata: {},
    spec: {
        resourceAttributes: {
            namespace: clusterName,
            resource: 'secrets',
            verb: 'get',
        },
    },
    status: {
        allowed: true,
    },
}

const mockGetSecretSelfSubjectAccessRequest: SelfSubjectAccessReview = {
    apiVersion: 'authorization.k8s.io/v1',
    kind: 'SelfSubjectAccessReview',
    metadata: {},
    spec: {
        resourceAttributes: {
            namespace: clusterName,
            resource: 'secrets',
            verb: 'get',
            group: '',
        },
    },
}
const mockClusterManagementAddons: ClusterManagementAddOn[] = [
    {
        apiVersion: 'addon.open-cluster-management.io/v1alpha1',
        kind: 'ClusterManagementAddOn',
        metadata: {
            name: 'application-manager',
            annotations: {
                'console.open-cluster-management.io/launch-link': '/cma/grafana',
                'console.open-cluster-management.io/launch-link-text': 'Grafana',
            },
        },
        spec: {
            addOnConfiguration: { crName: '', crdName: 'klusterletaddonconfigs.agent.open-cluster-management.io' },
            addOnMeta: {
                description: 'Processes events and other requests to managed resources.',
                displayName: 'Application Manager',
            },
        },
    },
    {
        apiVersion: 'addon.open-cluster-management.io/v1alpha1',
        kind: 'ClusterManagementAddOn',
        metadata: {
            name: 'cert-policy-controller',
        },
        spec: {
            addOnConfiguration: { crName: '', crdName: 'klusterletaddonconfigs.agent.open-cluster-management.io' },
            addOnMeta: {
                description: 'Monitors certificate expiration based on distributed policies.',
                displayName: 'Cert Policy Controller',
            },
        },
    },
    {
        apiVersion: 'addon.open-cluster-management.io/v1alpha1',
        kind: 'ClusterManagementAddOn',
        metadata: {
            name: 'iam-policy-controller',
        },
        spec: {
            addOnConfiguration: { crName: '', crdName: 'klusterletaddonconfigs.agent.open-cluster-management.io' },
            addOnMeta: {
                description: 'Monitors identity controls based on distributed policies.',
                displayName: 'IAM Policy Controller',
            },
        },
    },
    {
        apiVersion: 'addon.open-cluster-management.io/v1alpha1',
        kind: 'ClusterManagementAddOn',
        metadata: {
            name: 'policy-controller',
        },
        spec: {
            addOnConfiguration: { crName: '', crdName: 'klusterletaddonconfigs.agent.open-cluster-management.io' },
            addOnMeta: {
                description: 'Distributes configured policies and monitors Kubernetes-based policies.',
                displayName: 'Policy Controller',
            },
        },
    },
    {
        apiVersion: 'addon.open-cluster-management.io/v1alpha1',
        kind: 'ClusterManagementAddOn',
        metadata: {
            name: 'search-collector',
        },
        spec: {
            addOnConfiguration: { crName: '', crdName: 'klusterletaddonconfigs.agent.open-cluster-management.io' },
            addOnMeta: {
                description: 'Collects cluster data to be indexed by search components on the hub cluster.',
                displayName: 'Search Collector',
            },
        },
    },
    {
        apiVersion: 'addon.open-cluster-management.io/v1alpha1',
        kind: 'ClusterManagementAddOn',
        metadata: {
            name: 'work-manager',
        },
        spec: {
            addOnConfiguration: { crName: '', crdName: 'klusterletaddonconfigs.agent.open-cluster-management.io' },
            addOnMeta: {
                description: 'Handles endpoint work requests and managed cluster status.',
                displayName: 'Work Manager',
            },
        },
    },
]

const mockmanagedClusterAddOns: ManagedClusterAddOn[] = [
    mockManagedClusterAddOnApp,
    mockManagedClusterAddOnWork,
    mockManagedClusterAddOnCert,
    mockManagedClusterAddOnPolicy,
    mockManagedClusterAddOnSearch,
]

const mockClusterProvisionList = {
    apiVersion: 'hive.openshift.io/v1',
    items: [
        {
            apiVersion: 'hive.openshift.io/v1',
            kind: 'ClusterProvision',
            metadata: {
                creationTimestamp: '2021-01-04T18:23:30Z',
                labels: {
                    cloud: 'GCP',
                    'hive.openshift.io/cluster-deployment-name': 'test-cluster',
                    'hive.openshift.io/cluster-platform': 'gcp',
                    'hive.openshift.io/cluster-region': 'us-east1',
                    region: 'us-east1',
                    vendor: 'OpenShift',
                },
                name: 'test-cluster-0-hmd44',
                namespace: 'test-cluster',
            },
            spec: {
                attempt: 0,
                clusterDeploymentRef: { name: 'test-cluster' },
                installLog:
                    'level=info msg="Credentials loaded from environment variable \\"GOOGLE_CREDENTIALS\\", file \\"/.gcp/osServiceAccount.json\\""\nlevel=fatal msg="failed to fetch Master Machines: failed to load asset \\"Install Config\\": platform.gcp.project: Invalid value: \\"gc-acm-dev-fake\\": invalid project ID"\n',
            },
            status: {
                conditions: [
                    {
                        lastProbeTime: '2021-01-04T18:23:30Z',
                        lastTransitionTime: '2021-01-04T18:23:30Z',
                        message: 'Install job has been created',
                        reason: 'JobCreated',
                        status: 'True',
                        type: 'ClusterProvisionJobCreated',
                    },
                    {
                        lastProbeTime: '2021-01-04T18:23:37Z',
                        lastTransitionTime: '2021-01-04T18:23:37Z',
                        message: 'Invalid GCP project ID',
                        reason: 'GCPInvalidProjectID',
                        status: 'True',
                        type: 'ClusterProvisionFailed',
                    },
                ],
            },
        },
    ],
    kind: 'ClusterProvisionList',
    metadata: {
        selfLink: '/apis/hive.openshift.io/v1/namespaces/test-cluster/clusterprovisions',
    },
}

const nockGetManagedClusterInfo = () => nockGet(mockManagedClusterInfo, undefined, 200, true)
const nockGetClusterDeployment = () => nockGet(mockClusterDeployment)
const nockListCertificateSigningRequests = () =>
    nockClusterList(
        { apiVersion: CertificateSigningRequestApiVersion, kind: CertificateSigningRequestKind },
        mockCertificateSigningRequestList,
        ['open-cluster-management.io/cluster-name=test-cluster']
    )
const nockGetManagedCluster = () => nockGet(mockManagedCluster)
const nockListClusterProvision = () =>
    nockNamespacedList(
        {
            apiVersion: ClusterProvisionApiVersion,
            kind: ClusterProvisionKind,
            metadata: { namespace: 'test-cluster' },
        },
        mockClusterProvisionList
    )

const nockGetManagedClusterAddons = () => nockNamespacedList(mockmanagedClusterAddOn, mockmanagedClusterAddOns)
const nockListHiveProvisionJobs = () =>
    nockNamespacedList(
        { apiVersion: PodApiVersion, kind: PodKind, metadata: { namespace: clusterName } },
        mockHiveProvisionPods,
        ['hive.openshift.io/cluster-deployment-name=test-cluster', 'hive.openshift.io/job-type=provision']
    )

const nockGetManagedClusterError = () => nockGet(mockManagedCluster, mockBadRequestStatus, 400)
const nockGetManagedClusterInfoError = () => nockGet(mockManagedClusterInfo, mockBadRequestStatus, 400)
const nockGetClusterDeploymentError = () => nockGet(mockClusterDeployment, mockBadRequestStatus, 400)
const nockListManagedClusterAddonsError = () => nockNamespacedList(mockmanagedClusterAddOn, mockBadRequestStatus)

function getPatchClusterResourceAttributes(name: string) {
    return {
        resource: 'managedclusters',
        verb: 'patch',
        group: 'cluster.open-cluster-management.io',
        name,
    } as ResourceAttributes
}
function getDeleteClusterResourceAttributes(name: string) {
    return {
        resource: 'managedclusters',
        verb: 'delete',
        group: 'cluster.open-cluster-management.io',
        name: name,
    } as ResourceAttributes
}
function getDeleteDeploymentResourceAttributes(name: string) {
    return {
        resource: 'clusterdeployments',
        verb: 'delete',
        group: 'hive.openshift.io',
        name,
        namespace: name,
    } as ResourceAttributes
}

const Component = () => (
    <RecoilRoot
        initializeState={(snapshot) => {
            snapshot.set(configMapsState, [mockOpenShiftConsoleConfigMap])
        }}
    >
        <MemoryRouter initialEntries={[NavigationPath.clusterDetails.replace(':id', clusterName)]}>
            <AppContext.Provider value={{ clusterManagementAddons: mockClusterManagementAddons, featureGates: {} }}>
                <Switch>
                    <Route path={NavigationPath.clusterDetails} component={ClusterDetails} />
                </Switch>
            </AppContext.Provider>
        </MemoryRouter>
    </RecoilRoot>
)

function defaultNocks() {
    const nocks: Scope[] = [
        nockGetManagedClusterInfo(),
        nockGetClusterDeployment(),
        nockListCertificateSigningRequests(),
        nockGetManagedClusterAddons(),
        nockGetManagedCluster(),
        nockListHiveProvisionJobs(),
        nockListClusterProvision(),
        nockCreate(mockGetSecretSelfSubjectAccessRequest, mockSelfSubjectAccessResponse),
        nockRBAC(getPatchClusterResourceAttributes('test-cluster')),
    ]
    return nocks
}

describe('ClusterDetails', () => {
    test('page renders error state', async () => {
        const nocks = [
            nockGetManagedClusterError(),
            nockGetManagedClusterInfoError(),
            nockGetClusterDeploymentError(),
            nockListCertificateSigningRequests(),
            nockGetManagedClusterAddons(),
            nockCreate(mockGetSecretSelfSubjectAccessRequest, mockSelfSubjectAccessResponse),
        ]
        render(<Component />)
        await waitForNocks(nocks)
        await waitForText('Bad request')
    })

    test('overview page renders', async () => {
        const nocks = defaultNocks()
        render(<Component />)
        await waitForNocks(nocks)

        await waitForText(clusterName, true)
        await waitForText('tab.overview')
        await waitForText('table.details')
    })

    test('overview page opens logs', async () => {
        const nocks = defaultNocks()
        render(<Component />)
        await waitForNocks(nocks)

        window.open = jest.fn()
        await clickByText('view.logs')
        await waitForCalled(window.open as jest.Mock)
    })

    test('overview page opens edit labels', async () => {
        const nocks = defaultNocks()
        render(<Component />)
        await waitForNocks(nocks)

        await waitForText(clusterName, true)

        await clickByLabel('common:labels.edit.title')
        await waitForText('labels.description')

        await clickByText('common:cancel')
        await waitForNotText('labels.description')
    })

    test('nodes page renders', async () => {
        const nocks = defaultNocks()
        render(<Component />)
        await waitForNocks(nocks)

        await clickByText('tab.nodes')
        await waitForText(mockManagedClusterInfo.status?.nodeList?.[0].name!)

        await clickByText('table.role')
        await waitForText(mockManagedClusterInfo.status?.nodeList?.[0].name!)

        await clickByText('table.region')
        await waitForText(mockManagedClusterInfo.status?.nodeList?.[0].name!)
    })

    test('settings page renders', async () => {
        const nocks = defaultNocks()
        render(<Component />)
        await waitForNocks(nocks)

        await clickByText('tab.settings')
        await waitForText(mockmanagedClusterAddOns[0].metadata.name!)
    })

    test('should show error if the ManagedClusterAddons fail to query', async () => {
        const nocks = [
            nockGetManagedClusterInfo(),
            nockGetClusterDeployment(),
            nockListCertificateSigningRequests(),
            nockListManagedClusterAddonsError(),
            nockGetManagedCluster(),
            nockListClusterProvision(),
            nockCreate(mockGetSecretSelfSubjectAccessRequest, mockSelfSubjectAccessResponse),
            nockRBAC(getPatchClusterResourceAttributes('test-cluster')),
        ]
        render(<Component />)
        await waitForNocks(nocks)

        await clickByText('tab.settings')
        await waitForText('Bad request')
    })

    test('overview page handles detach', async () => {
        const nocks = defaultNocks()
        const rbacNocks = [
            nockRBAC(getPatchClusterResourceAttributes('test-cluster')),
            nockRBAC(getDeleteClusterResourceAttributes('test-cluster')),
            nockRBAC(getDeleteClusterResourceAttributes('test-cluster')),
            nockRBAC(getDeleteDeploymentResourceAttributes('test-cluster')),
        ]
        render(<Component />)
        await waitForNocks(nocks)

        await clickByText('actions')
        await waitForNocks(rbacNocks)

        await clickByText('managed.detached')
        await typeByText('type.to.confirm', mockManagedCluster.metadata.name!)

        const deleteNock = nockDelete(mockManagedCluster)
        await clickByText('detach')
        await waitForNock(deleteNock)
    })

    test('overview page handles destroy', async () => {
        const nocks = defaultNocks()
        const rbacNocks = [
            nockRBAC(getPatchClusterResourceAttributes('test-cluster')),
            nockRBAC(getDeleteClusterResourceAttributes('test-cluster')),
            nockRBAC(getDeleteClusterResourceAttributes('test-cluster')),
            nockRBAC(getDeleteDeploymentResourceAttributes('test-cluster')),
        ]
        render(<Component />)
        await waitForNocks(nocks)

        await clickByText('actions')
        await waitForNocks(rbacNocks)
        await clickByText('managed.destroySelected')
        await typeByText('type.to.confirm', mockManagedCluster.metadata.name!)

        const deleteNocks: Scope[] = [nockDelete(mockManagedCluster), nockDelete(mockClusterDeployment)]
        await clickByText('destroy')
        await waitForNocks(deleteNocks)
    })
})
