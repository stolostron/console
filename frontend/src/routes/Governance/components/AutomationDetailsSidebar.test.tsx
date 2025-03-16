/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RecoilRoot } from 'recoil'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { AutomationDetailsSidebar } from './AutomationDetailsSidebar'
import { AnsibleJob, Policy, PolicyAutomation, Secret } from '../../../resources'
import { enableMapSet } from 'immer'
import React from 'react'

// Enable immer for Sets
enableMapSet()

// Mock the resource utils
jest.mock('../../../resources/utils', () => ({
  ...jest.requireActual('../../../resources/utils'),
  deleteResource: jest.fn().mockResolvedValue({}),
}))

// Mock the navigate function
const mockNavigate = jest.fn()
jest.mock('react-router-dom-v5-compat', () => {
  const actual = jest.requireActual('react-router-dom-v5-compat')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    generatePath: jest.fn((path: string, params: Record<string, string>) => {
      // Simple mock implementation that replaces parameters
      let result = path
      Object.entries(params).forEach(([key, value]) => {
        result = result.replace(`:${key}`, value)
      })
      return result
    }),
  }
})

// Mock AutomationProviderHint component
jest.mock('../../../components/AutomationProviderHint', () => ({
  AutomationProviderHint: () => <div>Provider Hint Mock</div>,
}))

// Mock AcmTimestamp component
jest.mock('../../../lib/AcmTimestamp', () => ({
  __esModule: true,
  default: jest.fn(({ timestamp }) => <div data-testid="acm-timestamp-cell">{timestamp}</div>),
}))

// Mock AcmTable component
jest.mock('../../../ui-components', () => ({
  AcmEmptyState: ({ title, message }: { title: string; message: string }) => (
    <div>
      {title}: {message}
    </div>
  ),
  AcmTable: ({ items, columns, keyFn }: { items: any[]; columns: any[]; keyFn: (item: any) => string }) => (
    <div data-testid="acm-table">
      {items.map((item) => (
        <div key={keyFn(item)}>
          {columns.map((column) => {
            const cellContent =
              typeof column.cell === 'function'
                ? column.cell(item) // Call the cell function with the item
                : item[column.cell]
            return (
              <div key={`${keyFn(item)}-${column.header}`}>
                {column.header}: {cellContent}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  ),
}))

// Mock the Recoil shared atoms
jest.mock('../../../shared-recoil', () => ({
  useSharedAtoms: jest.fn().mockReturnValue({
    ansibleJobState: 'ansibleJobState',
    secretsState: 'secretsState',
  }),
  useRecoilValue: jest.fn((atom: string) => {
    if (atom === 'ansibleJobState') return mockAnsibleJobs
    if (atom === 'secretsState') return mockSecrets
    return []
  }),
}))

// Mock the useTranslation hook
jest.mock('../../../lib/acm-i18next', () => ({
  useTranslation: jest.fn().mockReturnValue({
    t: (key: string) => key,
  }),
  Trans: ({ i18nKey }: { i18nKey: string }) => <span>{i18nKey}</span>,
}))

// Mock the useGovernanceData hook
jest.mock('../useGovernanceData', () => ({
  useGovernanceData: jest.fn().mockReturnValue({
    clusterRisks: {
      high: 1,
      medium: 2,
      low: 0,
      unknown: 0,
      synced: 0,
    },
  }),
}))

// Mock BulkActionModal component
interface BulkActionModalProps {
  title: string
  actionFn: (resources: any[]) => void
  children?: React.ReactNode
  resource: any
}

jest.mock('../../../components/BulkActionModal', () => ({
  BulkActionModal: ({ title, actionFn, children, ...props }: BulkActionModalProps) => (
    <div data-testid="bulk-action-modal">
      <div>{title}</div>
      <button onClick={() => actionFn([props.resource])}>Delete</button>
      {children}
    </div>
  ),
}))

// Mock data
const mockPolicy: Policy = {
  apiVersion: 'policy.open-cluster-management.io/v1',
  kind: 'Policy',
  metadata: {
    name: 'test-policy',
    namespace: 'test-namespace',
    uid: 'policy-uid-123',
  },
  spec: {
    disabled: false,
    'policy-templates': [], // Fix: changed from policy_templates to policy-templates
    remediationAction: 'inform',
  },
  status: {
    status: [],
    compliant: 'Compliant',
  },
}

const mockPolicyAutomation: PolicyAutomation = {
  apiVersion: 'policy.open-cluster-management.io/v1beta1',
  kind: 'PolicyAutomation',
  metadata: {
    name: 'test-automation',
    namespace: 'test-namespace',
    uid: 'automation-uid-123',
  },
  spec: {
    policyRef: 'test-policy',
    mode: 'once',
    automationDef: {
      name: 'test-job',
      secret: 'test-secret',
      type: 'AnsibleJob',
      extra_vars: {},
    },
  },
}

const mockSecrets: Secret[] = [
  {
    apiVersion: 'v1',
    kind: 'Secret',
    metadata: {
      name: 'test-secret',
      namespace: 'test-namespace',
      labels: {
        'cluster.open-cluster-management.io/type': 'ans',
      },
    },
    data: {
      host: btoa('https://ansible-tower.example.com'),
    },
  },
]

const mockAnsibleJobs: AnsibleJob[] = [
  {
    apiVersion: 'tower.ansible.com/v1alpha1',
    kind: 'AnsibleJob',
    metadata: {
      name: 'test-job-1',
      namespace: 'test-namespace',
      ownerReferences: [
        {
          apiVersion: 'policy.open-cluster-management.io/v1beta1',
          kind: 'PolicyAutomation',
          name: 'test-automation',
        },
      ],
    },
    status: {
      ansibleJobResult: {
        status: 'successful',
        started: '2023-01-01T12:00:00Z',
        finished: '2023-01-01T12:05:00Z',
        changed: true, // Added missing required properties
        failed: false,
      },
      conditions: [
        {
          lastTransitionTime: '2023-01-01T12:00:00Z',
          reason: 'Successful',
          status: 'True',
          type: 'Running',
          message: 'Job completed successfully',
          ansibleResult: {},
        },
      ],
    },
  },
]

describe('AutomationDetailsSidebar', () => {
  const mockSetModal = jest.fn()
  const mockOnClose = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders correctly with jobs', async () => {
    render(
      <RecoilRoot>
        <MemoryRouter>
          <AutomationDetailsSidebar
            setModal={mockSetModal}
            policyAutomationMatch={mockPolicyAutomation}
            policy={mockPolicy}
            onClose={mockOnClose}
          />
        </MemoryRouter>
      </RecoilRoot>
    )

    // Check for policy information
    expect(screen.getByText('Policy name')).toBeInTheDocument()
    expect(screen.getByText('test-policy')).toBeInTheDocument()

    // Check automation mode
    expect(screen.getByText('Policy automation mode')).toBeInTheDocument()
    expect(screen.getByText('once')).toBeInTheDocument()

    // Check tower URL
    expect(screen.getByText('https://ansible-tower.example.com')).toBeInTheDocument()

    expect(screen.getByText(/^Status:/)).toBeInTheDocument()
    expect(screen.getByText(/Successful/)).toBeInTheDocument()
    screen.logTestingPlaygroundURL()

    expect(screen.getByText(/^Started:/)).toBeInTheDocument()
    expect(screen.getByText('2023-01-01T12:00:00Z')).toBeInTheDocument()

    expect(screen.getByText(/^Finished:/)).toBeInTheDocument()
    expect(screen.getByText('2023-01-01T12:00:00Z')).toBeInTheDocument()
  })

  it('navigates to edit page when Edit button is clicked', async () => {
    render(
      <RecoilRoot>
        <MemoryRouter>
          <AutomationDetailsSidebar
            setModal={mockSetModal}
            policyAutomationMatch={mockPolicyAutomation}
            policy={mockPolicy}
            onClose={mockOnClose}
          />
        </MemoryRouter>
      </RecoilRoot>
    )

    userEvent.click(screen.getByText('Edit'))

    // Check that navigate was called with the right path
    expect(mockNavigate).toHaveBeenCalled()
  })

  it('calls onClose when Cancel button is clicked', async () => {
    render(
      <RecoilRoot>
        <MemoryRouter>
          <AutomationDetailsSidebar
            setModal={mockSetModal}
            policyAutomationMatch={mockPolicyAutomation}
            policy={mockPolicy}
            onClose={mockOnClose}
          />
        </MemoryRouter>
      </RecoilRoot>
    )

    userEvent.click(screen.getByText('Cancel'))

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })
})
