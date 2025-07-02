// /* Copyright Contributors to the Open Cluster Management project */
// import VMWizardPage from './VMWizardpage'
import '@testing-library/jest-dom'
import { VMWizardPage } from './VMWizardPage'
import { render, screen, within } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
import userEvent from '@testing-library/user-event'

const mockNavigate = jest.fn()
const mockParams = jest.fn()

jest.mock('react-router-dom-v5-compat', () => ({
  __esModule: true,

  // srcnamespace/uid+srcnamespace+srccluster
  // sno-2-b9657/70b7f458-d6ef-4d98-9b0b-e9c5a5f260d0+sno-2-b9657+dev-sno-2-b9657

  // useParams: () => ({ id: 'namespace-1/a1+namespace-1+cluster-1' }),
  useParams: () => mockParams(),
  useNavigate: () => mockNavigate,
}))

jest.mock('../../lib/acm-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({ t: (key: string) => key }),
}))

jest.mock('../../components/AcmDataForm', () => ({
  __esModule: true,
  AcmDataFormPage: ({ formData }: any) => {
    // Collect all 'Custom' components into a single array
    const customComponents = formData.sections
      ?.flatMap((section: any) => section.inputs || [])
      .filter((input: any) => input.type === 'Custom')
      .map((input: any, index: number) => (
        <div key={index} data-testid={`custom-input-${index}`}>
          {input.component}
        </div>
      ))

    return (
      <div data-testid="acm-data-form-page-mock">
        <h1 data-testid="form-title">{formData.title}</h1>
        {formData.description && <p data-testid="form-description">{formData.description}</p>}
        {/* Render the core form content */}
        {customComponents}

        {/* Render submit and cancel buttons */}
        <div data-testid="form-actions">
          {formData.submitText && (
            <button data-testid="submit-button" onClick={formData.submit}>
              {formData.submitText} submit
            </button>
          )}
          {formData.nextLabel && (
            <button data-testid="next-button" onClick={formData.submit}>
              {formData.nextLabel} next
            </button>
          )}
          {formData.cancelLabel && (
            <button data-testid="cancel-button" onClick={formData.cancel}>
              {formData.cancelLabel} cancel
            </button>
          )}
        </div>
      </div>
    )
  },
}))

const MOCK_SRC_CLUSTERS = [
  { name: 'cluster-1', uid: 'a1' },
  { name: 'cluster-2', uid: 'b2' },
  { name: 'cluster-3', uid: 'c3' },
]

jest.mock('../../routes/Infrastructure/Clusters/ManagedClusters/components/useAllClusters', () => ({
  useAllClusters: jest.fn(() => MOCK_SRC_CLUSTERS),
}))

const mockSearchQuery = jest.fn()
const MOCK_NAMESPACES = ['namespace-1', 'namespace-2', 'namespace-3']

jest.mock('../../routes/Search/search-sdk/search-sdk', () => ({
  __esModule: true,
  useSearchCompleteLazyQuery: jest.fn(() => [
    mockSearchQuery,
    {
      data: { searchComplete: MOCK_NAMESPACES },
      loading: false,
      error: undefined,
    },
  ]),
}))

jest.mock('../../routes/Search/search-sdk/search-client', () => ({
  searchClient: {},
}))

// Start tests
describe('VMWizardPage', () => {
  //const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
  const consoleSpy = jest.spyOn(console, 'log')

  afterEach(() => {
    mockNavigate.mockReset()
    mockParams.mockReset()
    consoleSpy.mockClear()
  })

  it('should render the form and have the correct components', () => {
    mockParams.mockReturnValue({
      id: 'cluster-1/a1+cluster-1+namespace-1',
    })

    render(
      <MockedProvider>
        <VMWizardPage />
      </MockedProvider>
    )

    expect(screen.getByText(/Virtual machine migration/i)).toBeInTheDocument()
    expect(
      screen.getByText(/Choose the target location for your VMs, and review migration readiness/i)
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Source' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Target *' })).toBeInTheDocument()

    expect(screen.getByRole('button', { name: /Migrate now/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument()
  })

  it('should populate the src cluster, src project, dst cluster, and dst project with default values', () => {
    mockParams.mockReturnValue({
      id: 'cluster-1/a1+cluster-1+namespace-1',
    })

    render(
      <MockedProvider>
        <VMWizardPage />
      </MockedProvider>
    )
    // expect src default values to be present
    expect(screen.getByDisplayValue('cluster-1')).toBeInTheDocument()
    expect(screen.getByDisplayValue('namespace-1')).toBeInTheDocument()

    // expect dst default values to be present
    expect(screen.getByText('Select Cluster')).toBeInTheDocument()
    expect(screen.getByText('To select project, fill cluster first')).toBeInTheDocument()
  })

  it('should click on the dst cluster dropmenu and see the correct available values', () => {
    mockParams.mockReturnValue({
      id: 'cluster-1/a1+cluster-1+namespace-1',
    })

    render(
      <MockedProvider>
        <VMWizardPage />
      </MockedProvider>
    )
    // click and select a cluster
    const dropdownMenuCluster = screen.getByText('Select Cluster')
    userEvent.click(screen.getByText('Select Cluster'))

    userEvent.click(screen.getByText(/cluster-2/i))
    expect(within(dropdownMenuCluster).getByText(/cluster-2/i)).toBeInTheDocument()

    // click and select a project
    const dropdownMenuProject = screen.getByText('Select Project')
    userEvent.click(screen.getByText('Select Project'))

    userEvent.click(screen.getByText(/namespace-1/i))
    expect(within(dropdownMenuProject).getByText(/namespace-1/i)).toBeInTheDocument()
  })

  it('tests the next button after values are populated', () => {
    mockParams.mockReturnValue({
      id: 'cluster-1/a1+cluster-1+namespace-1',
    })

    render(
      <MockedProvider>
        <VMWizardPage />
      </MockedProvider>
    )

    // select the cluster
    userEvent.click(screen.getByText('Select Cluster'))
    userEvent.click(screen.getByText(/cluster-2/i))

    // select the namespace
    userEvent.click(screen.getByText('Select Project'))
    userEvent.click(screen.getByText(/namespace-1/i))

    // click the next button
    userEvent.click(screen.getByRole('button', { name: /Next/i }))
    // find an element that is expected to be there
    expect(screen.getByRole('tab', { name: 'Network mapping' })).toBeInTheDocument()
  })
})
