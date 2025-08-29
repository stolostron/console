/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { nockIgnoreRBAC } from '../../../lib/nock-util'
import { RolesPage } from './RolesPage'

function Component() {
  return (
    <RecoilRoot>
      <MemoryRouter>
        <RolesPage />
      </MemoryRouter>
    </RecoilRoot>
  )
}

describe('Roles Page', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
  })

  test('should render roles page', () => {
    render(<Component />)

    expect(screen.getAllByText('Roles')).toHaveLength(2) // Title and breadcrumb
    expect(screen.getByText('Manage roles and permissions')).toBeInTheDocument()
  })
})
