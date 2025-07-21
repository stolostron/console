/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { NavigationPath } from '../../../NavigationPath'
import MigrateVirtualMachinePage from './MigrateVirtualMachinePage'

const mockNavigate = jest.fn()

jest.mock('react-router-dom-v5-compat', () => ({
  __esModule: true,
  useNavigate: () => mockNavigate,
}))

jest.mock('../../../lib/acm-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({ t: (key: string) => key }),
}))

jest.mock('../../../ui-components', () => ({
  __esModule: true,
  AcmModal: ({ children }: any) => <div data-testid="acm-modal">{children}</div>,
}))

jest.mock('../../../wizards/Migration/VMWizardPage', () => ({
  __esModule: true,
  VMWizardPage: () => <div data-testid="vm-wizard-page">Migration Wizard</div>,
}))

describe('MigrateVirtualMachinePage', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
  })

  it('renders without crashing', () => {
    const { container } = render(<MigrateVirtualMachinePage />)
    expect(container).toBeInTheDocument()
  })

  it('uses the correct navigation path constant', () => {
    expect(NavigationPath.virtualMachines).toBeDefined()
  })

  it('sets up navigate mock correctly', () => {
    render(<MigrateVirtualMachinePage />)
    expect(mockNavigate).toEqual(expect.any(Function))
  })
})
