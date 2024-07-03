/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom-v5-compat'
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
          <Routes>
            <Route path={NavigationPath.addCredentials} element={<CreateCredentialsPage />} />
          </Routes>
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
