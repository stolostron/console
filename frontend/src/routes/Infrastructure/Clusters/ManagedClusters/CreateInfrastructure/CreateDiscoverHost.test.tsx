/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { clickByTestId } from '../../../../../lib/test-util'
import { NavigationPath } from '../../../../../NavigationPath'
import { CreateDiscoverHost } from './CreateDiscoverHost'

describe('CreateDiscoverHost', () => {
    const Component = () => {
        return (
            <RecoilRoot>
                <MemoryRouter initialEntries={[NavigationPath.createDicoverHost]}>
                    <Route path={NavigationPath.createDicoverHost}>
                        <CreateDiscoverHost />
                    </Route>
                </MemoryRouter>
            </RecoilRoot>
        )
    }

    test('can click existinghost', async () => {
        render(<Component />)
        await clickByTestId('existinghost')
    })

    test('can click discover', async () => {
        render(<Component />)
        await clickByTestId('discover')
    })
})
