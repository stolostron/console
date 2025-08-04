/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { nockIgnoreRBAC } from '../../../lib/nock-util'
import { RoleDetail } from './RoleDetail'

function Component({ roleId = 'test-role' }: { roleId?: string }) {
  return (
    <RecoilRoot>
      <MemoryRouter initialEntries={[`/multicloud/user-management/roles/${roleId}`]}>
        <RoleDetail />
      </MemoryRouter>
    </RecoilRoot>
  )
}

describe('RoleDetail Page', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
  })

  test('should render role details page', () => {
    render(<Component />)

    expect(screen.getByText('Role Details')).toBeInTheDocument()
  })

  test('should render with different role ID', () => {
    render(<Component roleId="admin-role" />)

    expect(screen.getByText('Role Details')).toBeInTheDocument()
  })
})
