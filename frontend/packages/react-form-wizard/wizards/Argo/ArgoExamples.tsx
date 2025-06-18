import { useMemo } from 'react'
import { useHistory } from 'react-router'
import ArgoIcon from '../Argo/logos/ArgoIcon.svg'
import { Catalog } from '../Catalog'
import { IResource } from '../../src/common/resource'
import { clusters, clusterSetBindings, clusterSets, placements as testPlacements } from '../common/test-data'
import { onSubmit } from '../common/utils'
import { RouteE } from '../Routes'
import { ArgoWizard } from './ArgoWizard'

function onCancel(history: { push: (location: string) => void }) {
    history.push(`./${RouteE.ArgoCD}`)
}

export function ApplicationSetExamples() {
    const history = useHistory()
    return (
        <Catalog
            title="Application Set Wizard Examples"
            breadcrumbs={[{ label: 'Example Wizards', to: RouteE.Wizards }, { label: 'Application Set Wizard Examples' }]}
            cards={[
                {
                    icon: <ArgoIcon />,
                    title: 'Create application set',
                    descriptions: [
                        'Argo CD is a declarative, GitOps continuous delivery tool for Kubernetes.',
                        "The application set is a sub-project of Argo CD which adds Application automation, and seeks to improve multi-cluster support and cluster multitenant support within Argo CD. Argo CD Applications may be templated from multiple different sources, including from Git or Argo CD's own defined cluster list",
                    ],
                    onClick: () => history.push(RouteE.CreateArgoCD),
                },
                {
                    icon: <ArgoIcon />,
                    title: 'Edit application set',
                    onClick: () => history.push(RouteE.EditArgoCD),
                },
            ]}
            onBack={() => history.push(RouteE.Wizards)}
        />
    )
}

export function CreateApplicationSet() {
    const history = useHistory()
    const namespaces = useMemo(() => ['default', 'namespace-1', 'namespace-2'], [])
    const servers = useMemo(
        () => [
            { label: 'default', value: 'default', description: 'default-description' },
            { label: 'server-1', value: 'server-1', description: 'server-1-description' },
            { label: 'server-2', value: 'server-2', description: 'server-2-description' },
        ],
        []
    )
    const ansibleCredentials = useMemo(() => ['credential1', 'credential2'], [])
    const placements = testPlacements
    const channels = useMemo(
        () => [
            { metadata: { name: 'helm-channel-1', namespace: 'helm-channel-1' }, spec: { pathname: 'https://test.com', type: 'HelmRepo' } },
            { metadata: { name: 'helm-channel-2', namespace: 'helm-channel-2' }, spec: { pathname: 'https://test.com', type: 'HelmRepo' } },
            { metadata: { name: 'git-channel-1', namespace: 'git-channel-1' }, spec: { pathname: 'https://test.com', type: 'Git' } },
            { metadata: { name: 'git-channel-1', namespace: 'git-channel-1' }, spec: { pathname: 'https://test.com', type: 'Git' } },
        ],
        []
    )
    const timeZones = useMemo(() => ['EST'], [])
    return (
        <ArgoWizard
            breadcrumb={[
                { label: 'Example Wizards', to: RouteE.Wizards },
                { label: 'Application Set Wizard Examples', to: RouteE.ArgoCD },
                { label: 'Create Application Set' },
            ]}
            createClusterSetCallback={() => null}
            ansibleCredentials={ansibleCredentials}
            argoServers={servers}
            namespaces={namespaces}
            onSubmit={onSubmit}
            onCancel={() => onCancel(history)}
            placements={placements}
            channels={channels}
            timeZones={timeZones}
            getGitRevisions={async () => {
                await new Promise((resolve) => setTimeout(resolve, 1000))
                return Promise.resolve(['branch-1', 'branch-2'])
            }}
            getGitPaths={async () => {
                await new Promise((resolve) => setTimeout(resolve, 1000))
                return Promise.resolve(['path-1', 'path-2'])
            }}
            clusters={clusters}
            clusterSets={clusterSets}
            clusterSetBindings={clusterSetBindings}
        />
    )
}

export function EditApplicationSet() {
    const history = useHistory()
    const namespaces = useMemo(() => ['default', 'namespace-1', 'namespace-2'], [])
    const servers = useMemo(
        () => [
            { label: 'default', value: 'default', description: 'default-description' },
            { label: 'server-1', value: 'server-1', description: 'server-1-description' },
            { label: 'server-2', value: 'server-2', description: 'server-2-description' },
        ],
        []
    )

    const ansibleCredentials = useMemo(() => ['credential1', 'credential2'], [])
    const placements = testPlacements
    const channels = useMemo(
        () => [
            { metadata: { name: 'helm-channel-1', namespace: 'helm-channel-1' }, spec: { pathname: 'https://test.com', type: 'HelmRepo' } },
            { metadata: { name: 'helm-channel-2', namespace: 'helm-channel-2' }, spec: { pathname: 'https://test.com', type: 'HelmRepo' } },
            { metadata: { name: 'git-channel-1', namespace: 'git-channel-1' }, spec: { pathname: 'https://test.com', type: 'Git' } },
            { metadata: { name: 'git-channel-1', namespace: 'git-channel-1' }, spec: { pathname: 'https://test.com', type: 'Git' } },
        ],
        []
    )
    const timeZones = useMemo(() => ['EST'], [])
    return (
        <ArgoWizard
            breadcrumb={[
                { label: 'Example Wizards', to: RouteE.Wizards },
                { label: 'Application Set Wizard Examples', to: RouteE.ArgoCD },
                { label: 'Edit Application Set' },
            ]}
            createClusterSetCallback={() => null}
            ansibleCredentials={ansibleCredentials}
            argoServers={servers}
            namespaces={namespaces}
            onSubmit={onSubmit}
            onCancel={() => onCancel(history)}
            placements={placements}
            channels={channels}
            timeZones={timeZones}
            getGitRevisions={async () => {
                await new Promise((resolve) => setTimeout(resolve, 1000))
                return Promise.resolve(['branch-1', 'branch-2'])
            }}
            getGitPaths={async () => {
                await new Promise((resolve) => setTimeout(resolve, 1000))
                return Promise.resolve(['path-1', 'path-2'])
            }}
            clusters={clusters}
            clusterSets={clusterSets}
            clusterSetBindings={clusterSetBindings}
            resources={[
                {
                    apiVersion: 'argoproj.io/v1alpha1',
                    kind: 'ApplicationSet',
                    metadata: {
                        name: 'my-application-set',
                        namespace: 'server-1',
                    },
                    spec: {
                        generators: [
                            {
                                clusterDecisionResource: {
                                    configMapRef: 'acm-placement',
                                    labelSelector: {
                                        matchLabels: {
                                            'cluster.open-cluster-management.io/placement': 'my-application-set-placement',
                                        },
                                    },
                                    requeueAfterSeconds: 60,
                                },
                            },
                        ],
                        template: {
                            metadata: {
                                name: 'my-application-set-{{name}}',
                            },
                            spec: {
                                project: 'default',
                                source: {
                                    repoURL: 'https://test.com',
                                    targetRevision: 'branch-1',
                                    path: 'path-1',
                                },
                                destination: {
                                    namespace: 'destination',
                                    server: '{{server}}',
                                },
                                syncPolicy: {
                                    automated: {
                                        prune: true,
                                    },
                                    syncOptions: ['PruneLast=true'],
                                },
                            },
                        },
                    },
                } as IResource,
                {
                    apiVersion: 'cluster.open-cluster-management.io/v1beta1',
                    kind: 'Placement',
                    metadata: {
                        name: 'my-application-set-placement',
                        namespace: 'server-1',
                    },
                    spec: {
                        predicates: [
                            {
                                requiredClusterSelector: {
                                    labelSelector: {
                                        matchExpressions: [
                                            {
                                                key: 'region',
                                                operator: 'In',
                                                values: ['us-east-1', 'us-east-2'],
                                            },
                                        ],
                                    },
                                },
                            },
                        ],
                        clusterSets: ['my-cluster-set-5'],
                    },
                } as IResource,
            ]}
        />
    )
}
