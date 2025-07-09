// /* Copyright Contributors to the Open Cluster Management project */
// import VMWizardPage from './VMWizardpage'
import '@testing-library/jest-dom'
import React from 'react'
import { useSearchCompleteLazyQuery } from '../../routes/Search/search-sdk/search-sdk'
import { useAllClusters } from '../../routes/Infrastructure/Clusters/ManagedClusters/components/useAllClusters'
import { VMWizardPage } from './VMWizardPage'
import { render, waitFor } from '@testing-library/react'

const mockNavigate = jest.fn()
const mockUseParams = jest.fn()

// 'testsno-2-cb7dv/e5e0aadc-4933-4bed-980a-7c59b89d0156+sno-2-cb7dv+dev-sno-2-cb7dv'
jest.mock('react-router-dom-v5-compat', () => ({
  __esModule: true,
  useParams: () => mockUseParams(),
  useNavigate: () => mockNavigate,
}))

jest.mock('../../../lib/acm-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({ t: (key: string) => key }),
}))

jest.mock('../../components/AcmDataForm', () => ({
  __esModule: true,
  AcmDataFormPage: ({ formData }: any) => (
    <div data-testid="acm-data-form-page-mock">
      <h1>{formData.title}</h1>
      <p>{formData.description}</p>

      {/* Iterate and render sections and their inputs */}
      {formData.sections?.map((section: any, sectionIdx: number) => (
        <div key={sectionIdx} data-testid={`form-section-${sectionIdx}`}>
          {section.title && <h2 data-testid={`section-title-${sectionIdx}`}>{section.title}</h2>}

          {/* Render inputs within the section */}
          {section.inputs?.map((input: any, inputIdx: number) => {
            if (input.type === 'Custom') {
              // If the input type is 'Custom', render its component directly
              // This is how your PatternFly Split/FormGroup/Select/TextInput components
              // defined within VMWizardPage's formData.sections.inputs[...].component
              // will actually appear in the test DOM.
              return (
                <div key={`${sectionIdx}-${inputIdx}`} data-testid={`custom-input-${input.id}`}>
                  {input.component}
                </div>
              )
            } else if (input.type === 'Text') {
              // If there are other standard input types, you might mock them as simple inputs
              return (
                <input
                  key={`${sectionIdx}-${inputIdx}`}
                  data-testid={`mock-input-${input.id}`}
                  type="text"
                  value={input.value || ''}
                  onChange={input.onChange || (() => {})} // Provide empty function if none
                  disabled={input.isDisabled}
                  readOnly={input.isDisabled}
                />
              )
            }
            // Handle other input types as needed, or return null for unhandled types
            return null
          })}
        </div>
      ))}

      <button data-testid="submit-button" onClick={formData.submit}>
        {formData.submitText} submit
      </button>
      <button data-testid="cancel-button" onClick={formData.cancel}>
        {formData.cancelLabel} cancel
      </button>
    </div>
  ),
}))

const mockAddAlert = jest.fn()
jest.mock('../../ui-components', () => ({
  __esModule: true,
  AcmToastContext: React.createContext({ addAlert: mockAddAlert }), // Create a simple context mock
}))

const MOCK_ALL_CLUSTERS = [
  { name: 'cluster-1', status: 'ready', uid: 'a1' },
  { name: 'cluster-2', status: 'ready', uid: 'b2' },
  { name: 'cluster-3', status: 'ready', uid: 'c3' },
]

jest.mock('../../routes/Infrastructure/Clusters/ManagedClusters/components/useAllClusters', () => ({
  useAllClusters: jest.fn(() => MOCK_ALL_CLUSTERS),
}))

const MOCK_NAMESPACES = ['cluster-1', 'kube-system', 'open-cluster-management']
const mockSearchQuery = jest.fn() // Mock the query function
jest.mock('../../routes/Search/search-sdk/search-sdk', () => ({
  useSearchCompleteLazyQuery: jest.fn(() => [
    mockSearchQuery, // The query function
    {
      data: { searchComplete: MOCK_NAMESPACES }, // The data returned
      loading: false,
      error: undefined,
    },
  ]),
}))
jest.mock('../../routes/Search/search-sdk/search-client', () => ({
  searchClient: {}, // Mock the client itself as it's not used in testing data
}))

// Mock the ReadinessSection sub-component to keep tests focused on VMWizardPage
jest.mock('./ReadinessSection', () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="readiness-section-mock">Readiness Section Mock</div>),
}))

// Start tests
describe('VMWizardPage', () => {
  mockNavigate.mockReset()
  mockAddAlert.mockReset()
  ;(useAllClusters as jest.Mock).mockReset()
  ;(useSearchCompleteLazyQuery as jest.Mock).mockReset()

  it('should render the form and parse URL parameters correctly', async () => {
    // Set the mock return value for useParams
    mockUseParams.mockReturnValue({ id: 'vm-uid-123 sno-2-cb7dv dev-sno-2-cb7dv' })

    render(<VMWizardPage />)

    // Check if the main form page is rendered
    expect(screen.getByTestId('acm-data-form-page-mock')).toBeInTheDocument()

    // Wait for the useEffect to process the URL params and update the disabled TextInputs
    await waitFor(() => {
      // Check Source Cluster and Project TextInputs (which are disabled/read-only)
      // Assuming their IDs in the form are 'srcCluster' and 'srcNs'
      expect(screen.getByTestId('mock-text-input-srcCluster')).toHaveValue('sno-2-cb7dv')
      expect(screen.getByTestId('mock-text-input-srcNs')).toHaveValue('dev-sno-2-cb7dv')
    })
  })
})
