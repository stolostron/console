/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { nockIgnoreRBAC, nockIgnoreApiPaths } from '../../../../lib/nock-util'
import { RoleYaml } from './RoleYaml'
import { ClusterRole, ClusterRoleApiVersion, ClusterRoleKind } from '../../../../resources/rbac'

jest.mock('../../../../lib/acm-i18next', () => ({
  useTranslation: jest.fn().mockReturnValue({
    t: (key: string) => key,
  }),
}))

jest.mock('../RolesPage', () => ({
  ...jest.requireActual('../RolesPage'),
  useRolesContext: jest.fn(),
  useCurrentRole: jest.fn(),
}))

import { useRolesContext, useCurrentRole } from '../RolesPage'

const mockUseRolesContext = useRolesContext as jest.MockedFunction<typeof useRolesContext>
const mockUseCurrentRole = useCurrentRole as jest.MockedFunction<typeof useCurrentRole>

function Component() {
  return (
    <RecoilRoot>
      <MemoryRouter>
        <RoleYaml />
      </MemoryRouter>
    </RecoilRoot>
  )
}

describe('RoleYaml', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
    mockUseRolesContext.mockClear()
    mockUseCurrentRole.mockClear()
  })

  test('should render loading state', () => {
    mockUseRolesContext.mockReturnValue({ loading: true, clusterRoles: [] })
    mockUseCurrentRole.mockReturnValue(undefined)

    render(<Component />)

    expect(screen.getByText('Loading')).toBeInTheDocument()
  })

  test('should render role not found message', () => {
    mockUseRolesContext.mockReturnValue({ loading: false, clusterRoles: [] })
    mockUseCurrentRole.mockReturnValue(undefined)

    render(<Component />)

    expect(screen.getByText('Role not found')).toBeInTheDocument()
  })

  test('should render YAML editor with role data', () => {
    const mockRole: ClusterRole = {
      apiVersion: ClusterRoleApiVersion,
      kind: ClusterRoleKind,
      metadata: {
        name: 'test-role',
        uid: 'test-role-uid',
        creationTimestamp: '2025-01-24T17:48:45Z',
      },
      rules: [],
    }

    mockUseRolesContext.mockReturnValue({ loading: false, clusterRoles: [mockRole] })
    mockUseCurrentRole.mockReturnValue(mockRole)

    render(<Component />)

    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })
})
