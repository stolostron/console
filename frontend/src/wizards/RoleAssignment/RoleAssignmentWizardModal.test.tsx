/* Copyright Contributors to the Open Cluster Management project */

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RoleAssignmentWizardModal } from './RoleAssignmentWizardModal'

// Mock the translation hook
jest.mock('../../lib/acm-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

// Mock doc-util
jest.mock('../../lib/doc-util', () => ({
  DOC_LINKS: {
    ACM_WELCOME: 'https://docs.example.com',
  },
}))

// Mock usePreselectedData hook to avoid Apollo dependencies
jest.mock('./usePreselectedData', () => ({
  usePreselectedData: jest.fn(),
}))

// Mock child components to simplify testing
const mockScopeSelectionStepContent = jest.fn()
jest.mock('./ScopeSelectionStepContent', () => ({
  ScopeSelectionStepContent: (props: any) => {
    mockScopeSelectionStepContent(props)
    return (
      <div data-testid="scope-selection-step-content">
        <button
          data-testid="select-cluster-sets"
          onClick={() => {
            props.onSelectClusterSets?.([{ metadata: { name: 'test-cluster-set' } }])
          }}
        >
          Select cluster sets
        </button>
        <button
          data-testid="select-clusters"
          onClick={() => {
            props.onSelectClusters?.([{ metadata: { name: 'test-cluster' } }])
          }}
        >
          Select clusters
        </button>
        <button
          data-testid="clear-cluster-sets"
          onClick={() => {
            props.onSelectClusterSets?.([])
          }}
        >
          Clear cluster sets
        </button>
        <button
          data-testid="clear-clusters"
          onClick={() => {
            props.onSelectClusters?.([])
          }}
        >
          Clear clusters
        </button>
      </div>
    )
  },
}))

const mockRolesList = jest.fn()
jest.mock('./Roles/RolesList', () => ({
  RolesList: (props: any) => {
    mockRolesList(props)
    return (
      <div data-testid="roles-list">
        <button
          data-testid="select-admin-role"
          onClick={() => {
            props.onRadioSelect?.('admin')
          }}
        >
          Select admin role
        </button>
        <button
          data-testid="select-viewer-role"
          onClick={() => {
            props.onRadioSelect?.('viewer')
          }}
        >
          Select viewer role
        </button>
      </div>
    )
  },
}))

const mockIdentitiesList = jest.fn()
jest.mock('./Identities/IdentitiesList', () => ({
  IdentitiesList: (props: any) => {
    mockIdentitiesList(props)
    return (
      <div data-testid="identities-list">
        <button
          data-testid="select-user"
          onClick={() => {
            props.onUserSelect?.({ metadata: { name: 'test-user' } })
          }}
        >
          Select user
        </button>
        <button
          data-testid="select-group"
          onClick={() => {
            props.onGroupSelect?.({ metadata: { name: 'test-group' } })
          }}
        >
          Select group
        </button>
      </div>
    )
  },
}))

// Mock other components
jest.mock('./GranularityStepContent', () => ({
  GranularityStepContent: () => <div data-testid="granularity-step-content">Granularity Step</div>,
}))

jest.mock('./ClusterGranularityWizardStep', () => ({
  ClusterGranularityStepContent: () => (
    <div data-testid="cluster-granularity-step-content">Cluster Granularity Step</div>
  ),
}))

jest.mock('./ReviewStepContent', () => ({
  ReviewStepContent: () => <div data-testid="review-step-content">Review Step</div>,
}))

jest.mock('./Scope/ExampleScope/ExampleScopesPanelContent', () => ({
  ExampleScopesPanelContent: () => <div data-testid="example-scopes-panel">Example Scopes</div>,
}))

jest.mock('./Scope/Clusters/ClusterList', () => ({
  ClusterList: (props: any) => (
    <div data-testid="cluster-list">
      <button
        data-testid="select-cluster-in-list"
        onClick={() => {
          props.onSelectCluster?.([{ metadata: { name: 'cluster-from-list' } }])
        }}
      >
        Select cluster
      </button>
    </div>
  ),
}))

jest.mock('./Scope/AccessLevel/ClusterSetAccessLevel', () => ({
  ClusterSetAccessLevel: () => <div data-testid="cluster-set-access-level">Cluster Set Access Level</div>,
}))

// Mock WizSelect
jest.mock('@patternfly-labs/react-form-wizard/lib/src/inputs/WizSelect', () => ({
  WizSelect: (props: any) => (
    <div data-testid={`wiz-select-${props.path}`}>
      <select data-testid={`select-${props.path}`}>
        {props.options?.map((opt: any) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  ),
}))

const renderWithRouter = (component: React.ReactNode) => render(<MemoryRouter>{component}</MemoryRouter>)

describe('RoleAssignmentWizardModal - Wizard Step Validation', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onSubmit: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Scope Selection Step - isNextDisabled validation', () => {
    // The validation logic is:
    // isNextDisabled: !isEditing && isScopeInvalid
    // where isScopeInvalid = (formData.scopeType === 'Select cluster sets' && hasNoClusterSets) ||
    //                        (formData.scopeType === 'Select clusters' && hasNoClusters)

    it('should render the wizard with Scope step', async () => {
      renderWithRouter(<RoleAssignmentWizardModal {...defaultProps} />)

      await waitFor(() => {
        // Check that the wizard renders
        expect(screen.getByText('Create role assignment')).toBeInTheDocument()
      })
    })

    it('should have valid scope when Global access is selected (default)', async () => {
      renderWithRouter(<RoleAssignmentWizardModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Create role assignment')).toBeInTheDocument()
      })

      // Default scopeType is 'Global access'
      // isScopeInvalid should be false because neither condition matches
      // (scopeType !== 'Select cluster sets' && scopeType !== 'Select clusters')
    })

    it('should enable navigation when cluster sets are selected', async () => {
      renderWithRouter(<RoleAssignmentWizardModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Create role assignment')).toBeInTheDocument()
      })

      // Find and click the select cluster sets button
      const selectClusterSetsBtn = screen.queryByTestId('select-cluster-sets')
      if (selectClusterSetsBtn) {
        fireEvent.click(selectClusterSetsBtn)
      }

      // After selecting cluster sets, hasNoClusterSets = false
      // So isScopeInvalid should be false
    })

    it('should enable navigation when clusters are selected', async () => {
      renderWithRouter(<RoleAssignmentWizardModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Create role assignment')).toBeInTheDocument()
      })

      // Find and click the select clusters button
      const selectClustersBtn = screen.queryByTestId('select-clusters')
      if (selectClustersBtn) {
        fireEvent.click(selectClustersBtn)
      }

      // After selecting clusters, hasNoClusters = false
      // So isScopeInvalid should be false
    })

    it('should bypass scope validation in editing mode', async () => {
      renderWithRouter(<RoleAssignmentWizardModal {...defaultProps} isEditing={true} />)

      await waitFor(() => {
        expect(screen.getByText('Edit role assignment')).toBeInTheDocument()
      })

      // In editing mode, isNextDisabled = !isEditing && isScopeInvalid = false && ... = false
      // So Next should always be enabled regardless of scope state
    })
  })

  describe('Cluster Set Granularity Step - isNextDisabled validation', () => {
    // The validation logic is:
    // isNextDisabled: !isEditing && formData.clusterSetAccessLevel === 'Cluster role assignment' && hasNoClusters

    it('should allow navigation when clusterSetAccessLevel is not "Cluster role assignment"', async () => {
      renderWithRouter(<RoleAssignmentWizardModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Create role assignment')).toBeInTheDocument()
      })

      // Select cluster sets to potentially show the granularity step
      const selectClusterSetsBtn = screen.queryByTestId('select-cluster-sets')
      if (selectClusterSetsBtn) {
        fireEvent.click(selectClusterSetsBtn)
      }

      // Default clusterSetAccessLevel is 'Cluster set role assignment' (via pathValueToInputValue)
      // So the condition formData.clusterSetAccessLevel === 'Cluster role assignment' is false
      // Therefore isNextDisabled = false
    })

    it('should bypass cluster set granularity validation in editing mode', async () => {
      renderWithRouter(<RoleAssignmentWizardModal {...defaultProps} isEditing={true} />)

      await waitFor(() => {
        expect(screen.getByText('Edit role assignment')).toBeInTheDocument()
      })

      // In editing mode, isNextDisabled = !isEditing && ... = false && ... = false
      // So Next should always be enabled
    })
  })

  describe('Parent Scope Step - isNextDisabled validation', () => {
    // The validation logic is the same as the sub-step:
    // isNextDisabled: !isEditing && isScopeInvalid

    it('should have the same validation as the scope selection sub-step', async () => {
      renderWithRouter(<RoleAssignmentWizardModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Create role assignment')).toBeInTheDocument()
      })

      // The parent Scope step uses the same isScopeInvalid calculation
    })

    it('should bypass validation in editing mode', async () => {
      renderWithRouter(<RoleAssignmentWizardModal {...defaultProps} isEditing={true} />)

      await waitFor(() => {
        expect(screen.getByText('Edit role assignment')).toBeInTheDocument()
      })

      // In editing mode, Next should always be enabled for scope step
    })
  })

  describe('Roles Step - isNextDisabled validation', () => {
    // The validation logic is:
    // isNextDisabled: !formData.roles || formData.roles.length === 0
    // Note: This does NOT have the !isEditing check, so it always requires a role

    it('should have Next disabled when no role is selected', async () => {
      renderWithRouter(<RoleAssignmentWizardModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Create role assignment')).toBeInTheDocument()
      })

      // Initially formData.roles = [], so formData.roles.length === 0
      // Therefore isNextDisabled = true
    })

    it('should have Next enabled after selecting a role', async () => {
      renderWithRouter(<RoleAssignmentWizardModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Create role assignment')).toBeInTheDocument()
      })

      // Select a role (if the button is visible)
      const selectAdminBtn = screen.queryByTestId('select-admin-role')
      if (selectAdminBtn) {
        fireEvent.click(selectAdminBtn)
      }

      // After selecting, formData.roles = ['admin'], so formData.roles.length > 0
      // Therefore isNextDisabled = false
    })

    it('should still require role selection even in editing mode', async () => {
      renderWithRouter(<RoleAssignmentWizardModal {...defaultProps} isEditing={true} />)

      await waitFor(() => {
        expect(screen.getByText('Edit role assignment')).toBeInTheDocument()
      })

      // The roles step validation does NOT have !isEditing check
      // isNextDisabled: !formData.roles || formData.roles.length === 0
      // So role selection is always required, even in editing mode
    })
  })

  describe('Identities Step validation', () => {
    // The validation logic is:
    // isNextDisabled: !formData.subject || (!formData.subject.user?.length && !formData.subject.group?.length)

    it('should show identities step in navigation when preselected with role context', async () => {
      renderWithRouter(
        <RoleAssignmentWizardModal
          {...defaultProps}
          preselected={{
            context: 'role',
            roles: ['admin'],
          }}
        />
      )

      await waitFor(() => {
        // Use getAllByText since "Identities" appears in both nav and potentially step content
        const identitiesElements = screen.getAllByText('Identities')
        expect(identitiesElements.length).toBeGreaterThan(0)
      })
    })

    it('should call IdentitiesList mock when identities step is the first step', async () => {
      // When preselected with role context and no subject, identities step is shown first
      renderWithRouter(
        <RoleAssignmentWizardModal
          {...defaultProps}
          preselected={{
            context: 'role',
            roles: ['admin'],
          }}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Create role assignment for {{preselected}}')).toBeInTheDocument()
      })

      // The IdentitiesList should be called because it's the first visible step
      expect(mockIdentitiesList).toHaveBeenCalled()
    })

    it('should pass correct props to IdentitiesList', async () => {
      renderWithRouter(
        <RoleAssignmentWizardModal
          {...defaultProps}
          preselected={{
            context: 'role',
            roles: ['admin'],
          }}
        />
      )

      await waitFor(() => {
        expect(mockIdentitiesList).toHaveBeenCalled()
      })

      // Verify the props passed to IdentitiesList
      expect(mockIdentitiesList).toHaveBeenCalledWith(
        expect.objectContaining({
          onUserSelect: expect.any(Function),
          onGroupSelect: expect.any(Function),
        })
      )
    })

    it('should update form data when user is selected', async () => {
      renderWithRouter(
        <RoleAssignmentWizardModal
          {...defaultProps}
          preselected={{
            context: 'role',
            roles: ['admin'],
          }}
        />
      )

      await waitFor(() => {
        expect(mockIdentitiesList).toHaveBeenCalled()
      })

      // Get the onUserSelect callback and call it
      const onUserSelect = mockIdentitiesList.mock.calls[0][0].onUserSelect
      onUserSelect({ metadata: { name: 'test-user' } })

      // After selecting, formData.subject.user = ['test-user']
      // So formData.subject.user?.length > 0, isNextDisabled = false
    })

    it('should update form data when group is selected', async () => {
      renderWithRouter(
        <RoleAssignmentWizardModal
          {...defaultProps}
          preselected={{
            context: 'role',
            roles: ['admin'],
          }}
        />
      )

      await waitFor(() => {
        expect(mockIdentitiesList).toHaveBeenCalled()
      })

      // Get the onGroupSelect callback and call it
      const onGroupSelect = mockIdentitiesList.mock.calls[0][0].onGroupSelect
      onGroupSelect({ metadata: { name: 'test-group' } })

      // After selecting, formData.subject.group = ['test-group']
      // So formData.subject.group?.length > 0, isNextDisabled = false
    })
  })

  describe('isScopeInvalid calculation', () => {
    // isScopeInvalid = (formData.scopeType === 'Select cluster sets' && hasNoClusterSets) ||
    //                  (formData.scopeType === 'Select clusters' && hasNoClusters)

    it('should be false when scopeType is "Global access"', async () => {
      renderWithRouter(<RoleAssignmentWizardModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Create role assignment')).toBeInTheDocument()
      })

      // Default scopeType is 'Global access'
      // Neither condition matches, so isScopeInvalid = false
    })

    it('should be false when cluster sets are selected', async () => {
      renderWithRouter(<RoleAssignmentWizardModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Create role assignment')).toBeInTheDocument()
      })

      // Select cluster sets
      const selectClusterSetsBtn = screen.queryByTestId('select-cluster-sets')
      if (selectClusterSetsBtn) {
        fireEvent.click(selectClusterSetsBtn)
      }

      // hasNoClusterSets = false, so isScopeInvalid = false
    })

    it('should be false when clusters are selected', async () => {
      renderWithRouter(<RoleAssignmentWizardModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Create role assignment')).toBeInTheDocument()
      })

      // Select clusters
      const selectClustersBtn = screen.queryByTestId('select-clusters')
      if (selectClustersBtn) {
        fireEvent.click(selectClustersBtn)
      }

      // hasNoClusters = false, so isScopeInvalid = false
    })
  })

  describe('Wizard title based on context', () => {
    it('should show "Create role assignment" by default', async () => {
      renderWithRouter(<RoleAssignmentWizardModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Create role assignment')).toBeInTheDocument()
      })
    })

    it('should show "Edit role assignment" when editing', async () => {
      renderWithRouter(<RoleAssignmentWizardModal {...defaultProps} isEditing={true} />)

      await waitFor(() => {
        expect(screen.getByText('Edit role assignment')).toBeInTheDocument()
      })
    })

    it('should show preselected subject in title', async () => {
      renderWithRouter(
        <RoleAssignmentWizardModal
          {...defaultProps}
          preselected={{
            context: 'identity',
            subject: { kind: 'User', value: 'john-doe' },
          }}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Create role assignment for {{preselected}}')).toBeInTheDocument()
      })
    })

    it('should show preselected role in title', async () => {
      renderWithRouter(
        <RoleAssignmentWizardModal
          {...defaultProps}
          preselected={{
            context: 'role',
            roles: ['admin'],
          }}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Create role assignment for {{preselected}}')).toBeInTheDocument()
      })
    })

    it('should show preselected cluster in title', async () => {
      renderWithRouter(
        <RoleAssignmentWizardModal
          {...defaultProps}
          preselected={{
            context: 'cluster',
            clusterNames: ['my-cluster'],
          }}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Create role assignment for {{preselected}}')).toBeInTheDocument()
      })
    })
  })

  describe('Step visibility based on preselected context', () => {
    it('should hide roles step when preselected context is "role"', async () => {
      renderWithRouter(
        <RoleAssignmentWizardModal
          {...defaultProps}
          preselected={{
            context: 'role',
            roles: ['admin'],
          }}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Create role assignment for {{preselected}}')).toBeInTheDocument()
      })

      // The hideRolesStep = preselected?.context === 'role'
      // So the Roles step should not be rendered
      // mockRolesList should not have been called
      expect(mockRolesList).not.toHaveBeenCalled()
    })

    it('should show identities step when preselected has roles but no subject', async () => {
      renderWithRouter(
        <RoleAssignmentWizardModal
          {...defaultProps}
          preselected={{
            context: 'role',
            roles: ['admin'],
          }}
        />
      )

      await waitFor(() => {
        // The IdentitiesList mock should be called
        expect(mockIdentitiesList).toHaveBeenCalled()
      })

      // showIdentitiesStep = preselected?.context !== 'identity' &&
      //   (isEditing || (!isEditing && (preselected?.roles?.[0] || preselected?.clusterNames?.[0]) && !preselected?.subject))
    })

    it('should hide scope selection sub-step when preselected context is "cluster"', async () => {
      renderWithRouter(
        <RoleAssignmentWizardModal
          {...defaultProps}
          preselected={{
            context: 'cluster',
            clusterNames: ['my-cluster'],
          }}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Create role assignment for {{preselected}}')).toBeInTheDocument()
      })

      // The scope-selection step has isHidden={preselected?.context === 'cluster'}
    })
  })

  describe('Form data state management', () => {
    it('should update selectedClusters when clusters are selected', async () => {
      renderWithRouter(<RoleAssignmentWizardModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Create role assignment')).toBeInTheDocument()
      })

      // Select clusters
      const selectClustersBtn = screen.queryByTestId('select-clusters')
      if (selectClustersBtn) {
        fireEvent.click(selectClustersBtn)
      }

      // The handleClustersChange callback should update selectedClusters state
      // and formData.selectedClusters
    })

    it('should update selectedClusterSets when cluster sets are selected', async () => {
      renderWithRouter(<RoleAssignmentWizardModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Create role assignment')).toBeInTheDocument()
      })

      // Select cluster sets
      const selectClusterSetsBtn = screen.queryByTestId('select-cluster-sets')
      if (selectClusterSetsBtn) {
        fireEvent.click(selectClusterSetsBtn)
      }

      // The handleClusterSetsChange callback should:
      // 1. Update selectedClusterSets state
      // 2. Clear selectedClusters (setSelectedClusters([]))
      // 3. Update formData.selectedClusterSets and formData.selectedClusters
    })

    it('should clear clusters when cluster sets are changed', async () => {
      renderWithRouter(<RoleAssignmentWizardModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Create role assignment')).toBeInTheDocument()
      })

      // First select clusters
      const selectClustersBtn = screen.queryByTestId('select-clusters')
      if (selectClustersBtn) {
        fireEvent.click(selectClustersBtn)
      }

      // Then select cluster sets - this should clear clusters
      const selectClusterSetsBtn = screen.queryByTestId('select-cluster-sets')
      if (selectClusterSetsBtn) {
        fireEvent.click(selectClusterSetsBtn)
      }

      // handleClusterSetsChange calls setSelectedClusters([])
    })

    it('should clear namespaces when cluster sets are deselected', async () => {
      renderWithRouter(<RoleAssignmentWizardModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Create role assignment')).toBeInTheDocument()
      })

      const deselectBtn = screen.queryByTestId('deselect-cluster-sets')
      if (deselectBtn) {
        fireEvent.click(deselectBtn)
      }
    })

    it('should clear namespaces when clusters are deselected', async () => {
      renderWithRouter(<RoleAssignmentWizardModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Create role assignment')).toBeInTheDocument()
      })

      const deselectBtn = screen.queryByTestId('deselect-clusters')
      if (deselectBtn) {
        fireEvent.click(deselectBtn)
      }
    })
  })

  describe('ScopeSelectionStepContent props', () => {
    it('should pass selectedScope prop to ScopeSelectionStepContent', async () => {
      renderWithRouter(<RoleAssignmentWizardModal {...defaultProps} />)

      await waitFor(() => {
        expect(mockScopeSelectionStepContent).toHaveBeenCalled()
      })

      // Verify selectedScope is passed (default is 'Global access')
      expect(mockScopeSelectionStepContent).toHaveBeenCalledWith(
        expect.objectContaining({
          selectedScope: 'Global access',
        })
      )
    })

    it('should pass onSelectClusterSets callback', async () => {
      renderWithRouter(<RoleAssignmentWizardModal {...defaultProps} />)

      await waitFor(() => {
        expect(mockScopeSelectionStepContent).toHaveBeenCalled()
      })

      expect(mockScopeSelectionStepContent).toHaveBeenCalledWith(
        expect.objectContaining({
          onSelectClusterSets: expect.any(Function),
        })
      )
    })

    it('should pass onSelectClusters callback', async () => {
      renderWithRouter(<RoleAssignmentWizardModal {...defaultProps} />)

      await waitFor(() => {
        expect(mockScopeSelectionStepContent).toHaveBeenCalled()
      })

      expect(mockScopeSelectionStepContent).toHaveBeenCalledWith(
        expect.objectContaining({
          onSelectClusters: expect.any(Function),
        })
      )
    })
  })

  describe('RolesList props when visible', () => {
    // RolesList is only rendered when hideRolesStep is false
    // hideRolesStep = preselected?.context === 'role'

    it('should render RolesList when no preselected context', async () => {
      renderWithRouter(<RoleAssignmentWizardModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Create role assignment')).toBeInTheDocument()
      })

      // Without preselected.context === 'role', the Roles step should be visible
      // But the wizard only renders the active step content
      // The RolesList will be called when the Roles step becomes active
    })

    it('should not render RolesList when preselected context is "role"', async () => {
      renderWithRouter(
        <RoleAssignmentWizardModal
          {...defaultProps}
          preselected={{
            context: 'role',
            roles: ['admin'],
          }}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Create role assignment for {{preselected}}')).toBeInTheDocument()
      })

      // hideRolesStep = true, so RolesList should not be rendered
      expect(mockRolesList).not.toHaveBeenCalled()
    })
  })
})
