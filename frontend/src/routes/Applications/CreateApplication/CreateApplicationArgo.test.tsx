/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import {
    channelsState,
    gitOpsClustersState,
    managedClusterSetBindingsState,
    namespacesState,
    placementsState,
    secretsState,
} from '../../../atoms'
import {
    nockArgoGitBranches,
    nockArgoGitPathSha,
    nockArgoGitPathTree,
    nockCreate,
    nockGet,
} from '../../../lib/nock-util'
import { clickByText, typeByPlaceholderText, typeByTestId, waitForNocks } from '../../../lib/test-util'
import { NavigationPath } from '../../../NavigationPath'
import {
    ApplicationSet,
    ApplicationSetApiVersion,
    ApplicationSetKind,
    Channel,
    ChannelApiVersion,
    ChannelKind,
    GitOpsCluster,
    GitOpsClusterApiVersion,
    GitOpsClusterKind,
    ManagedClusterSetBinding,
    ManagedClusterSetBindingApiVersion,
    ManagedClusterSetBindingKind,
    Namespace,
    NamespaceApiVersion,
    NamespaceKind,
    Placement,
    PlacementApiVersionBeta,
    PlacementKind,
    Secret,
    SecretApiVersion,
    SecretKind,
} from '../../../resources'
import CreateApplicationArgo from './CreateApplicationArgo'

const gitOpsCluster: GitOpsCluster = {
    apiVersion: GitOpsClusterApiVersion,
    kind: GitOpsClusterKind,
    metadata: {
        name: 'argo-server-1',
        namespace: 'argo-server-1',
    },
    spec: {
        argoServer: {
            argoNamespace: 'argo-server-1',
            // cluster?:
        },
    },
}

const channelGit: Channel = {
    apiVersion: ChannelApiVersion,
    kind: ChannelKind,
    metadata: {
        name: 'channel-01',
        namespace: 'application-01',
    },
    spec: {
        pathname: 'https://github.com/stolostron/application-lifecycle-samples',
        type: 'Git',
        // secretRef: {
        //     name: 'secret-01',
        // },
    },
}

const channelHelm: Channel = {
    apiVersion: ChannelApiVersion,
    kind: ChannelKind,
    metadata: {
        name: 'channel-01',
        namespace: 'channels',
    },
    spec: {
        pathname: 'http://multiclusterhub-repo.open-cluster-management.svc.cluster.local:3000/charts',
        type: 'HelmRepo',
        // secretRef: {
        //     name: 'secret-01',
        // },
    },
}

const clusterSetBinding: ManagedClusterSetBinding = {
    apiVersion: ManagedClusterSetBindingApiVersion,
    kind: ManagedClusterSetBindingKind,
    metadata: {
        name: 'cluster-set-binding-01',
        namespace: 'argo-server-1',
    },
    spec: {
        clusterSet: 'cluster-set-01',
    },
}

const namespace: Namespace = {
    apiVersion: NamespaceApiVersion,
    kind: NamespaceKind,
    metadata: {
        name: 'default',
    },
}

const gitSecret: Secret = {
    apiVersion: SecretApiVersion,
    kind: SecretKind,
    metadata: {
        name: 'secret-01',
        namespace: 'application-01',
    },
    stringData: {},
}

const argoAppSetGit: ApplicationSet = {
    apiVersion: ApplicationSetApiVersion,
    kind: ApplicationSetKind,
    metadata: {
        name: 'application-01',
        namespace: 'argo-server-1',
    },
    spec: {
        generators: [
            {
                clusterDecisionResource: {
                    configMapRef: 'acm-placement',
                    labelSelector: {
                        matchLabels: {
                            'cluster.open-cluster-management.io/placement': 'application-01-placement',
                        },
                    },
                    requeueAfterSeconds: 180,
                },
            },
        ],
        template: {
            metadata: {
                name: 'application-01-{{name}}',
            },
            spec: {
                project: 'default',
                source: {
                    repoURL: channelGit.spec.pathname,
                    targetRevision: 'branch-01',
                    path: 'application-test',
                },
                destination: {
                    namespace: 'gitops-ns',
                    server: '{{server}}',
                },
                syncPolicy: { automated: { selfHeal: true }, syncOptions: ['CreateNamespace=true'] },
            },
        },
    },
}

const chartName = 'multicluster-test-chart'

const argoAppSetHelm: ApplicationSet = {
    apiVersion: ApplicationSetApiVersion,
    kind: ApplicationSetKind,
    metadata: {
        name: 'helm-application-01',
        namespace: 'argo-server-1',
    },
    spec: {
        generators: [
            {
                clusterDecisionResource: {
                    configMapRef: 'acm-placement',
                    labelSelector: {
                        matchLabels: {
                            'cluster.open-cluster-management.io/placement': 'helm-application-01-placement',
                        },
                    },
                    requeueAfterSeconds: 180,
                },
            },
        ],

        template: {
            metadata: {
                name: 'helm-application-01-{{name}}',
            },
            spec: {
                project: 'default',
                source: {
                    repoURL: channelHelm.spec.pathname,
                    chart: chartName,
                    targetRevision: 'v1',
                },
                destination: {
                    namespace: 'gitops-ns',
                    server: '{{server}}',
                },
                syncPolicy: { automated: { selfHeal: true }, syncOptions: ['CreateNamespace=true'] },
            },
        },
    },
}

const placementGit: Placement = {
    apiVersion: PlacementApiVersionBeta,
    kind: PlacementKind,
    metadata: {
        name: `${argoAppSetGit.metadata.name}-placement`,
        namespace: gitOpsCluster.metadata.namespace,
    },
    spec: {
        clusterSets: [clusterSetBinding.spec.clusterSet],
    },
}
const placementHelm: Placement = {
    apiVersion: PlacementApiVersionBeta,
    kind: PlacementKind,
    metadata: {
        name: `${argoAppSetHelm.metadata.name}-placement`,
        namespace: gitOpsCluster.metadata.namespace,
    },
    spec: {
        clusterSets: [clusterSetBinding.spec.clusterSet],
    },
}

describe('Create Argo Application Set', () => {
    const AddApplicationSet = () => {
        return (
            <RecoilRoot
                initializeState={(snapshot) => {
                    snapshot.set(placementsState, [])
                    snapshot.set(gitOpsClustersState, [gitOpsCluster])
                    snapshot.set(channelsState, [channelGit, channelHelm])
                    snapshot.set(namespacesState, [namespace])
                    snapshot.set(secretsState, [])
                    snapshot.set(managedClusterSetBindingsState, [clusterSetBinding])
                }}
            >
                <MemoryRouter initialEntries={[NavigationPath.createApplicationArgo]}>
                    <Route component={() => <CreateApplicationArgo />} />
                </MemoryRouter>
            </RecoilRoot>
        )
    }

    test('can create Argo Application Set with Git', async () => {
        const initialNocks = [nockGet(gitSecret)]
        render(<AddApplicationSet />)
        await waitForNocks(initialNocks)

        // General
        await typeByTestId('name', argoAppSetGit!.metadata!.name!)
        await clickByText('Select the Argo server')
        await clickByText(gitOpsCluster!.spec!.argoServer!.argoNamespace)
        await clickByText('Next')

        // Template
        await clickByText('Git')
        await clickByText('Enter or select a Git URL')

        const appBranchNocks = [nockArgoGitBranches(channelGit.spec.pathname, { branchList: [{ name: 'branch-01' }] })]
        await clickByText(channelGit.spec.pathname)
        await waitForNocks(appBranchNocks)

        await clickByText('Enter or select a tracking revision')
        const pathNocks = [
            nockArgoGitPathSha(channelGit.spec.pathname, 'branch-01', { commit: { sha: '01' } }),
            nockArgoGitPathTree(channelGit.spec.pathname, { tree: [{ path: 'application-test', type: 'tree' }] }),
        ]
        await clickByText('branch-01')
        await waitForNocks(pathNocks)

        await clickByText('Enter or select a repository path')
        await clickByText('application-test')

        await typeByPlaceholderText('Enter the remote namespace', 'gitops-ns')
        const nextNocks = [
            nockArgoGitBranches(channelGit.spec.pathname, { branchList: [{ name: 'branch-01' }] }),
            nockArgoGitPathSha(channelGit.spec.pathname, 'branch-01', { commit: { sha: '01' } }),
            nockArgoGitPathTree(channelGit.spec.pathname, { tree: [{ path: 'application-test', type: 'tree' }] }),
        ]
        await clickByText('Next')
        await waitForNocks(nextNocks)

        // Sync policy
        await clickByText('Next')

        // Placement
        await clickByText('Select the cluster sets')
        await clickByText(clusterSetBinding.spec.clusterSet)
        await clickByText('Next')

        // Review
        const createGitAppSetNocks = [nockCreate(argoAppSetGit), nockCreate(placementGit)]
        await clickByText('Submit')
        await waitForNocks(createGitAppSetNocks)
    })

    test('can create an Application Set with Helm', async () => {
        render(<AddApplicationSet />)

        // appset name
        await typeByTestId('name', argoAppSetHelm!.metadata!.name!)

        // select argoServer
        await clickByText('Select the Argo server')
        await clickByText(gitOpsCluster!.spec!.argoServer!.argoNamespace)

        // next - Source
        await clickByText('Next')

        /////////////////////////////////////////

        // repository type
        await clickByText('Helm')

        // channel
        await clickByText('Enter or select a Helm URL')
        await clickByText(channelHelm.spec.pathname)
        // // nock.recorder.rec()

        await typeByPlaceholderText('Enter the chart name', chartName)
        await typeByPlaceholderText('Enter the package version', 'v1')

        // remote namespace
        await typeByPlaceholderText('Enter the remote namespace', 'gitops-ns')
        await clickByText('Next')

        // sync policy
        await clickByText('Next')

        // placement
        await clickByText('Select the cluster sets')
        await clickByText(clusterSetBinding.spec.clusterSet)

        // submit
        const createHelmAppSetNocks = [nockCreate(argoAppSetHelm), nockCreate(placementHelm)]
        await clickByText('Next')
        await clickByText('Submit')

        await waitForNocks(createHelmAppSetNocks)
    })
})
