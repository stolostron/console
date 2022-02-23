/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { nockIgnoreRBAC } from '../../lib/nock-util'
import { typeByTestId } from '../../lib/test-util'
// import { typeByTestId } from '../../lib/test-util'
import { NavigationPath } from '../../NavigationPath'
import CreateSubscriptionApplicationPage from './SubscriptionApplication'
// import {controlData} from '../Applications/CreateApplication/Subscription/controlData/ControlData'

///////////////////////////////// FILL FORM //////////////////////////////////////////////////

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
    beforeEach(() => {
        nockIgnoreRBAC()
    })
    test('can render subscription application page', async () => {
        render(
            <RecoilRoot>
                <MemoryRouter initialEntries={[NavigationPath.createApplicationSubscription]}>
                    <Route
                        path={NavigationPath.createApplicationSubscription}
                        render={() => <CreateSubscriptionApplicationPage />}
                    />
                </MemoryRouter>
            </RecoilRoot>
        )

        // await waitFor(() => expect(getByTestId('cancel-button-portal-id')))
        // await waitFor(() => expect(getByTestId('create-button-portal-id')))

        // await waitForTestId('eman')
        await typeByTestId('eman', 'test'!)
    })
})
