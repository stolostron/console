/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import moment from 'moment'
import { nockIgnoreRBAC } from '../../lib/nock-util'
import { NavigationPath } from '../../NavigationPath'
import { Application, ApplicationApiVersion, ApplicationKind } from '../../resources'
import CreateSubscriptionApplicationPage from './SubscriptionApplication'
import { applicationsState } from '../../atoms'

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
    test('can render Create Subscription Application Page', async () => {
        window.scrollBy = () => {}
        render(<Component />)
        expect(screen.getAllByText('Create application')).toBeTruthy()
        const createButton = screen.queryByTestId('create-button-portal-id')
        const cancelButton = screen.queryByTestId('cancel-button-portal-id')
        expect(createButton).toBeTruthy()
        expect(cancelButton).toBeTruthy()
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
