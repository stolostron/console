import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { MemoryRouter, Route, Switch } from 'react-router-dom'
import { AppContext } from '../../../../components/AppContext'
import {
    mockBadRequestStatus,
    nockClusterList,
    nockCreate,
    nockGet,
    nockNamespacedList,
} from '../../../../lib/nock-util'
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
import { SelfSubjectAccessReview } from '../../../../resources/self-subject-access-review'
import ClusterDetails from './ClusterDetails'

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
                        status: 'True',
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
                        status: 'True',
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
            name: '',
            resource: 'secret',
            verb: 'get',
            version: 'v1',
        },
    },
    status: {
        allowed: true,
    },
}

const mockSelfSubjectAccessRequest: SelfSubjectAccessReview = {
    apiVersion: 'authorization.k8s.io/v1',
    kind: 'SelfSubjectAccessReview',
    metadata: {},
    spec: {
        resourceAttributes: {
            namespace: clusterName,
            resource: 'secret',
            verb: 'get',
            version: 'v1',
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

const nockGetManagedClusterInfoError = () => nockGet(mockManagedClusterInfo, mockBadRequestStatus, 400)
const nockGetClusterDeploymentError = () => nockGet(mockClusterDeployment, mockBadRequestStatus, 400)
const nockListManagedClusterAddonsError = () => nockNamespacedList(mockmanagedClusterAddOn, mockBadRequestStatus)
// const nockManagedClusterError = () => nockGet(mockManagedCluster, mockBadRequestStatus, 400)

const Component = () => (
    <MemoryRouter initialEntries={[NavigationPath.clusterDetails.replace(':id', clusterName)]}>
        <AppContext.Provider value={{ clusterManagementAddons: mockClusterManagementAddons, featureGates: {} }}>
            <Switch>
                <Route path={NavigationPath.clusterDetails} component={ClusterDetails} />
            </Switch>
        </AppContext.Provider>
    </MemoryRouter>
)

describe('ClusterDetails', () => {
    test('page renders error state', async () => {
        const mciScope = nockGetManagedClusterInfoError()
        const cdScope = nockGetClusterDeploymentError()
        const csrScope = nockListCertificateSigningRequests()
        const mcaScope = nockGetManagedClusterAddons()
        const managedClusterNock = nockGetManagedCluster()
        const nockRbac = nockCreate(mockSelfSubjectAccessRequest, mockSelfSubjectAccessResponse)
        render(<Component />)
        await waitFor(() => expect(mciScope.isDone()).toBeTruthy())
        await waitFor(() => expect(cdScope.isDone()).toBeTruthy())
        await waitFor(() => expect(csrScope.isDone()).toBeTruthy())
        await waitFor(() => expect(mcaScope.isDone()).toBeTruthy())
        await waitFor(() => expect(managedClusterNock.isDone()).toBeTruthy())
        await waitFor(() => expect(nockRbac.isDone()).toBeTruthy())
        await act(async () => {
            await waitFor(() => expect(screen.getByText('Error')).toBeInTheDocument(), { timeout: 2000 })
        })
    })

    test('overview page renders', async () => {
        window.open = jest.fn()
        const mciScope = nockGetManagedClusterInfo()
        const cdScope = nockGetClusterDeployment()
        const csrScope = nockListCertificateSigningRequests()
        const mcaScope = nockGetManagedClusterAddons()
        const managedClusterNock = nockGetManagedCluster()
        const hiveScope = nockListHiveProvisionJobs()
        const nockRbac = nockCreate(mockSelfSubjectAccessRequest)
        const listClusterProvisionsNock = nockListClusterProvision()
        render(<Component />)
        await waitFor(() => expect(mciScope.isDone()).toBeTruthy())
        await waitFor(() => expect(cdScope.isDone()).toBeTruthy())
        await waitFor(() => expect(csrScope.isDone()).toBeTruthy())
        await waitFor(() => expect(mcaScope.isDone()).toBeTruthy())
        await waitFor(() => expect(managedClusterNock.isDone()).toBeTruthy())
        await waitFor(() => expect(hiveScope.isDone()).toBeTruthy())
        await waitFor(() => expect(nockRbac.isDone()).toBeTruthy())
        await waitFor(() => expect(listClusterProvisionsNock.isDone()).toBeTruthy())
        await act(async () => {
            await waitFor(() => expect(screen.queryAllByText(clusterName)).toBeTruthy(), { timeout: 2000 })
            await waitFor(() => expect(screen.getByText('tab.overview')).toBeInTheDocument())
            await waitFor(() => expect(screen.getByText('table.details')).toBeInTheDocument())
            await waitFor(() => expect(screen.getByText('view.logs')).toBeInTheDocument())
            userEvent.click(screen.getByText('view.logs'))
            await new Promise((resolve) => setTimeout(resolve, 500))
            expect(window.open).toHaveBeenCalled()
        })
    })

    test('nodes page renders', async () => {
        const mciScope = nockGetManagedClusterInfo()
        const cdScope = nockGetClusterDeployment()
        const csrScope = nockListCertificateSigningRequests()
        const mcaScope = nockGetManagedClusterAddons()
        const managedClusterNock = nockGetManagedCluster()
        const nockRbac = nockCreate(mockSelfSubjectAccessRequest, mockSelfSubjectAccessResponse)
        const listClusterProvisionsNock = nockListClusterProvision()

        render(<Component />)
        await waitFor(() => expect(mciScope.isDone()).toBeTruthy())
        await waitFor(() => expect(cdScope.isDone()).toBeTruthy())
        await waitFor(() => expect(csrScope.isDone()).toBeTruthy())
        await waitFor(() => expect(mcaScope.isDone()).toBeTruthy())
        await waitFor(() => expect(managedClusterNock.isDone()).toBeTruthy())
        await waitFor(() => expect(nockRbac.isDone()).toBeTruthy())
        await waitFor(() => expect(listClusterProvisionsNock.isDone()).toBeTruthy())

        await act(async () => {
            await waitFor(() => expect(screen.queryAllByText(clusterName)).toBeTruthy(), { timeout: 10000 })
            await waitFor(() => expect(screen.getByText('tab.nodes')).toBeInTheDocument())
            userEvent.click(screen.getByText('tab.nodes'))
            await waitFor(() =>
                expect(screen.getByText(mockManagedClusterInfo.status?.nodeList?.[0].name!)).toBeInTheDocument()
            )
            userEvent.click(screen.getByText('table.role'))
            await waitFor(() =>
                expect(screen.getByText(mockManagedClusterInfo.status?.nodeList?.[0].name!)).toBeInTheDocument()
            )
            userEvent.click(screen.getByText('table.region'))
            await waitFor(() =>
                expect(screen.getByText(mockManagedClusterInfo.status?.nodeList?.[0].name!)).toBeInTheDocument()
            )
        })
    })

    test('settings page renders', async () => {
        const mciScope = nockGetManagedClusterInfo()
        const cdScope = nockGetClusterDeployment()
        const csrScope = nockListCertificateSigningRequests()
        const mcaScope = nockGetManagedClusterAddons()
        const managedClusterNock = nockGetManagedCluster()
        const nockRbac = nockCreate(mockSelfSubjectAccessRequest, mockSelfSubjectAccessResponse)
        const listClusterProvisionsNock = nockListClusterProvision()

        render(<Component />)
        await waitFor(() => expect(mciScope.isDone()).toBeTruthy())
        await waitFor(() => expect(cdScope.isDone()).toBeTruthy())
        await waitFor(() => expect(csrScope.isDone()).toBeTruthy())
        await waitFor(() => expect(mcaScope.isDone()).toBeTruthy())
        await waitFor(() => expect(managedClusterNock.isDone()).toBeTruthy())
        await waitFor(() => expect(nockRbac.isDone()).toBeTruthy())
        await waitFor(() => expect(listClusterProvisionsNock.isDone()).toBeTruthy())

        await act(async () => {
            await waitFor(() => expect(screen.queryAllByText(clusterName)).toBeTruthy(), { timeout: 10000 })
            await waitFor(() => expect(screen.getByText('tab.settings')).toBeInTheDocument())
            userEvent.click(screen.getByText('tab.settings'))
            await waitFor(() =>
                expect(screen.getByText(mockmanagedClusterAddOns[0].metadata.name!)).toBeInTheDocument()
            )
        })
    })
    test('should show error if the ManagedClusterAddons fail to query', async () => {
        const mciScope = nockGetManagedClusterInfo()
        const cdScope = nockGetClusterDeployment()
        const csrScope = nockListCertificateSigningRequests()
        const mcaScope = nockListManagedClusterAddonsError()
        const managedClusterNock = nockGetManagedCluster()
        const nockRbac = nockCreate(mockSelfSubjectAccessRequest, mockSelfSubjectAccessResponse)
        const listClusterProvisionsNock = nockListClusterProvision()

        render(<Component />)
        await waitFor(() => expect(mciScope.isDone()).toBeTruthy())
        await waitFor(() => expect(cdScope.isDone()).toBeTruthy())
        await waitFor(() => expect(csrScope.isDone()).toBeTruthy())
        await waitFor(() => expect(mcaScope.isDone()).toBeTruthy())
        await waitFor(() => expect(managedClusterNock.isDone()).toBeTruthy())
        await waitFor(() => expect(nockRbac.isDone()).toBeTruthy())
        await waitFor(() => expect(listClusterProvisionsNock.isDone()).toBeTruthy())

        await act(async () => {
            await waitFor(() => expect(screen.queryAllByText('test-cluster')).toBeTruthy(), { timeout: 10000 })
            await waitFor(() => expect(screen.getByText('tab.settings')).toBeInTheDocument())
            userEvent.click(screen.getByText('tab.settings'))
            await waitFor(() => expect(screen.queryByText('Loading')).toBeNull(), { timeout: 10000 })
            await waitFor(() => expect(screen.getByText('Bad request')).toBeInTheDocument())
        })
    })
})
