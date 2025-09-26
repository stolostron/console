/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { nockIgnoreRBAC, nockIgnoreApiPaths } from '../../../../lib/nock-util'
import { RoleYaml } from './RoleYaml'
import { ClusterRole, ClusterRoleKind } from '../../../../resources/rbac'

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

  it('should render loading state', () => {
    mockUseRolesContext.mockReturnValue({ loading: true, clusterRoles: [] })
    mockUseCurrentRole.mockReturnValue(undefined)

    render(<Component />)

    expect(screen.getByText('Loading')).toBeInTheDocument()
  })

  it('should render role not found message', () => {
    mockUseRolesContext.mockReturnValue({ loading: false, clusterRoles: [] })
    mockUseCurrentRole.mockReturnValue(undefined)

    render(<Component />)

    expect(screen.getByText('Role not found')).toBeInTheDocument()
  })

  it('should render YAML editor with role data', () => {
    const mockRole: ClusterRole = {
      apiVersion: 'rbac.authorization.k8s.io/v1',
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
    // Verify the YAML contains specific role data
    expect(screen.getByDisplayValue(/test-role/)).toBeInTheDocument()
    expect(screen.getByDisplayValue(/ClusterRole/)).toBeInTheDocument()
    expect(screen.getByDisplayValue(/rbac\.authorization\.k8s\.io\/v1/)).toBeInTheDocument()
  })

  it('should render YAML editor with complex role data including rules', () => {
    const complexRole: ClusterRole = {
      apiVersion: 'rbac.authorization.k8s.io/v1',
      kind: ClusterRoleKind,
      metadata: {
        name: 'complex-role',
        uid: 'complex-role-uid',
        creationTimestamp: '2025-01-24T17:48:45Z',
        labels: {
          app: 'test-app',
          version: 'v1.0.0',
        },
        annotations: {
          description: 'A complex test role',
        },
      },
      rules: [
        {
          verbs: ['get', 'list', 'watch'],
          apiGroups: [''],
          resources: ['pods', 'services'],
          resourceNames: [],
          nonResourceURLs: [],
        },
        {
          verbs: ['create', 'update', 'patch', 'delete'],
          apiGroups: ['apps'],
          resources: ['deployments'],
          resourceNames: [],
          nonResourceURLs: [],
        },
      ],
    }

    mockUseRolesContext.mockReturnValue({ loading: false, clusterRoles: [complexRole] })
    mockUseCurrentRole.mockReturnValue(complexRole)

    render(<Component />)

    expect(screen.getByRole('textbox')).toBeInTheDocument()
    // Verify the YAML contains complex role data with rules and metadata
    expect(screen.getByDisplayValue(/complex-role/)).toBeInTheDocument()
    expect(screen.getByDisplayValue(/test-app/)).toBeInTheDocument()
    expect(screen.getByDisplayValue(/get/)).toBeInTheDocument()
    expect(screen.getByDisplayValue(/pods/)).toBeInTheDocument()
    expect(screen.getByDisplayValue(/deployments/)).toBeInTheDocument()
  })

  it('should render YAML editor with minimal role data', () => {
    const minimalRole: ClusterRole = {
      apiVersion: 'rbac.authorization.k8s.io/v1',
      kind: ClusterRoleKind,
      metadata: {
        name: 'minimal-role',
      },
      rules: [],
    }

    mockUseRolesContext.mockReturnValue({ loading: false, clusterRoles: [minimalRole] })
    mockUseCurrentRole.mockReturnValue(minimalRole)

    render(<Component />)

    expect(screen.getByRole('textbox')).toBeInTheDocument()
    // Verify the YAML contains minimal role data
    expect(screen.getByDisplayValue(/minimal-role/)).toBeInTheDocument()
    expect(screen.getByDisplayValue(/ClusterRole/)).toBeInTheDocument()
    expect(screen.getByDisplayValue(/rbac\.authorization\.k8s\.io\/v1/)).toBeInTheDocument()
  })

  it('should handle role with no metadata name', () => {
    const roleWithoutName: ClusterRole = {
      apiVersion: 'rbac.authorization.k8s.io/v1',
      kind: ClusterRoleKind,
      metadata: {
        uid: 'no-name-uid',
        creationTimestamp: '2025-01-24T17:48:45Z',
      },
      rules: [],
    }

    mockUseRolesContext.mockReturnValue({ loading: false, clusterRoles: [roleWithoutName] })
    mockUseCurrentRole.mockReturnValue(roleWithoutName)

    render(<Component />)

    expect(screen.getByRole('textbox')).toBeInTheDocument()
    // Verify the YAML contains role data even without name
    expect(screen.getByDisplayValue(/no-name-uid/)).toBeInTheDocument()
    expect(screen.getByDisplayValue(/ClusterRole/)).toBeInTheDocument()
    expect(screen.getByDisplayValue(/rbac\.authorization\.k8s\.io\/v1/)).toBeInTheDocument()
  })

  it('should handle loading state from roles context', () => {
    mockUseRolesContext.mockReturnValue({ loading: true, clusterRoles: [] })
    mockUseCurrentRole.mockReturnValue(undefined)

    render(<Component />)

    expect(screen.getByText('Loading')).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('should handle empty roles context', () => {
    mockUseRolesContext.mockReturnValue({ loading: false, clusterRoles: [] })
    mockUseCurrentRole.mockReturnValue(undefined)

    render(<Component />)

    expect(screen.getByText('Role not found')).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })
})
