/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { nockIgnoreApiPaths } from '../../lib/nock-util'
import { clickByTestId } from '../../lib/test-util'
import { NavigationPath } from '../../NavigationPath'
import { CreateCredentialsPage } from './CreateCredentials'

describe('CreateCredentialsPage', () => {
  beforeEach(() => {
    nockIgnoreApiPaths()
  })
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

  test('can select vsphere', async () => {
    render(<Component />)
    await clickByTestId('vsphere')
  })

  test('can select hostinventory', async () => {
    render(<Component />)
    await clickByTestId('hostinventory')
  })

  test('can select kubevirt', async () => {
    render(<Component />)
    await clickByTestId('kubevirt')
  })

  test('can select ansible', async () => {
    render(<Component />)
    await clickByTestId('ansible')
  })

  test('can select redhatcloud', async () => {
    render(<Component />)
    await clickByTestId('redhatcloud')
  })

  test('can select rhv - located in page 2', async () => {
    render(<Component />)
    // screen.logTestingPlaygroundURL()
    userEvent.click(screen.getByRole('button', { name: /go to next page/i }))
    await clickByTestId('rhv')
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
