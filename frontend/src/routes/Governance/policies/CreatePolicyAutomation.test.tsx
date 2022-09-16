/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { policiesState, secretsState } from '../../../atoms'
import { nockIgnoreRBAC, nockGet } from '../../../lib/nock-util'
import { waitForNocks, waitForText } from '../../../lib/test-util'
import { NavigationPath } from '../../../NavigationPath'
import { Secret, SecretApiVersion, SecretKind } from '../../../resources'
import { Provider } from '../../../ui-components/AcmProvider'
import { CreatePolicyAutomation } from './CreatePolicyAutomation'
import { mockEmptyPolicy, mockPolicy } from './Policy.sharedMocks'

const mockSecret: Secret = {
    apiVersion: SecretApiVersion,
    kind: SecretKind,
    metadata: {
        name: 'ansible-test-secret',
        namespace: 'namespace-1',
        labels: {
            'cluster.open-cluster-management.io/type': Provider.ansible,
            'cluster.open-cluster-management.io/credentials': '',
        },
    },
    stringData: {
        host: 'https://ansible-tower-web-svc-tower.com',
        token: 'abcd',
    },
}

describe('Create Policy Automation Wizard', () => {
    const Component = () => {
        return (
            <RecoilRoot
                initializeState={(snapshot) => {
                    snapshot.set(policiesState, mockEmptyPolicy)
                    snapshot.set(secretsState, [mockSecret])
                }}
            >
                <MemoryRouter initialEntries={[`${NavigationPath.createPolicyAutomation}`]}>
                    <Route path={NavigationPath.createPolicyAutomation}>
                        <CreatePolicyAutomation />
                    </Route>
                </MemoryRouter>
            </RecoilRoot>
        )
    }

    beforeEach(async () => {
        nockIgnoreRBAC()
    })

    test('can create policy automation', async () => {
        window.scrollBy = () => {}

        const initialNocks = [nockGet(mockPolicy[0])]

        // create form
        render(<Component />)

        await new Promise((resolve) => setTimeout(resolve, 500))

        // wait for nocks
        await waitForNocks(initialNocks)

        // step 1 -- name and namespace
        await waitForText('Create policy automation')
    })
})
