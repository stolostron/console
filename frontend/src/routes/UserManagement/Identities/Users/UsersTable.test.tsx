/* Copyright Contributors to the Open Cluster Management project */

import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { nockIgnoreRBAC, nockIgnoreApiPaths } from '../../../../lib/nock-util'
import { UsersTable } from './UsersTable'

function Component() {
  return (
    <RecoilRoot>
      <MemoryRouter>
        <UsersTable />
      </MemoryRouter>
    </RecoilRoot>
  )
}

describe('Users Page', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
  })

  test('should render users table with mock users', async () => {
    // No nockList needed since UsersTable uses hardcoded mock data
    render(<Component />)

    await waitFor(() => {
      // Check for actual mock users that are rendered by UsersTable
      expect(screen.getByText('alice.trask')).toBeInTheDocument()
      expect(screen.getByText('bob.levy')).toBeInTheDocument()
    })
  })

  test('should render component without errors', () => {
    render(<Component />)

    expect(document.body).toBeInTheDocument()
  })
})
