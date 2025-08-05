/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { nockIgnoreRBAC } from '../../../lib/nock-util'
import { RoleYaml } from './RoleYaml'

function Component({ roleId = 'test-role' }: { roleId?: string }) {
  return (
    <RecoilRoot>
      <MemoryRouter initialEntries={[`/multicloud/user-management/roles/${roleId}/yaml`]}>
        <RoleYaml />
      </MemoryRouter>
    </RecoilRoot>
  )
}

describe('RoleYaml Page', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
  })

  test('should render role YAML page', () => {
    render(<Component />)

    expect(screen.getByText('Role YAML')).toBeInTheDocument()
  })
})
