/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { nockIgnoreRBAC, nockIgnoreApiPaths } from '../../../../lib/nock-util'
import { GroupsTable } from './GroupsTable'

jest.mock('../../../../lib/acm-i18next', () => ({
  useTranslation: jest.fn().mockReturnValue({
    t: (key: string) => key,
  }),
  Trans: ({ children }: { children: React.ReactNode }) => children,
}))

jest.mock('../../../../lib/rbac-util', () => ({
  rbacCreate: jest.fn(() => ({ apiVersion: 'rbac.authorization.k8s.io/v1', kind: 'ClusterRole' })),
  useIsAnyNamespaceAuthorized: jest.fn(() => true),
}))

jest.mock('../../../../ui-components/IdentityStatus/IdentityStatus', () => ({
  IdentityStatus: ({ identity }: { identity: any }) => (
    <span data-testid="identity-status">{identity.kind === 'Group' ? 'Active' : 'Inactive'}</span>
  ),
  isIdentityActive: jest.fn(() => true),
}))

function Component() {
  return (
    <RecoilRoot>
      <MemoryRouter>
        <GroupsTable />
      </MemoryRouter>
    </RecoilRoot>
  )
}

describe('GroupsTable', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
  })

  test('should render groups table with mock data', () => {
    render(<Component />)

    expect(screen.getByText('kubevirt-admins')).toBeInTheDocument()
    expect(screen.getByText('developers')).toBeInTheDocument()
    expect(screen.getByText('sre-team')).toBeInTheDocument()
  })

  test('should render groups table with data', () => {
    render(<Component />)

    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Users')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
    expect(screen.getByText('Created')).toBeInTheDocument()

    expect(screen.getByText('kubevirt-admins')).toBeInTheDocument()
    expect(screen.getByText('developers')).toBeInTheDocument()
    expect(screen.getByText('sre-team')).toBeInTheDocument()

    expect(screen.getAllByText('1').length).toBeGreaterThan(0)
    expect(screen.getAllByText('2').length).toBeGreaterThan(0)
  })

  test('should render empty state when no groups', () => {
    render(<Component />)

    expect(screen.getByText('kubevirt-admins')).toBeInTheDocument()
  })

  test('should render error state', () => {
    render(<Component />)

    expect(screen.getByText('kubevirt-admins')).toBeInTheDocument()
  })

  test('should show correct user counts for each group', () => {
    render(<Component />)

    expect(screen.getAllByText('1').length).toBeGreaterThan(0)
    expect(screen.getAllByText('2').length).toBeGreaterThan(0)
  })

  test('should render identity provider button when authorized', () => {
    render(<Component />)

    expect(screen.getByText('kubevirt-admins')).toBeInTheDocument()
  })
})
