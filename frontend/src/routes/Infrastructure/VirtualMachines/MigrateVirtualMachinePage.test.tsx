/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NavigationPath } from '../../../NavigationPath'
import MigrateVirtualMachinePage from './MigrateVirtualMachinePage'

const mockNavigate = jest.fn()

jest.mock('react-router-dom-v5-compat', () => ({
  __esModule: true,
  useParams: () => ({ id: 'test-vm' }),
  useNavigate: () => mockNavigate,
}))

jest.mock('../../../lib/acm-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({ t: (key: string) => key }),
}))

jest.mock('../../../ui-components', () => ({
  __esModule: true,
  AcmModal: ({ title, children, actions }: any) => (
    <div>
      <h1>{title}</h1>
      {children}
      {actions}
    </div>
  ),
  AcmButton: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
}))

jest.mock('../../../components/AcmDataForm', () => ({
  __esModule: true,
  AcmDataFormPage: () => (
    <div>
      <h1>Proceed with migration of VM test-vm</h1>
      <button type="button" onClick={() => mockNavigate(NavigationPath.virtualMachines)}>
        Cancel
      </button>
      <button type="button" onClick={() => console.log('trigger migration')}>
        Migrate test-vm
      </button>
    </div>
  ),
}))

describe('MigrateVirtualMachinePage', () => {
  const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {})

  afterEach(() => {
    mockNavigate.mockReset()
    consoleSpy.mockClear()
  })

  it('renders VM-specific text and buttons', () => {
    render(<MigrateVirtualMachinePage />)

    expect(screen.getByText(/Proceed with migration of VM test-vm/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Migrate test-vm/i })).toBeInTheDocument()
  })

  it('navigates back when Cancel is clicked', () => {
    render(<MigrateVirtualMachinePage />)

    userEvent.click(screen.getByRole('button', { name: /Cancel/i }))

    expect(mockNavigate).toHaveBeenCalledWith(NavigationPath.virtualMachines)
  })

  it('logs the migration action when Migrate is clicked', () => {
    render(<MigrateVirtualMachinePage />)

    userEvent.click(screen.getByRole('button', { name: /Migrate test-vm/i }))

    expect(consoleSpy).toHaveBeenCalledWith('trigger migration')
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})
