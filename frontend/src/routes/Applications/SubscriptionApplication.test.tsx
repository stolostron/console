/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import moment from 'moment'
import { nockIgnoreRBAC } from '../../lib/nock-util'
import { NavigationPath } from '../../NavigationPath'
import {
    Application,
    ApplicationApiVersion,
    ApplicationKind,
    // Channel,
    // ChannelApiVersion,
    // ChannelKind,
    // Namespace,
    // NamespaceApiVersion,
    // NamespaceKind,
    // PlacementRule,
    // PlacementRuleApiVersion,
    // PlacementRuleKind,
    // Project,
    // ProjectApiVersion,
    // ProjectKind,
    // Subscription,
    // SubscriptionApiVersion,
    // SubscriptionKind,
} from '../../resources'
import CreateSubscriptionApplicationPage from './SubscriptionApplication'
import { applicationsState } from '../../atoms'
import userEvent, { TargetElement } from '@testing-library/user-event'

///////////////////////////////// Mock Data /////////////////////////////////////////////////////

const channelUrl = 'https://invalid.com'

const mockApplication: Application = {
    apiVersion: ApplicationApiVersion,
    kind: ApplicationKind,
    metadata: {
        name: 'application-0',
        namespace: 'namespace-0',
        creationTimestamp: `${moment().format()}`,
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
                    values: ['application-0'],
                },
            ],
        },
    },
}

// const mockChannel: Channel = {
//     apiVersion: ChannelApiVersion,
//     kind: ChannelKind,
//     metadata: {
//         annotations: {
//             'apps.open-cluster-management.io/reconcile-rate': 'medium',
//         },
//         name: 'ginvalidcom',
//         namespace: 'ginvalidcom-ns',
//     },
//     spec: {
//         type: 'Git',
//         pathname: 'https://invalid.com',
//     },
// }

// const mockSubscription: Subscription = {
//     apiVersion: SubscriptionApiVersion,
//     kind: SubscriptionKind,
//     metadata: {
//         annotations: {
//             'apps.open-cluster-management.io/git-branch': '',
//             'apps.open-cluster-management.io/git-path': '',
//             'apps.open-cluster-management.io/reconcile-option': 'merge',
//         },
//         labels: {
//             app: 'application-0',
//         },
//         name: 'application-0-subscription-1',
//         namespace: 'namespace-0',
//     },
//     spec: {
//         channel: 'ginvalidcom-ns/ginvalidcom',
//         placement: {
//             placementRef: {
//                 kind: PlacementRuleKind,
//                 name: 'application-0-placement-1',
//             },
//         },
//     },
// }

// const mockPlacementRule: PlacementRule = {
//     apiVersion: PlacementRuleApiVersion,
//     kind: PlacementRuleKind,
//     metadata: {
//         labels: {
//             app: 'application-0',
//         },
//         name: 'application-0-placement-1',
//         namespace: 'namespace-0',
//     },
//     spec: {
//         clusterSelector: {
//             matchLabels: {
//                 'local-cluster': 'true',
//             },
//         },
//     },
// }

// const mockNamespace: Namespace = {
//     apiVersion: NamespaceApiVersion,
//     kind: NamespaceKind,
//     metadata: { name: mockApplication.metadata.namespace },
// }

// const mockProject: Project = {
//     apiVersion: ProjectApiVersion,
//     kind: ProjectKind,
//     metadata: { name: mockApplication.metadata.namespace },
// }

// const mockChannelNamespace: Namespace = {
//     apiVersion: NamespaceApiVersion,
//     kind: NamespaceKind,
//     metadata: {
//         name: 'ginvalidcom-ns',
//     },
// }

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
            <RecoilRoot>
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
    test(
        'can render Create Subscription Application Page',
        async () => {
            window.scrollBy = () => {}
            const { getByTestId } = render(<Component />)
            expect(screen.getAllByText('Create application')).toBeTruthy()
            const createButton = screen.queryByTestId('create-button-portal-id')
            const cancelButton = screen.queryByTestId('cancel-button-portal-id')
            expect(createButton).toBeTruthy()
            expect(cancelButton).toBeTruthy()

            // fill the form
            userEvent.type(getByTestId('eman'), mockApplication.metadata.name!)
            userEvent.type(screen.queryByTestId('emanspace') as TargetElement, mockApplication.metadata.namespace!)

            // select github card and fill the rest
            const gitCard = screen.queryByTestId('git')
            gitCard?.click()

            userEvent.type(screen.queryByTestId('githubURL') as TargetElement, channelUrl)

            const localClusterCheckbox = screen.queryByTestId('local-cluster-checkbox-label')
            localClusterCheckbox?.click()

            // nocks for application creation
            // const createNocks = [
            //     // create applicatiom namespace (project)
            //     nockList(mockProject, [mockProject]),
            //     // nockCreate(mockNamespace),

            //     // // create the related resources
            //     // nockCreate(mockApplication),
            //     // nockCreate(mockChannelNamespace),
            //     // nockCreate(mockChannel),
            //     // nockCreate(mockSubscription),
            //     // nockCreate(mockPlacementRule),
            // ]

            // click create button
            createButton?.click()

            expect(consoleInfos).hasNoConsoleLogs()
            screen.queryAllByText('Application created')

            // // make sure creating
            // await waitForNocks(createNocks)
        },
        2 * 60 * 1000
    )

    test('can render Edit Subscription Application Page', async () => {
        window.scrollBy = () => {}
        render(
            <RecoilRoot
                initializeState={(snapshot) => {
                    snapshot.set(applicationsState, [mockApplication])
                }}
            >
                <MemoryRouter>
                    <Route
                        path={NavigationPath.editApplicationSubscription
                            .replace(':namespace', mockApplication.metadata?.namespace as string)
                            .replace(':name', mockApplication.metadata?.name as string)}
                        render={() => <CreateSubscriptionApplicationPage />}
                    />
                </MemoryRouter>
            </RecoilRoot>
        )
    })
})
