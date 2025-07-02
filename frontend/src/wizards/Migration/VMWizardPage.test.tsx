// /* Copyright Contributors to the Open Cluster Management project */
// import VMWizardPage from './VMWizardpage'
import '@testing-library/jest-dom'
import React from 'react'

const mockNavigate = jest.fn()

jest.mock('react-router-dom-v5-compat', () => ({
  __esModule: true,
  useParams: () => ({ id: 'testsno-2-cb7dv/e5e0aadc-4933-4bed-980a-7c59b89d0156+sno-2-cb7dv+dev-sno-2-cb7dv' }),
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
