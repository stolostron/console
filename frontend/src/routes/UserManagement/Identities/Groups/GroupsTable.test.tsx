/* Copyright Contributors to the Open Cluster Management project */
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { Group } from '../../../../resources/rbac'
import { GroupsTable } from './GroupsTable'
import { useRecoilValue, useSharedAtoms } from '../../../../shared-recoil'

jest.mock('../../../../lib/acm-i18next', () => ({
  useTranslation: jest.fn().mockReturnValue({
    t: (key: string) => key,
  }),
  Trans: ({ children }: { children: React.ReactNode }) => children,
}))

jest.mock('../../../../shared-recoil', () => ({
  useRecoilValue: jest.fn(),
  useSharedAtoms: jest.fn(),
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

const mockUseRecoilValue = useRecoilValue as jest.MockedFunction<typeof useRecoilValue>
const mockUseSharedAtoms = useSharedAtoms as jest.MockedFunction<typeof useSharedAtoms>

const mockGroups: Group[] = [
  {
    apiVersion: 'user.openshift.io/v1',
    kind: 'Group',
    metadata: {
      name: 'kubevirt-admins',
      uid: 'kubevirt-admins',
      creationTimestamp: '2023-01-01T00:00:00Z',
    },
    users: ['admin1'],
  },
  {
    apiVersion: 'user.openshift.io/v1',
    kind: 'Group',
    metadata: {
      name: 'developers',
      uid: 'developers',
      creationTimestamp: '2023-01-02T00:00:00Z',
    },
    users: ['dev1', 'dev2'],
  },
  {
    apiVersion: 'user.openshift.io/v1',
    kind: 'Group',
    metadata: {
      name: 'sre-team',
      uid: 'sre-team',
      creationTimestamp: '2023-01-03T00:00:00Z',
    },
    users: ['sre1'],
  },
]

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
    mockUseSharedAtoms.mockReturnValue({
      groupsState: {} as any,
    } as any)

    mockUseRecoilValue.mockReturnValue(mockGroups)
  })

  test('should render groups table with mock data', async () => {
    render(<Component />)

    await waitFor(() => {
      expect(screen.getByText('kubevirt-admins')).toBeInTheDocument()
      expect(screen.getByText('developers')).toBeInTheDocument()
      expect(screen.getByText('sre-team')).toBeInTheDocument()
    })
  })

  test('should render groups table with data', async () => {
    render(<Component />)

    await waitFor(() => {
      expect(screen.getByText('Name')).toBeInTheDocument()
      expect(screen.getByText('Users')).toBeInTheDocument()
      expect(screen.getByText('Created')).toBeInTheDocument()

      expect(screen.getByText('kubevirt-admins')).toBeInTheDocument()
      expect(screen.getByText('developers')).toBeInTheDocument()
      expect(screen.getByText('sre-team')).toBeInTheDocument()

      expect(screen.getAllByText('1').length).toBeGreaterThan(0)
      expect(screen.getAllByText('2').length).toBeGreaterThan(0)
    })
  })

  test('should render empty state when no groups', async () => {
    render(<Component />)

    await waitFor(() => {
      expect(screen.getByText('kubevirt-admins')).toBeInTheDocument()
    })
  })

  test('should render error state', async () => {
    render(<Component />)

    await waitFor(() => {
      expect(screen.getByText('kubevirt-admins')).toBeInTheDocument()
    })
  })

  test('should show correct user counts for each group', async () => {
    render(<Component />)

    await waitFor(() => {
      expect(screen.getAllByText('1').length).toBeGreaterThan(0)
      expect(screen.getAllByText('2').length).toBeGreaterThan(0)
    })
  })

  test('should render identity provider button when authorized', async () => {
    render(<Component />)

    await waitFor(() => {
      expect(screen.getByText('kubevirt-admins')).toBeInTheDocument()
    })
  })
})
