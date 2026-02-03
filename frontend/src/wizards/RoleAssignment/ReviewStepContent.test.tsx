/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import { ReviewStepContent } from './ReviewStepContent'
import { RoleAssignmentWizardFormData } from './types'
import { ManagedClusterSet } from '../../resources'

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
    expect(screen.getByText('Global / Applies to all resources registered in ACM')).toBeInTheDocument()
  })

  it('renders Scope section for Select cluster sets', () => {
    render(
      <ReviewStepContent
        formData={createFormData({
          scopeType: 'Select cluster sets',
          selectedClusterSets: [
            { metadata: { name: 'cluster-set-1' } },
            { metadata: { name: 'cluster-set-2' } },
          ] as ManagedClusterSet[],
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
          selectedClusterSets: [{ metadata: { name: 'cs-1' } }] as ManagedClusterSet[],
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
          selectedClusterSets: [{ metadata: { name: 'cs-1' } }] as ManagedClusterSet[],
          selectedClusters: [],
        })}
      />
    )

    expect(screen.getByText('Full access to all clusters in selected cluster sets')).toBeInTheDocument()
  })

  describe('Preselected data with cluster sets', () => {
    it('uses preselected cluster set names when selectedClusterSets is empty', () => {
      render(
        <ReviewStepContent
          formData={createFormData({
            scopeType: 'Select cluster sets',
            selectedClusterSets: [],
          })}
          preselected={{ clusterSetNames: ['preselected-set-1', 'preselected-set-2'] }}
        />
      )

      expect(screen.getByText('preselected-set-1, preselected-set-2')).toBeInTheDocument()
    })

    it('shows new cluster sets when selectedClusterSets is not empty', () => {
      render(
        <ReviewStepContent
          formData={createFormData({
            scopeType: 'Select cluster sets',
            selectedClusterSets: [
              { metadata: { name: 'new-set-1' } },
              { metadata: { name: 'new-set-2' } },
            ] as ManagedClusterSet[],
          })}
          preselected={{ clusterSetNames: ['old-set-1', 'old-set-2'] }}
        />
      )

      expect(screen.getByText('new-set-1, new-set-2')).toBeInTheDocument()
    })

    it('shows diff (old - new) when editing and cluster sets changed', () => {
      render(
        <ReviewStepContent
          formData={createFormData({
            scopeType: 'Select cluster sets',
            selectedClusterSets: [{ metadata: { name: 'new-set' } }] as ManagedClusterSet[],
          })}
          preselected={{ clusterSetNames: ['old-set'] }}
          isEditing={true}
        />
      )
      expect(screen.getByText('old-set').closest('s')).toBeInTheDocument()
      expect(screen.getByText('new-set')).toBeInTheDocument()
    })

    it('does NOT show diff when editing but cluster sets unchanged', () => {
      render(
        <ReviewStepContent
          formData={createFormData({
            scopeType: 'Select cluster sets',
            selectedClusterSets: [{ metadata: { name: 'same-set' } }] as ManagedClusterSet[],
          })}
          preselected={{ clusterSetNames: ['same-set'] }}
          isEditing={true}
        />
      )

      expect(screen.queryByText('same-set')?.closest('s')).not.toBeInTheDocument()
      expect(screen.queryByText('same-set')?.closest('strong')).not.toBeInTheDocument()
      expect(screen.getByText('same-set')).toBeInTheDocument()
    })

    it('correctly handles cluster sets in different order (regression test for sorting)', () => {
      render(
        <ReviewStepContent
          formData={createFormData({
            scopeType: 'Select cluster sets',
            selectedClusterSets: [
              { metadata: { name: 'set-1' } },
              { metadata: { name: 'set-2' } },
              { metadata: { name: 'set-3' } },
            ] as ManagedClusterSet[],
          })}
          preselected={{ clusterSetNames: ['set-3', 'set-1', 'set-2'] }}
          isEditing={true}
        />
      )

      expect(screen.queryByText(/set-\d/)?.closest('s')).not.toBeInTheDocument()
      expect(screen.queryByText(/set-\d/)?.closest('strong')).not.toBeInTheDocument()
      expect(screen.getByText('set-1, set-2, set-3')).toBeInTheDocument()
    })

    it('shows diff when cluster sets change from multiple to single', () => {
      render(
        <ReviewStepContent
          formData={createFormData({
            scopeType: 'Select cluster sets',
            selectedClusterSets: [{ metadata: { name: 'new-set' } }] as ManagedClusterSet[],
          })}
          preselected={{ clusterSetNames: ['old-set-1', 'old-set-2', 'old-set-3'] }}
          isEditing={true}
        />
      )

      expect(screen.getByText('old-set-1, old-set-2, old-set-3').closest('s')).toBeInTheDocument()
      expect(screen.getByText('new-set')).toBeInTheDocument()
    })

    it('shows diff when cluster sets change from single to multiple', () => {
      render(
        <ReviewStepContent
          formData={createFormData({
            scopeType: 'Select cluster sets',
            selectedClusterSets: [
              { metadata: { name: 'new-set-1' } },
              { metadata: { name: 'new-set-2' } },
              { metadata: { name: 'new-set-3' } },
            ] as ManagedClusterSet[],
          })}
          preselected={{ clusterSetNames: ['old-set'] }}
          isEditing={true}
        />
      )

      expect(screen.getByText('old-set').closest('s')).toBeInTheDocument()
      expect(screen.getByText('new-set-1, new-set-2, new-set-3')).toBeInTheDocument()
    })

    it('shows diff when cluster sets change from None to selected', () => {
      render(
        <ReviewStepContent
          formData={createFormData({
            scopeType: 'Select cluster sets',
            selectedClusterSets: [{ metadata: { name: 'new-set' } }] as ManagedClusterSet[],
          })}
          preselected={{ clusterSetNames: [] }}
          isEditing={true}
        />
      )

      expect(screen.getByText('None selected').closest('s')).toBeInTheDocument()
      expect(screen.getByText('new-set')).toBeInTheDocument()
    })

    it('shows diff when cluster sets change from selected to None', () => {
      render(
        <ReviewStepContent
          formData={createFormData({
            scopeType: 'Select cluster sets',
            selectedClusterSets: [],
          })}
          preselected={{ clusterSetNames: ['old-set'] }}
          isEditing={true}
        />
      )

      expect(screen.getByText('old-set').closest('s')).toBeInTheDocument()
    })

    it('handles mixed preselected cluster sets and new cluster names (different scope types)', () => {
      render(
        <ReviewStepContent
          formData={createFormData({
            scopeType: 'Select clusters',
            selectedClusters: [{ metadata: { name: 'new-cluster' } }],
          })}
          preselected={{ clusterSetNames: ['old-set'] }}
          isEditing={true}
        />
      )

      expect(screen.queryByText('old-set')).not.toBeInTheDocument()
    })
  })
})
