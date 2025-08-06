/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Outlet } from 'react-router-dom-v5-compat'
import { createRoutePathFunction, NavigationPath } from '../../../NavigationPath'
import VirtualMachines from './VirtualMachines'

function VmPageStub() {
  return (
    <>
      <div>vm-page</div>
      <Outlet />
    </>
  )
}
function MigratePageStub() {
  return <div>migrate-page</div>
}

jest.mock('./VirtualMachinesPage', () => ({
  __esModule: true,
  default: VmPageStub,
}))
jest.mock('./MigrateVirtualMachinePage', () => ({
  __esModule: true,
  default: MigratePageStub,
}))

const vmPathFn = createRoutePathFunction(NavigationPath.virtualMachines)
const vmRoot = vmPathFn(NavigationPath.virtualMachines)

describe('VirtualMachines routes', () => {
  it('renders the root virtual-machines page', async () => {
    render(
      <MemoryRouter initialEntries={[vmRoot]}>
        <VirtualMachines />
      </MemoryRouter>
    )
    expect(await screen.findByText('vm-page')).toBeInTheDocument()
  })

  it('renders the migrate page when the URL matches', async () => {
    render(
      <MemoryRouter initialEntries={[vmPathFn(NavigationPath.migrateVirtualMachine)]}>
        <VirtualMachines />
      </MemoryRouter>
    )
    expect(await screen.findByText('migrate-page')).toBeInTheDocument()
  })

  it('renders the role assignments page when the URL matches', async () => {
    render(
      <MemoryRouter initialEntries={[vmPathFn(NavigationPath.virtualMachineRoleAssignments)]}>
        <VirtualMachines />
      </MemoryRouter>
    )
    expect(await screen.findByText('vm-page')).toBeInTheDocument()
  })
})
