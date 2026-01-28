/* Copyright Contributors to the Open Cluster Management project */

import { DataContext } from '@patternfly-labs/react-form-wizard/lib/src/contexts/DataContext'
import { render, screen } from '@testing-library/react'
import { ClusterSetGranularityWizardStep } from './ClusterSetGranularityWizardStep'

// Mock the translation hook
jest.mock('../../lib/acm-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

// Track mock calls
const mockGranularityStepContent = jest.fn()
const mockProjectsList = jest.fn()
const mockAcmSelect = jest.fn()

// Mock GranularityStepContent
jest.mock('./GranularityStepContent', () => ({
  GranularityStepContent: (props: any) => {
    mockGranularityStepContent(props)
    return (
      <div data-testid="granularity-step-content">
        <h2>{props.title}</h2>
        <p>{props.description}</p>
      </div>
    )
  },
}))

// Mock ProjectsList
jest.mock('./ProjectsList', () => ({
  ProjectsList: (props: any) => {
    mockProjectsList(props)
    return <div data-testid="projects-list">Projects List - Clusters: {props.selectedClusters?.length || 0}</div>
  },
}))

// Mock ui-components - simplified mock that captures props for testing
jest.mock('../../ui-components', () => ({
  AcmSelect: (props: any) => {
    mockAcmSelect(props)
    return <div data-testid="acm-select">{props.children}</div>
  },
}))

const renderWithContext = (component: React.ReactNode, updateFn: () => void = jest.fn()) => {
  return render(<DataContext.Provider value={{ update: updateFn }}>{component}</DataContext.Provider>)
}

describe('ClusterSetGranularityWizardStep', () => {
  const mockOnNamespacesChange = jest.fn()
  const mockOnClustersetsAccessLevelChange = jest.fn()
  const mockClustersFromClusterSets = [{ name: 'cluster-1' }, { name: 'cluster-2' }]
  const defaultProps = {
    selectedClustersets: ['cluster-set-1'],
    clustersFromClusterSets: mockClustersFromClusterSets,
    onNamespacesChange: mockOnNamespacesChange,
    clustersetsAccessLevel: undefined as 'Cluster set role assignment' | 'Project role assignment' | undefined,
    onClustersetsAccessLevelChange: mockOnClustersetsAccessLevelChange,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockAcmSelect.mockClear()
  })

  it('renders with title and description for multiple cluster sets', () => {
    renderWithContext(
      <ClusterSetGranularityWizardStep {...defaultProps} selectedClustersets={['cluster-set-1', 'cluster-set-2']} />
    )

    expect(mockGranularityStepContent).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Define cluster set granularity',
        description: 'Define the level of access for the selected cluster sets.',
      })
    )
  })

  it('renders with title and description for single cluster set', () => {
    renderWithContext(<ClusterSetGranularityWizardStep {...defaultProps} />)

    expect(mockGranularityStepContent).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Define cluster set granularity',
        description: 'Define the level of access for the selected cluster set.',
      })
    )
  })

  it('renders AcmSelect with access level options', () => {
    renderWithContext(<ClusterSetGranularityWizardStep {...defaultProps} />)

    expect(mockAcmSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'clusters-set-access-level',
        label: 'Access level for selected cluster sets',
        isRequired: true,
      })
    )
  })

  it('does not render ProjectsList when clustersetsAccessLevel is not Project role assignment', () => {
    renderWithContext(
      <ClusterSetGranularityWizardStep {...defaultProps} clustersetsAccessLevel="Cluster set role assignment" />
    )

    expect(mockProjectsList).not.toHaveBeenCalled()
  })

  it('renders ProjectsList when clustersetsAccessLevel is Project role assignment', () => {
    renderWithContext(
      <ClusterSetGranularityWizardStep {...defaultProps} clustersetsAccessLevel="Project role assignment" />
    )

    expect(mockProjectsList).toHaveBeenCalledWith(
      expect.objectContaining({
        selectedClusters: defaultProps.clustersFromClusterSets,
      })
    )
  })

  it('passes clustersFromClusterSets to ProjectsList', () => {
    const clusters = [{ name: 'cluster-a' }, { name: 'cluster-b' }, { name: 'cluster-c' }]

    renderWithContext(
      <ClusterSetGranularityWizardStep
        {...defaultProps}
        clustersFromClusterSets={clusters}
        clustersetsAccessLevel="Project role assignment"
      />
    )

    expect(mockProjectsList).toHaveBeenCalledWith(
      expect.objectContaining({
        selectedClusters: clusters,
      })
    )
  })

  it('renders with empty clustersFromClusterSets array', () => {
    renderWithContext(
      <ClusterSetGranularityWizardStep
        {...defaultProps}
        clustersFromClusterSets={[]}
        clustersetsAccessLevel="Project role assignment"
      />
    )

    expect(mockProjectsList).toHaveBeenCalledWith(
      expect.objectContaining({
        selectedClusters: [],
      })
    )
  })

  it('does not render ProjectsList when clustersetsAccessLevel is undefined', () => {
    renderWithContext(<ClusterSetGranularityWizardStep {...defaultProps} clustersetsAccessLevel={undefined} />)

    expect(mockProjectsList).not.toHaveBeenCalled()
  })

  describe('when selectedClustersets.length > 1', () => {
    it('renders plural description and Alert message for multiple cluster sets with Cluster set role assignment', () => {
      const multipleClusterSets = ['cluster-set-1', 'cluster-set-2', 'cluster-set-3']

      renderWithContext(
        <ClusterSetGranularityWizardStep
          {...defaultProps}
          selectedClustersets={multipleClusterSets}
          clustersetsAccessLevel="Cluster set role assignment"
        />
      )

      // Verify plural description is used
      expect(mockGranularityStepContent).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Define cluster set granularity',
          description: 'Define the level of access for the selected cluster sets.',
        })
      )

      // Verify plural Alert message is rendered
      const alert = screen.getByText(
        'This role assignment will apply to all current and future resources on the selected cluster sets.'
      )
      expect(alert).toBeInTheDocument()
    })

    it('renders plural description for multiple cluster sets with Project role assignment', () => {
      const multipleClusterSets = ['cluster-set-1', 'cluster-set-2']

      renderWithContext(
        <ClusterSetGranularityWizardStep
          {...defaultProps}
          selectedClustersets={multipleClusterSets}
          clustersetsAccessLevel="Project role assignment"
        />
      )

      // Verify plural description is used
      expect(mockGranularityStepContent).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Define cluster set granularity',
          description: 'Define the level of access for the selected cluster sets.',
        })
      )

      // Verify ProjectsList is rendered instead of Alert
      expect(mockProjectsList).toHaveBeenCalled()
    })
  })

  describe('when selectedClustersets.length === 1', () => {
    it('renders singular description and Alert message for single cluster set with Cluster set role assignment', () => {
      renderWithContext(
        <ClusterSetGranularityWizardStep
          {...defaultProps}
          selectedClustersets={['cluster-set-1']}
          clustersetsAccessLevel="Cluster set role assignment"
        />
      )

      // Verify singular description is used
      expect(mockGranularityStepContent).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Define cluster set granularity',
          description: 'Define the level of access for the selected cluster set.',
        })
      )

      // Verify singular Alert message is rendered
      const alert = screen.getByText(
        'This role assignment will apply to all current and future resources on the selected cluster set.'
      )
      expect(alert).toBeInTheDocument()
    })
  })

  describe('onClustersetsAccessLevelChange callback', () => {
    it('calls onClustersetsAccessLevelChange when access level is changed to Cluster set role assignment', () => {
      const onClustersetsAccessLevelChange = jest.fn()
      renderWithContext(
        <ClusterSetGranularityWizardStep
          {...defaultProps}
          onClustersetsAccessLevelChange={onClustersetsAccessLevelChange}
        />
      )

      // Get the onChange callback that was passed to AcmSelect and invoke it
      const acmSelectProps = mockAcmSelect.mock.calls[0][0]
      acmSelectProps.onChange('Cluster set role assignment')

      expect(onClustersetsAccessLevelChange).toHaveBeenCalledWith('Cluster set role assignment')
    })

    it('calls onClustersetsAccessLevelChange when access level is changed to Project role assignment', () => {
      const onClustersetsAccessLevelChange = jest.fn()
      renderWithContext(
        <ClusterSetGranularityWizardStep
          {...defaultProps}
          onClustersetsAccessLevelChange={onClustersetsAccessLevelChange}
        />
      )

      // Get the onChange callback that was passed to AcmSelect and invoke it
      const acmSelectProps = mockAcmSelect.mock.calls[0][0]
      acmSelectProps.onChange('Project role assignment')

      expect(onClustersetsAccessLevelChange).toHaveBeenCalledWith('Project role assignment')
    })

    it('calls onClustersetsAccessLevelChange with undefined when access level is cleared', () => {
      const onClustersetsAccessLevelChange = jest.fn()
      renderWithContext(
        <ClusterSetGranularityWizardStep
          {...defaultProps}
          onClustersetsAccessLevelChange={onClustersetsAccessLevelChange}
          clustersetsAccessLevel="Cluster set role assignment"
        />
      )

      // Get the onChange callback that was passed to AcmSelect and invoke it with undefined
      const acmSelectProps = mockAcmSelect.mock.calls[0][0]
      acmSelectProps.onChange(undefined)

      expect(onClustersetsAccessLevelChange).toHaveBeenCalledWith(undefined)
    })

    it('does not throw when onClustersetsAccessLevelChange is undefined and access level is changed', () => {
      renderWithContext(
        <ClusterSetGranularityWizardStep {...defaultProps} onClustersetsAccessLevelChange={undefined as any} />
      )

      // Get the onChange callback that was passed to AcmSelect and invoke it
      const acmSelectProps = mockAcmSelect.mock.calls[0][0]

      expect(() => {
        acmSelectProps.onChange('Cluster set role assignment')
      }).not.toThrow()
    })

    it('does not call onClustersetsAccessLevelChange when it is undefined', () => {
      // Create a spy to track if onClustersetsAccessLevelChange would be called
      const onClustersetsAccessLevelChangeSpy = jest.fn()

      // Render with undefined onClustersetsAccessLevelChange
      renderWithContext(
        <ClusterSetGranularityWizardStep {...defaultProps} onClustersetsAccessLevelChange={undefined as any} />
      )

      // Get the onChange callback that was passed to AcmSelect and invoke it
      const acmSelectProps = mockAcmSelect.mock.calls[0][0]

      // This should not throw even though onClustersetsAccessLevelChange is undefined
      // because handleClustersetsAccessLevelChange uses optional chaining
      acmSelectProps.onChange('Project role assignment')

      // The spy should not have been called since we passed undefined
      expect(onClustersetsAccessLevelChangeSpy).not.toHaveBeenCalled()
    })
  })

  describe('AcmSelect options', () => {
    it('renders Cluster set role assignment option with correct description', () => {
      renderWithContext(<ClusterSetGranularityWizardStep {...defaultProps} />)

      const acmSelectProps = mockAcmSelect.mock.calls[0][0]
      const options = acmSelectProps.children

      expect(options).toHaveLength(2)
      expect(options[0].props.value).toBe('Cluster set role assignment')
      expect(options[0].props.description).toBe(
        'Grant access to all current and future resources on the selected cluster sets.'
      )
      expect(options[0].props.children).toBe('Cluster set role assignment')
    })

    it('renders Project role assignment option with correct description', () => {
      renderWithContext(<ClusterSetGranularityWizardStep {...defaultProps} />)

      const acmSelectProps = mockAcmSelect.mock.calls[0][0]
      const options = acmSelectProps.children

      expect(options).toHaveLength(2)
      expect(options[1].props.value).toBe('Project role assignment')
      expect(options[1].props.description).toBe(
        'Grant access to specific projects on all current and future clusters in the selected sets.'
      )
      expect(options[1].props.children).toBe('Project role assignment')
    })
  })
})
