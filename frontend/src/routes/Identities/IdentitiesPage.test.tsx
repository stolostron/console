/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { nockIgnoreRBAC } from '../../lib/nock-util'
import IdentitiesPage from './IdentitiesPage'

function Component() {
  return (
    <RecoilRoot>
      <MemoryRouter initialEntries={['/multicloud/identities/users']}>
        <IdentitiesPage />
      </MemoryRouter>
    </RecoilRoot>
  )
}

describe('IdentitiesPage', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
  })

  test('should render identities page with tabs', () => {
    render(<Component />)

    expect(screen.getAllByText('Identities')).toHaveLength(2)
    expect(screen.getByText('Users')).toBeInTheDocument()
    expect(screen.getByText('Groups')).toBeInTheDocument()
    expect(screen.getByText('Service Accounts')).toBeInTheDocument()
    expect(screen.getByText('User Management')).toBeInTheDocument()
  })

  test('should highlight correct tab based on route', () => {
    render(
      <RecoilRoot>
        <MemoryRouter initialEntries={['/multicloud/identities/groups']}>
          <IdentitiesPage />
        </MemoryRouter>
      </RecoilRoot>
    )

    expect(screen.getByText('Groups')).toBeInTheDocument()
  })
})
