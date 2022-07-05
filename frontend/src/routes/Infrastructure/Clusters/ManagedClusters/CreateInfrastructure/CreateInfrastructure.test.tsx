/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { secretsState } from '../../../../../atoms'
import { clickByTestId } from '../../../../../lib/test-util'
import { NavigationPath } from '../../../../../NavigationPath'
import { CreateInfrastructure } from './CreateInfrastructure'

describe('CreateInfrastructure', () => {
    const Component = () => {
        return (
            <RecoilRoot
                initializeState={(snapshot) => {
                    snapshot.set(secretsState, [])
                }}
            >
                <MemoryRouter initialEntries={[NavigationPath.createInfrastructure]}>
                    <Route path={NavigationPath.createInfrastructure}>
                        <CreateInfrastructure />
                    </Route>
                </MemoryRouter>
            </RecoilRoot>
        )
    }

    test('can select aws', async () => {
        render(<Component />)
        await clickByTestId('aws')
    })
})
