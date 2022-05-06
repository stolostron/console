/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import nock from 'nock'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import {
    channelsState,
    gitOpsClustersState,
    managedClusterSetBindingsState,
    managedClusterSetsState,
    namespacesState,
    placementsState,
    secretsState,
} from '../../../atoms'
import { nockCreate } from '../../../lib/nock-util'
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
    ManagedClusterSet,
    ManagedClusterSetApiVersion,
    ManagedClusterSetBinding,
    ManagedClusterSetBindingApiVersion,
    ManagedClusterSetBindingKind,
    ManagedClusterSetKind,
    Namespace,
    NamespaceApiVersion,
    NamespaceKind,
    Placement,
    PlacementApiVersionBeta,
    PlacementKind,
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

const clusterSet: ManagedClusterSet = {
    apiVersion: ManagedClusterSetApiVersion,
    kind: ManagedClusterSetKind,
    metadata: {
        name: 'cluster-set-01',
        namespace: 'argo-server-1',
    },
    spec: {
        clusterSet: 'cluster-set-01',
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

// const gitSecret: Secret = {
//     apiVersion: SecretApiVersion,
//     kind: SecretKind,
//     metadata: {
//         name: 'secret-01',
//         namespace: 'application-01',
//     },
//     stringData: {},
// }

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
                labels: {
                    'velero.io/exclude-from-backup': 'true',
                },
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
                syncPolicy: {
                    automated: { selfHeal: true, prune: true },
                    syncOptions: ['CreateNamespace=true', 'PruneLast=true'],
                },
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
                labels: {
                    'velero.io/exclude-from-backup': 'true',
                },
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
                syncPolicy: {
                    automated: { selfHeal: true, prune: true },
                    syncOptions: ['CreateNamespace=true', 'PruneLast=true'],
                },
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

interface GetGitBranchesArgoResponse {
    branchList: { name: string }[]
}
export function nockArgoGitBranches(repositoryUrl: string, response: GetGitBranchesArgoResponse, statusCode = 200) {
    const url = new URL(repositoryUrl)
    return nock('https://api.github.com')
        .get('/repos' + url.pathname + '/branches')
        .reply(statusCode, response.branchList)
}

interface GetGitBranchShaArgoResponse {
    commit: { sha: string }
}
export function nockArgoGitPathSha(
    repositoryUrl: string,
    branch: string,
    response: GetGitBranchShaArgoResponse,
    statusCode = 200
) {
    const url = new URL(repositoryUrl)
    return nock('https://api.github.com')
        .get('/repos' + url.pathname + '/branches/' + branch)
        .reply(statusCode, response)
}

interface GetGitPathsArgoResponse {
    tree: { path: string; type: string }[]
}
export function nockArgoGitPathTree(repositoryUrl: string, response: GetGitPathsArgoResponse, statusCode = 200) {
    const url = new URL(repositoryUrl)
    return nock('https://api.github.com')
        .get('/repos' + url.pathname + '/git/trees/01?recursive=true')
        .reply(statusCode, response)
}

describe('Create Argo Application Set', () => {
    const CreateApplicationSet = () => {
        return (
            <RecoilRoot
                initializeState={(snapshot) => {
                    snapshot.set(placementsState, [])
                    snapshot.set(gitOpsClustersState, [gitOpsCluster])
                    snapshot.set(channelsState, [channelGit, channelHelm])
                    snapshot.set(namespacesState, [namespace])
                    snapshot.set(secretsState, [])
                    snapshot.set(managedClusterSetsState, [clusterSet])
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
        // const initialNocks = [nockGet(gitSecret)]
        render(<CreateApplicationSet />)
        // await waitForNocks(initialNocks)

        // General
        await typeByTestId('name', argoAppSetGit!.metadata!.name!)
        await clickByText('Select the Argo server')
        await clickByText(gitOpsCluster!.spec!.argoServer!.argoNamespace)
        await clickByText('Next')

        // Template
        await clickByText('Git')

        const appBranchNocks = [nockArgoGitBranches(channelGit.spec.pathname, { branchList: [{ name: 'branch-01' }] })]
        await clickByText('Enter or select a Git URL')
        await clickByText(channelGit.spec.pathname)
        await waitForNocks(appBranchNocks)

        const pathNocks = [
            nockArgoGitPathSha(channelGit.spec.pathname, 'branch-01', { commit: { sha: '01' } }),
            nockArgoGitPathTree(channelGit.spec.pathname, { tree: [{ path: 'application-test', type: 'tree' }] }),
        ]
        await clickByText('Enter or select a tracking revision')
        await clickByText('branch-01')
        await waitForNocks(pathNocks)

        await clickByText('Enter or select a repository path')
        await clickByText('application-test')

        await typeByPlaceholderText('Enter the remote namespace', 'gitops-ns')
        await clickByText('Next')

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
        render(<CreateApplicationSet />)

        // appset name
        await typeByTestId('name', argoAppSetHelm!.metadata!.name!)

        // select argoServer
        await clickByText('Select the Argo server')
        await clickByText(gitOpsCluster!.spec!.argoServer!.argoNamespace)

        // next - Source
        await clickByText('Next')

        // repository type
        await clickByText('Helm')

        await clickByText('Enter or select a Helm URL')
        await clickByText(channelHelm.spec.pathname)

        await typeByPlaceholderText('Enter the chart name', chartName)
        await typeByPlaceholderText('Enter the package version', 'v1')

        await typeByPlaceholderText('Enter the remote namespace', 'gitops-ns')
        await clickByText('Next')

        // sync policy
        await clickByText('Next')

        // placement
        await clickByText('Select the cluster sets')
        await clickByText(clusterSetBinding.spec.clusterSet)
        await clickByText('Next')

        // submit
        const createHelmAppSetNocks = [nockCreate(argoAppSetHelm), nockCreate(placementHelm)]
        await clickByText('Submit')
        await waitForNocks(createHelmAppSetNocks)
    })
})
