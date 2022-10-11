/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { clickByTestId } from '../../lib/test-util'
import { NavigationPath } from '../../NavigationPath'
import { CreateInfrastructureCredentials } from './CredentialsInfrastructure'

describe('CreateInfrastructure credential', () => {
    const Component = () => {
        return (
            <RecoilRoot>
                <MemoryRouter initialEntries={[NavigationPath.addCredentialsInfrastructure]}>
                    <Route path={NavigationPath.addCredentialsInfrastructure}>
                        <CreateInfrastructureCredentials />
                    </Route>
                </MemoryRouter>
            </RecoilRoot>
        )
    }

    test('can select aws', async () => {
        render(<Component />)
        await clickByTestId('aws')
    })

    test('can select google', async () => {
        render(<Component />)
        await clickByTestId('google')
    })

    test('can select azure', async () => {
        render(<Component />)
        await clickByTestId('azure')
    })

    test('can select openstack', async () => {
        render(<Component />)
        await clickByTestId('openstack')
    })

    test('can select rhv', async () => {
        render(<Component />)
        await clickByTestId('rhv')
    })

    test('can select vsphere', async () => {
        render(<Component />)
        await clickByTestId('vsphere')
    })

    test('can select hostinventory', async () => {
        render(<Component />)
        await clickByTestId('hostinventory')
    })

    test('can select ansible', async () => {
        render(<Component />)
        await clickByTestId('ansible')
    })

    test('can select redhatcloud', async () => {
        render(<Component />)
        await clickByTestId('redhatcloud')
    })
})
