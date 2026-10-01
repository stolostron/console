/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { StateProvider } from '~/lib/state-provider'
import RolesManagement from './RolesManagement'

describe('RolesManagement Router', () => {
  test('should render without errors', () => {
    render(
      <StateProvider>
        <MemoryRouter initialEntries={['/multicloud/user-management/roles']}>
          <RolesManagement />
        </MemoryRouter>
      </StateProvider>
    )

    expect(document.body).toBeInTheDocument()
  })

  test('should render role detail route', async () => {
    render(
      <StateProvider>
        <MemoryRouter initialEntries={['/multicloud/user-management/roles/test-role']}>
          <RolesManagement />
        </MemoryRouter>
      </StateProvider>
    )

    expect(document.body).toBeInTheDocument()
  })
})
