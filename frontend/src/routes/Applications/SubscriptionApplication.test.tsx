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
    Project,
    ProjectApiVersion,
    ProjectKind,
} from '../../resources'
import CreateSubscriptionApplicationPage from './SubscriptionApplication'
import { applicationsState } from '../../atoms'
import { clickByTestId, typeByTestId, waitForNocks, waitForTestId } from '../../lib/test-util'
import { nockIgnoreRBAC, nockList } from '../../lib/nock-util'

///////////////////////////////// Mock Data /////////////////////////////////////////////////////

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

const mockProject: Project = {
    kind: ProjectKind,
    apiVersion: ProjectApiVersion,
    metadata: {
        name: mockApplication0.metadata.namespace,
    },
}

const mockApplications: Application[] = [mockApplication0]

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
    test('Fail to create git subscription app', async () => {
        const initialNocks = [nockList(mockProject, [mockProject])]
        window.scrollBy = () => {}
        render(<Component />)
        await waitForNocks(initialNocks)

        expect(screen.getAllByText('Create application')).toBeTruthy()
        // fill the form
        await typeByTestId('eman', mockApplication0.metadata.name!)
        await typeByTestId('emanspace', mockApplication0.metadata.namespace!)

        // click git card
        const gitCard = screen.queryByTestId('git')
        gitCard?.click()

        const localClusterCheckbox = screen.queryByTestId('local-cluster-checkbox-label')
        localClusterCheckbox?.click()

        await clickByTestId('create-button-portal-id')
        // notification to alert failure
        await waitForTestId('notifications')
    })

    test('can render Edit Subscription Application Page', async () => {
        window.scrollBy = () => {}
        render(
            <RecoilRoot
                initializeState={(snapshot) => {
                    snapshot.set(applicationsState, mockApplications)
                }}
            >
                <MemoryRouter>
                    <Route
                        path={NavigationPath.editApplicationSubscription
                            .replace(':namespace', mockApplication0.metadata?.namespace as string)
                            .replace(':name', mockApplication0.metadata?.name as string)}
                        render={() => <CreateSubscriptionApplicationPage />}
                    />
                </MemoryRouter>
            </RecoilRoot>
        )
    })
})
