/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { clickByTestId } from '../../lib/test-util'
import { NavigationPath } from '../../NavigationPath'
import { CreateCredentialsPage } from './CreateCredentials'

describe('CreateInfrastructure credential', () => {
    const Component = () => {
        return (
            <RecoilRoot>
                <MemoryRouter initialEntries={[NavigationPath.addCredentials]}>
                    <Route path={NavigationPath.addCredentials}>
                        <CreateCredentialsPage />
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
        await clickByTestId('gcp')
    })

    test('can select azure', async () => {
        render(<Component />)
        await clickByTestId('azr')
    })

    test('can select openstack', async () => {
        render(<Component />)
        await clickByTestId('ost')
    })

    test('can select rhv', async () => {
        render(<Component />)
        await clickByTestId('redhatvirtualization')
    })

    test('can select vsphere', async () => {
        render(<Component />)
        await clickByTestId('vmw')
    })

    test('can select hostinventory', async () => {
        render(<Component />)
        await clickByTestId('hostinventory')
    })

    test('can select ansible', async () => {
        render(<Component />)
        await clickByTestId('ans')
    })

    test('can select redhatcloud', async () => {
        render(<Component />)
        await clickByTestId('rhocm')
    })

    test('can click cancel', async () => {
        render(<Component />)
        userEvent.click(
            screen.getByRole('button', {
                name: /cancel/i,
            })
        )
    })

    test('can click back', async () => {
        render(<Component />)
        userEvent.click(
            screen.getByRole('button', {
                name: /back/i,
            })
        )
    })
})
