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
    PlacementApiVersion,
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
        secretRef: {
            name: 'secret-01',
        },
    },
}

// const channelHelm: Channel = {
//     apiVersion: ChannelApiVersion,
//     kind: ChannelKind,
//     metadata: {
//         name: 'channel-01',
//         namespace: 'channels',
//     },
//     spec: {
//         pathname: 'www.test-path.com',
//         type: 'Helm',
//         secretRef: {
//             name: 'secret-01',
//         },
//     },
// }

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
            },
        },
    },
}

const placement: Placement = {
    apiVersion: PlacementApiVersion,
    kind: PlacementKind,
    metadata: {
        name: `${argoAppSetGit.metadata.name}-placement`,
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
                    snapshot.set(channelsState, [channelGit])
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

    const initialNocks = [
        // nockList(clusterImageSet, mockClusterImageSet),
        // nockList(pick(bareMetalAsset, ['apiVersion', 'kind']), mockBareMetalAssets),

        nockGet(gitSecret),
    ]

    test('can create Git Argo Application', async () => {
        const app = render(<AddApplicationSet />)

        // appset name
        await typeByTestId('name', argoAppSetGit!.metadata!.name!)

        // select argoServer
        await clickByText('Select the Argo server')
        await clickByText(gitOpsCluster!.spec!.argoServer!.argoNamespace)

        // next - Source
        await clickByText('Next')

        // repository type
        await clickByText('Git')

        // channel
        await clickByText('Enter or select a Git URL')
        await clickByText(channelGit.spec.pathname)
        // nock.recorder.rec()
        await waitForNocks(initialNocks)
        const appBranchNock = nockArgoGitBranches(channelGit.spec.pathname, {
            branchList: [{ name: 'branch-01' }],
        })

        // branch
        await waitForNocks([appBranchNock])
        await clickByText('Enter or select a tracking revision')

        const appPathShaNock = nockArgoGitPathSha(channelGit.spec.pathname, 'branch-01', {
            commit: { sha: '01' },
        })
        const appPathTreeNock = nockArgoGitPathTree(channelGit.spec.pathname, {
            tree: [{ path: 'application-test', type: 'tree' }],
        })

        await clickByText('branch-01')
        await waitForNocks([appPathShaNock])
        await waitForNocks([appPathTreeNock])

        // path
        await clickByText('Enter or select a repository path')
        await clickByText('application-test')
        // remote namespace

        await typeByPlaceholderText('Enter the remote namespace', 'gitops-ns')

        // sync policy
        await clickByText('Next')

        // placement
        await clickByText('Next')
        await clickByText('Select the cluster sets')
        await clickByText(clusterSetBinding.spec.clusterSet)

        // submit
        const applicationSetNock = nockCreate(argoAppSetGit)
        const placementNock = nockCreate(placement)
        await clickByText('Next')
        await clickByText('Submit')

        await waitForNocks([applicationSetNock, placementNock])
    })
})
