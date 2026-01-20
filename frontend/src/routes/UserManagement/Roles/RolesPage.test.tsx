/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { RolesPage } from './RolesPage'

// Mock the RolesTable component
jest.mock('./RolesTable', () => ({
  RolesTable: jest.fn((props: any) => (
    <div data-testid="mocked-roles-table" data-hiddencolumns={JSON.stringify(props.hiddenColumns)}>
      Mocked Roles Table
    </div>
  )),
}))

// Mock AcmTableStateProvider and other ui-components
jest.mock('../../../ui-components', () => ({
  AcmPage: jest.fn(({ children, header }: { children: React.ReactNode; header: React.ReactNode }) => (
    <div data-testid="acm-page">
      {header}
      {children}
    </div>
  )),
  AcmPageContent: jest.fn(({ children }: { children: React.ReactNode }) => (
    <div data-testid="acm-page-content">{children}</div>
  )),
  AcmPageHeader: jest.fn((props: any) => (
    <div data-testid="acm-page-header">
      <span>{props.title}</span>
      <span>{props.description}</span>
    </div>
  )),
  AcmTableStateProvider: jest.fn(
    ({ children, localStorageKey }: { children: React.ReactNode; localStorageKey: string }) => (
      <div data-testid="acm-table-state-provider" data-localstorage-key={localStorageKey}>
        {children}
      </div>
    )
  ),
}))

// Mock shared-recoil
jest.mock('../../../shared-recoil', () => ({
  useRecoilValue: jest.fn(() => []),
  useSharedAtoms: jest.fn(() => ({ multiclusterRolesState: {} })),
}))

// Mock translation
jest.mock('../../../lib/acm-i18next', () => ({
  useTranslation: jest.fn(() => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        Roles: 'Roles',
        'Manage roles and permissions': 'Manage roles and permissions',
      }
      return translations[key] || key
    },
  })),
}))

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
  test('should render roles page', () => {
    const { container } = render(<Component />)

    expect(container.querySelector('[data-testid="acm-page"]')).toBeInTheDocument()
    expect(container.querySelector('[data-testid="acm-page-header"]')).toBeInTheDocument()
    expect(screen.getByText('Roles')).toBeInTheDocument()
    expect(screen.getByText('Manage roles and permissions')).toBeInTheDocument()
  })

  test('should wrap RolesTable with AcmTableStateProvider using correct localStorageKey', () => {
    const { container } = render(<Component />)

    const provider = container.querySelector('[data-testid="acm-table-state-provider"]')
    expect(provider).toBeInTheDocument()
    expect(provider).toHaveAttribute('data-localstorage-key', 'user-mgmt-roles-table-state')
  })

  test('should render RolesTable as a child of AcmTableStateProvider', () => {
    const { container } = render(<Component />)

    const provider = container.querySelector('[data-testid="acm-table-state-provider"]')
    const rolesTable = provider?.querySelector('[data-testid="mocked-roles-table"]')
    expect(rolesTable).toBeInTheDocument()
  })

  test('should pass hiddenColumns prop to RolesTable with radio column hidden', () => {
    const { container } = render(<Component />)

    const rolesTable = container.querySelector('[data-testid="mocked-roles-table"]')
    expect(rolesTable).toBeInTheDocument()
    expect(rolesTable).toHaveAttribute('data-hiddencolumns', '["radio"]')
  })
})
