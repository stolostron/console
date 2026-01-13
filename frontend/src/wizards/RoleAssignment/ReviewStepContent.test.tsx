/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import { ReviewStepContent } from './ReviewStepContent'
import { RoleAssignmentWizardFormData } from './types'

// Mock the translation hook
jest.mock('../../lib/acm-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

// Mock GranularityStepContent
jest.mock('./GranularityStepContent', () => ({
  GranularityStepContent: ({ title }: { title: string }) => (
    <div data-testid="granularity-step-content">
      <h2>{title}</h2>
    </div>
  ),
}))

const createFormData = (overrides: Partial<RoleAssignmentWizardFormData> = {}): RoleAssignmentWizardFormData => ({
  subject: { kind: 'User' },
  scope: { kind: 'all', clusterNames: [] },
  roles: [],
  scopeType: 'Global access',
  ...overrides,
})

describe('ReviewStepContent', () => {
  it('renders the Review title', () => {
    render(<ReviewStepContent formData={createFormData()} />)

    expect(screen.getByText('Review')).toBeInTheDocument()
  })

  it('renders user subject information', () => {
    render(
      <ReviewStepContent
        formData={createFormData({
          subject: { kind: 'User', user: ['john.doe'] },
        })}
      />
    )

    expect(screen.getByText('User')).toBeInTheDocument()
    expect(screen.getByText('john.doe')).toBeInTheDocument()
  })

  it('renders group subject information', () => {
    render(
      <ReviewStepContent
        formData={createFormData({
          subject: { kind: 'Group', group: ['developers'] },
        })}
      />
    )

    expect(screen.getByText('Group')).toBeInTheDocument()
    expect(screen.getByText('developers')).toBeInTheDocument()
  })

  it('renders Not selected when user is not provided', () => {
    render(
      <ReviewStepContent
        formData={createFormData({
          subject: { kind: 'User' },
        })}
      />
    )

    expect(screen.getByText('Not selected')).toBeInTheDocument()
  })

  it('renders Not selected when group is not provided', () => {
    render(
      <ReviewStepContent
        formData={createFormData({
          subject: { kind: 'Group' },
        })}
      />
    )

    expect(screen.getByText('Not selected')).toBeInTheDocument()
  })

  it('renders Scope section with Global access', () => {
    render(
      <ReviewStepContent
        formData={createFormData({
          scopeType: 'Global access',
        })}
      />
    )

    expect(screen.getByText('Scope')).toBeInTheDocument()
    expect(screen.getByText('All clusters')).toBeInTheDocument()
  })

  it('renders Scope section for Select cluster sets', () => {
    render(
      <ReviewStepContent
        formData={createFormData({
          scopeType: 'Select cluster sets',
          selectedClusterSets: [{ metadata: { name: 'cluster-set-1' } }, { metadata: { name: 'cluster-set-2' } }],
        })}
      />
    )

    expect(screen.getByText('Cluster sets')).toBeInTheDocument()
    expect(screen.getByText('cluster-set-1, cluster-set-2')).toBeInTheDocument()
  })

  it('renders None selected when no cluster sets are selected', () => {
    render(
      <ReviewStepContent
        formData={createFormData({
          scopeType: 'Select cluster sets',
          selectedClusterSets: [],
        })}
      />
    )

    expect(screen.getByText('None selected')).toBeInTheDocument()
  })

  it('renders Full access when no namespaces are selected for cluster sets', () => {
    render(
      <ReviewStepContent
        formData={createFormData({
          scopeType: 'Select cluster sets',
          selectedClusterSets: [{ metadata: { name: 'cs-1' } }],
        })}
      />
    )

    expect(screen.getByText('Full access')).toBeInTheDocument()
  })

  it('renders Scope section for Select clusters with cluster names', () => {
    render(
      <ReviewStepContent
        formData={createFormData({
          scopeType: 'Select clusters',
          selectedClusters: [{ metadata: { name: 'cluster-a' } }, { metadata: { name: 'cluster-b' } }],
        })}
      />
    )

    expect(screen.getByText(/cluster-a, cluster-b/)).toBeInTheDocument()
  })

  it('renders None selected when no clusters are selected', () => {
    render(
      <ReviewStepContent
        formData={createFormData({
          scopeType: 'Select clusters',
          selectedClusters: [],
        })}
      />
    )

    expect(screen.getByText(/None selected/)).toBeInTheDocument()
  })

  it('renders Full access when no namespaces are selected for clusters', () => {
    render(
      <ReviewStepContent
        formData={createFormData({
          scopeType: 'Select clusters',
          selectedClusters: [{ name: 'cluster-1' }],
        })}
      />
    )

    expect(screen.getByText(/Full access/)).toBeInTheDocument()
  })

  it('renders namespaces when provided', () => {
    render(
      <ReviewStepContent
        formData={createFormData({
          scopeType: 'Select clusters',
          selectedClusters: [{ name: 'cluster-1' }],
          scope: { kind: 'specific', namespaces: ['namespace-1', 'namespace-2'] },
        })}
      />
    )

    expect(screen.getByText(/namespace-1, namespace-2/)).toBeInTheDocument()
  })

  it('renders Role section with selected role', () => {
    render(
      <ReviewStepContent
        formData={createFormData({
          roles: ['admin-role'],
        })}
      />
    )

    expect(screen.getByText('Role')).toBeInTheDocument()
    expect(screen.getByText('admin-role')).toBeInTheDocument()
  })

  it('renders No role selected when no role is provided', () => {
    render(
      <ReviewStepContent
        formData={createFormData({
          roles: [],
        })}
      />
    )

    expect(screen.getByText('No role selected')).toBeInTheDocument()
  })

  it('uses preselected cluster names when selectedClusters is empty', () => {
    render(
      <ReviewStepContent
        formData={createFormData({
          scopeType: 'Select clusters',
          selectedClusters: [],
        })}
        preselected={{ clusterNames: ['preselected-cluster-1', 'preselected-cluster-2'] }}
      />
    )

    expect(screen.getByText(/preselected-cluster-1, preselected-cluster-2/)).toBeInTheDocument()
  })

  it('renders multiple users joined by comma', () => {
    render(
      <ReviewStepContent
        formData={createFormData({
          subject: { kind: 'User', user: ['user1', 'user2', 'user3'] },
        })}
      />
    )

    expect(screen.getByText('user1, user2, user3')).toBeInTheDocument()
  })

  it('renders multiple groups joined by comma', () => {
    render(
      <ReviewStepContent
        formData={createFormData({
          subject: { kind: 'Group', group: ['group1', 'group2'] },
        })}
      />
    )

    expect(screen.getByText('group1, group2')).toBeInTheDocument()
  })

  it('handles clusters with name property', () => {
    render(
      <ReviewStepContent
        formData={createFormData({
          scopeType: 'Select clusters',
          selectedClusters: [{ name: 'cluster-with-name' }],
        })}
      />
    )

    expect(screen.getByText(/cluster-with-name/)).toBeInTheDocument()
  })

  it('handles clusters with metadata.name property', () => {
    render(
      <ReviewStepContent
        formData={createFormData({
          scopeType: 'Select clusters',
          selectedClusters: [{ metadata: { name: 'cluster-with-metadata' } }],
        })}
      />
    )

    expect(screen.getByText(/cluster-with-metadata/)).toBeInTheDocument()
  })

  it('renders access level text for cluster sets when no specific clusters selected', () => {
    render(
      <ReviewStepContent
        formData={createFormData({
          scopeType: 'Select cluster sets',
          selectedClusterSets: [{ metadata: { name: 'cs-1' } }],
          selectedClusters: [],
        })}
      />
    )

    expect(screen.getByText('Full access to all clusters in selected cluster sets')).toBeInTheDocument()
  })
})
