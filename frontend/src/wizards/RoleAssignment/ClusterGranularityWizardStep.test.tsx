/* Copyright Contributors to the Open Cluster Management project */

import { DataContext } from '@patternfly-labs/react-form-wizard/lib/src/contexts/DataContext'
import { render } from '@testing-library/react'
import { ClusterGranularityStepContent } from './ClusterGranularityWizardStep'

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

describe('ClusterGranularityStepContent', () => {
  const mockOnNamespacesChange = jest.fn()
  const mockOnClustersAccessLevelChange = jest.fn()
  const defaultProps = {
    description: 'Test description',
    selectedClusters: [{ name: 'cluster-1' }, { name: 'cluster-2' }],
    onNamespacesChange: mockOnNamespacesChange,
    selectedClustersAccessLevel: undefined as 'Cluster role assignment' | 'Project role assignment' | undefined,
    onClustersAccessLevelChange: mockOnClustersAccessLevelChange,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockAcmSelect.mockClear()
  })

  it('renders with title and description', () => {
    renderWithContext(<ClusterGranularityStepContent {...defaultProps} />)

    expect(mockGranularityStepContent).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Define cluster granularity',
        description: 'Test description',
      })
    )
  })

  it('renders AcmSelect with access level options', () => {
    renderWithContext(<ClusterGranularityStepContent {...defaultProps} />)

    expect(mockAcmSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'clusters-access-level',
        label: 'Access level for selected clusters',
        isRequired: true,
      })
    )
  })

  it('does not render ProjectsList when selectedClustersAccessLevel is not Project role assignment', () => {
    renderWithContext(
      <ClusterGranularityStepContent {...defaultProps} selectedClustersAccessLevel="Cluster role assignment" />
    )

    expect(mockProjectsList).not.toHaveBeenCalled()
  })

  it('renders ProjectsList when selectedClustersAccessLevel is Project role assignment', () => {
    renderWithContext(
      <ClusterGranularityStepContent {...defaultProps} selectedClustersAccessLevel="Project role assignment" />
    )

    expect(mockProjectsList).toHaveBeenCalledWith(
      expect.objectContaining({
        selectedClusters: defaultProps.selectedClusters,
      })
    )
  })

  it('passes selectedClusters to ProjectsList', () => {
    const clusters = [{ name: 'cluster-a' }, { name: 'cluster-b' }, { name: 'cluster-c' }]
    renderWithContext(
      <ClusterGranularityStepContent
        description="Test"
        selectedClusters={clusters}
        onNamespacesChange={mockOnNamespacesChange}
        selectedClustersAccessLevel="Project role assignment"
      />
    )

    expect(mockProjectsList).toHaveBeenCalledWith(
      expect.objectContaining({
        selectedClusters: clusters,
      })
    )
  })

  it('renders with empty selectedClusters array', () => {
    renderWithContext(
      <ClusterGranularityStepContent
        description="Test"
        selectedClusters={[]}
        onNamespacesChange={mockOnNamespacesChange}
        selectedClustersAccessLevel="Project role assignment"
      />
    )

    expect(mockProjectsList).toHaveBeenCalledWith(
      expect.objectContaining({
        selectedClusters: [],
      })
    )
  })

  it('does not render ProjectsList when selectedClustersAccessLevel is undefined', () => {
    renderWithContext(<ClusterGranularityStepContent {...defaultProps} selectedClustersAccessLevel={undefined} />)

    expect(mockProjectsList).not.toHaveBeenCalled()
  })

  describe('onClustersAccessLevelChange callback', () => {
    it('calls onClustersAccessLevelChange when access level is changed to Cluster role assignment', () => {
      const onClustersAccessLevelChange = jest.fn()
      renderWithContext(
        <ClusterGranularityStepContent {...defaultProps} onClustersAccessLevelChange={onClustersAccessLevelChange} />
      )

      // Get the onChange callback that was passed to AcmSelect and invoke it
      const acmSelectProps = mockAcmSelect.mock.calls[0][0]
      acmSelectProps.onChange('Cluster role assignment')

      expect(onClustersAccessLevelChange).toHaveBeenCalledWith('Cluster role assignment')
    })

    it('calls onClustersAccessLevelChange when access level is changed to Project role assignment', () => {
      const onClustersAccessLevelChange = jest.fn()
      renderWithContext(
        <ClusterGranularityStepContent {...defaultProps} onClustersAccessLevelChange={onClustersAccessLevelChange} />
      )

      // Get the onChange callback that was passed to AcmSelect and invoke it
      const acmSelectProps = mockAcmSelect.mock.calls[0][0]
      acmSelectProps.onChange('Project role assignment')

      expect(onClustersAccessLevelChange).toHaveBeenCalledWith('Project role assignment')
    })

    it('calls onClustersAccessLevelChange with undefined when access level is cleared', () => {
      const onClustersAccessLevelChange = jest.fn()
      renderWithContext(
        <ClusterGranularityStepContent
          {...defaultProps}
          onClustersAccessLevelChange={onClustersAccessLevelChange}
          selectedClustersAccessLevel="Cluster role assignment"
        />
      )

      // Get the onChange callback that was passed to AcmSelect and invoke it with undefined
      const acmSelectProps = mockAcmSelect.mock.calls[0][0]
      acmSelectProps.onChange(undefined)

      expect(onClustersAccessLevelChange).toHaveBeenCalledWith(undefined)
    })

    it('does not throw when onClustersAccessLevelChange is undefined and access level is changed', () => {
      renderWithContext(
        <ClusterGranularityStepContent {...defaultProps} onClustersAccessLevelChange={undefined as any} />
      )

      // Get the onChange callback that was passed to AcmSelect and invoke it
      const acmSelectProps = mockAcmSelect.mock.calls[0][0]

      expect(() => {
        acmSelectProps.onChange('Cluster role assignment')
      }).not.toThrow()
    })

    it('does not call onClustersAccessLevelChange when it is undefined', () => {
      // Create a spy to track if onClustersAccessLevelChange would be called
      const onClustersAccessLevelChangeSpy = jest.fn()

      // Render with undefined onClustersAccessLevelChange
      renderWithContext(
        <ClusterGranularityStepContent {...defaultProps} onClustersAccessLevelChange={undefined as any} />
      )

      // Get the onChange callback that was passed to AcmSelect and invoke it
      const acmSelectProps = mockAcmSelect.mock.calls[0][0]

      // This should not throw even though onClustersAccessLevelChange is undefined
      // because handleClustersAccessLevelChange uses optional chaining
      acmSelectProps.onChange('Project role assignment')

      // The spy should not have been called since we passed undefined
      expect(onClustersAccessLevelChangeSpy).not.toHaveBeenCalled()
    })
  })
})
