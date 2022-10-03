/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import moment from 'moment'
import { NavigationPath } from '../../NavigationPath'
import {
    Application,
    ApplicationApiVersion,
    ApplicationKind,
    Channel,
    ChannelApiVersion,
    ChannelKind,
    Namespace,
    NamespaceApiVersion,
    NamespaceKind,
    PlacementRule,
    PlacementRuleApiVersion,
    PlacementRuleKind,
    Project,
    ProjectApiVersion,
    ProjectKind,
    Secret,
    SecretApiVersion,
    SecretKind,
    Subscription,
    SubscriptionApiVersion,
    SubscriptionKind,
} from '../../resources'
import CreateSubscriptionApplicationPage from './SubscriptionApplication'
import { namespacesState, secretsState } from '../../atoms'
import { clickByTestId, typeByTestId, waitForNocks, waitForText } from '../../lib/test-util'
import { nockCreate, nockIgnoreRBAC, nockList } from '../../lib/nock-util'
import userEvent from '@testing-library/user-event'

///////////////////////////////// Mock Data /////////////////////////////////////////////////////

const gitLink = 'https://invalid.com'

const nockApplication = {
    apiVersion: 'app.k8s.io/v1beta1',
    kind: 'Application',
    metadata: { name: 'application-0', namespace: 'namespace-0' },
    spec: {
        componentKinds: [{ group: 'apps.open-cluster-management.io', kind: 'Subscription' }],
        descriptor: {},
        selector: { matchExpressions: [{ key: 'app', operator: 'In', values: ['application-0'] }] },
    },
}

const mockApplication0: Application = {
    apiVersion: ApplicationApiVersion,
    kind: ApplicationKind,
    metadata: {
        name: 'application-0',
        namespace: 'namespace-0',
        creationTimestamp: `${moment().format()}`,
        annotations: {
            'apps.open-cluster-management.io/subscriptions':
                'namespace-0/subscription-0,namespace-0/subscription-0-local',
        },
    },
    spec: {
        componentKinds: [
            {
                group: 'apps.open-cluster-management.io',
                kind: 'Subscription',
            },
        ],
        selector: {
            matchExpressions: [
                {
                    key: 'app',
                    operator: 'In',
                    values: ['application-0-app'],
                },
            ],
        },
    },
}

const mockSubscription: Subscription = {
    apiVersion: SubscriptionApiVersion,
    kind: SubscriptionKind,
    metadata: {
        annotations: {
            'apps.open-cluster-management.io/git-branch': 'test-branch',
            'apps.open-cluster-management.io/git-path': 'test-path',
            'apps.open-cluster-management.io/reconcile-option': 'merge',
        },
        labels: {
            app: 'application-0',
        },
        name: 'application-0-subscription-1',
        namespace: 'namespace-0',
    },
    spec: {
        channel: 'ginvalidcom-ns/ginvalidcom',
        placement: {
            placementRef: {
                kind: 'PlacementRule',
                name: 'application-0-placement-1',
            },
        },
    },
}

const mockProject: Project = {
    kind: ProjectKind,
    apiVersion: ProjectApiVersion,
    metadata: {
        name: mockApplication0.metadata.namespace,
    },
}

const mockProject2: Project = {
    kind: ProjectKind,
    apiVersion: ProjectApiVersion,
    metadata: {
        name: 'test-ns',
    },
}

const mockAnsibleSecret: Secret = {
    apiVersion: SecretApiVersion,
    kind: SecretKind,
    type: 'Opaque',
    metadata: {
        name: 'ans-1',
        namespace: mockProject2.metadata.name,
    },
    stringData: {
        host: 'host',
        token: 'token',
    },
}

const mockChannel: Channel = {
    apiVersion: ChannelApiVersion,
    kind: ChannelKind,
    metadata: {
        annotations: {
            'apps.open-cluster-management.io/reconcile-rate': 'medium',
        },
        name: 'ginvalidcom',
        namespace: 'ginvalidcom-ns',
    },
    spec: {
        type: 'Git',
        pathname: 'https://invalid.com',
    },
}

const mockChannel1: Channel = {
    apiVersion: ChannelApiVersion,
    kind: ChannelKind,
    metadata: {
        annotations: {
            'apps.open-cluster-management.io/reconcile-rate': 'medium',
        },
        name: 'ggithubcom-fxiang1-app-samples',
    },
    spec: {
        type: 'Git',
        pathname: 'https://github.com/fxiang1/app-samples',
    },
}

const mockChannelProject: Project = {
    apiVersion: ProjectApiVersion,
    kind: ProjectKind,
    metadata: {
        name: 'ginvalidcom-ns',
    },
}

const mockPlacementRule: PlacementRule = {
    apiVersion: PlacementRuleApiVersion,
    kind: PlacementRuleKind,
    metadata: {
        labels: {
            app: 'application-0',
        },
        name: 'application-0-placement-1',
        namespace: 'namespace-0',
    },
    spec: {
        clusterConditions: [
            {
                status: 'True',
                type: 'ManagedClusterConditionAvailable',
            },
        ],
    },
}

const mockNamespace0: Namespace = {
    apiVersion: NamespaceApiVersion,
    kind: NamespaceKind,
    metadata: {
        name: 'local-cluster',
    },
}

const mockProjects = [mockProject, mockProject2, mockChannelProject]

const mockPlacementRules = [mockPlacementRule]
const mockNamespaces = [mockNamespace0]
const mockHubChannels = [mockChannel1]

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

describe('Create Subscription Application page', () => {
    const Component = () => {
        return (
            <RecoilRoot
                initializeState={(snapshot) => {
                    snapshot.set(secretsState, [mockAnsibleSecret])
                    snapshot.set(namespacesState, mockNamespaces)
                }}
            >
                <MemoryRouter initialEntries={[NavigationPath.createApplicationSubscription]}>
                    <Route
                        path={NavigationPath.createApplicationSubscription}
                        render={() => <CreateSubscriptionApplicationPage />}
                    />
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

    test('create a git subscription app', async () => {
        const initialNocks = [nockList(mockProject, mockProjects)]
        window.scrollBy = () => {}
        render(<Component />)
        await waitForNocks(initialNocks)
        await waitForText('Create application')
        // fill the form
        await typeByTestId('eman', mockApplication0.metadata.name!)
        await typeByTestId('emanspace', mockApplication0.metadata.namespace!)
        // click git card
        userEvent.click(screen.getByText(/channel\.type\.git/i))
        await waitForNocks([nockList(mockChannel1, mockHubChannels), nockList(mockPlacementRule, mockPlacementRules)])
        //
        const githubURL = screen.getByLabelText(/creation\.app\.github\.url \*/i)
        userEvent.type(githubURL, gitLink)
        userEvent.type(screen.getByLabelText(/creation\.app\.github\.branch/i), 'test-branch')
        userEvent.type(screen.getByLabelText(/creation\.app\.github\.path/i), 'test-path')

        userEvent.click(
            screen.getByRole('radio', {
                name: /creation\.app\.settings\.onlineclustersonly/i,
            })
        )

        await clickByTestId('create-button-portal-id-btn')
        await waitForNocks([
            nockCreate(nockApplication, undefined, 201, { dryRun: 'All' }),
            nockCreate(mockChannel, undefined, 201, { dryRun: 'All' }),
            nockCreate(mockSubscription, undefined, 201, { dryRun: 'All' }),
            nockCreate(mockPlacementRule, undefined, 201, { dryRun: 'All' }),
            nockCreate(nockApplication, undefined, 201),
            nockCreate(mockChannel, undefined, 201),
            nockCreate(mockSubscription, undefined, 201),
            nockCreate(mockPlacementRule, undefined, 201),
        ])

        expect(consoleInfos).hasNoConsoleLogs()
    })
})
