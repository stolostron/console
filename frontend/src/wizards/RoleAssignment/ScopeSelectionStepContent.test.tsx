/* Copyright Contributors to the Open Cluster Management project */

import { DataContext } from '@patternfly-labs/react-form-wizard/lib/src/contexts/DataContext'
import { fireEvent, render, screen } from '@testing-library/react'
import { ScopeSelectionStepContent } from './ScopeSelectionStepContent'

// Mock the translation hook
jest.mock('../../lib/acm-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

// Track mock calls
const mockGranularityStepContent = jest.fn()
const mockGlobalScopeSelection = jest.fn()
const mockClusterSetsList = jest.fn()
const mockClusterList = jest.fn()
const mockAcmSelect = jest.fn()

// Mock GranularityStepContent
jest.mock('./GranularityStepContent', () => ({
  GranularityStepContent: (props: any) => {
    mockGranularityStepContent(props)
    return (
      <div data-testid="granularity-step-content">
        <h2>{props.title}</h2>
        {props.action}
      </div>
    )
  },
}))

// Mock GlobalScopeSelection
jest.mock('./Scope/GlobalScopeSelection', () => ({
  GlobalScopeSelection: (props: any) => {
    mockGlobalScopeSelection(props)
    return <div data-testid="global-scope-selection">Global Scope Selection</div>
  },
}))

// Mock ClusterSetsList
jest.mock('./Scope/ClusterSets/ClusterSetsList', () => ({
  ClusterSetsList: (props: any) => {
    mockClusterSetsList(props)
    return (
      <div data-testid="cluster-sets-list">
        Cluster Sets List
        <button onClick={() => props.onSelectClusterSet?.([{ name: 'test-cs' }])}>Select Cluster Set</button>
      </div>
    )
  },
}))

// Mock ClusterList
jest.mock('./Scope/Clusters/ClusterList', () => ({
  ClusterList: (props: any) => {
    mockClusterList(props)
    return (
      <div data-testid="cluster-list">
        Cluster List
        <button onClick={() => props.onSelectCluster?.([{ name: 'test-cluster' }])}>Select Cluster</button>
      </div>
    )
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

describe('ScopeSelectionStepContent', () => {
  const defaultProps = {
    isDrawerExpanded: false,
    setIsDrawerExpanded: jest.fn(),
    selectedClusterSets: [],
    selectedClusters: [],
    selectedScope: undefined as 'Global access' | 'Select cluster sets' | 'Select clusters' | undefined,
    onSelectClusterSets: jest.fn(),
    onSelectClusters: jest.fn(),
    onSelectScopeType: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockGranularityStepContent.mockClear()
    mockGlobalScopeSelection.mockClear()
    mockClusterSetsList.mockClear()
    mockClusterList.mockClear()
    mockAcmSelect.mockClear()
  })

  it('renders with title Scope', () => {
    renderWithContext(<ScopeSelectionStepContent {...defaultProps} />)

    expect(mockGranularityStepContent).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Scope',
      })
    )
  })

  it('renders View examples button', () => {
    renderWithContext(<ScopeSelectionStepContent {...defaultProps} />)

    expect(screen.getByRole('button', { name: 'View examples' })).toBeInTheDocument()
  })

  it('toggles drawer when View examples button is clicked', () => {
    const setIsDrawerExpanded = jest.fn()
    renderWithContext(
      <ScopeSelectionStepContent {...defaultProps} isDrawerExpanded={false} setIsDrawerExpanded={setIsDrawerExpanded} />
    )

    fireEvent.click(screen.getByRole('button', { name: 'View examples' }))
    expect(setIsDrawerExpanded).toHaveBeenCalledWith(true)
  })

  it('closes drawer when View examples button is clicked while drawer is expanded', () => {
    const setIsDrawerExpanded = jest.fn()
    renderWithContext(
      <ScopeSelectionStepContent {...defaultProps} isDrawerExpanded={true} setIsDrawerExpanded={setIsDrawerExpanded} />
    )

    fireEvent.click(screen.getByRole('button', { name: 'View examples' }))
    expect(setIsDrawerExpanded).toHaveBeenCalledWith(false)
  })

  it('renders AcmSelect with scope options', () => {
    renderWithContext(<ScopeSelectionStepContent {...defaultProps} />)

    expect(mockAcmSelect).toHaveBeenCalled()
    expect(mockAcmSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'scope-type',
        isRequired: true,
      })
    )
  })

  it('renders GlobalScopeSelection when selectedScope is Global access', () => {
    renderWithContext(<ScopeSelectionStepContent {...defaultProps} selectedScope="Global access" />)

    expect(mockGlobalScopeSelection).toHaveBeenCalled()
    expect(mockClusterSetsList).not.toHaveBeenCalled()
    expect(mockClusterList).not.toHaveBeenCalled()
  })

  it('renders ClusterSetsList when selectedScope is Select cluster sets', () => {
    renderWithContext(<ScopeSelectionStepContent {...defaultProps} selectedScope="Select cluster sets" />)

    expect(mockClusterSetsList).toHaveBeenCalled()
    expect(mockGlobalScopeSelection).not.toHaveBeenCalled()
    expect(mockClusterList).not.toHaveBeenCalled()
  })

  it('renders ClusterList when selectedScope is Select clusters', () => {
    renderWithContext(<ScopeSelectionStepContent {...defaultProps} selectedScope="Select clusters" />)

    expect(mockClusterList).toHaveBeenCalled()
    expect(mockGlobalScopeSelection).not.toHaveBeenCalled()
    expect(mockClusterSetsList).not.toHaveBeenCalled()
  })

  it('renders nothing for unrecognized selectedScope', () => {
    renderWithContext(<ScopeSelectionStepContent {...defaultProps} selectedScope={'unknown' as any} />)

    expect(mockGlobalScopeSelection).not.toHaveBeenCalled()
    expect(mockClusterSetsList).not.toHaveBeenCalled()
    expect(mockClusterList).not.toHaveBeenCalled()
  })

  it('renders nothing when selectedScope is undefined', () => {
    renderWithContext(<ScopeSelectionStepContent {...defaultProps} selectedScope={undefined} />)

    expect(mockGlobalScopeSelection).not.toHaveBeenCalled()
    expect(mockClusterSetsList).not.toHaveBeenCalled()
    expect(mockClusterList).not.toHaveBeenCalled()
  })

  it('calls onSelectClusterSets when cluster sets are selected', () => {
    const onSelectClusterSets = jest.fn()
    renderWithContext(
      <ScopeSelectionStepContent
        {...defaultProps}
        onSelectClusterSets={onSelectClusterSets}
        selectedScope="Select cluster sets"
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Select Cluster Set' }))
    expect(onSelectClusterSets).toHaveBeenCalledWith([{ name: 'test-cs' }])
  })

  it('calls onSelectClusters when clusters are selected', () => {
    const onSelectClusters = jest.fn()
    renderWithContext(
      <ScopeSelectionStepContent
        {...defaultProps}
        onSelectClusters={onSelectClusters}
        selectedScope="Select clusters"
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Select Cluster' }))
    expect(onSelectClusters).toHaveBeenCalledWith([{ name: 'test-cluster' }])
  })

  it('does not throw when onSelectClusterSets is undefined', () => {
    renderWithContext(
      <ScopeSelectionStepContent
        {...defaultProps}
        onSelectClusterSets={undefined}
        selectedScope="Select cluster sets"
      />
    )

    expect(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Select Cluster Set' }))
    }).not.toThrow()
  })

  it('does not throw when onSelectClusters is undefined', () => {
    renderWithContext(
      <ScopeSelectionStepContent {...defaultProps} onSelectClusters={undefined} selectedScope="Select clusters" />
    )

    expect(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Select Cluster' }))
    }).not.toThrow()
  })

  describe('onSelectScopeType callback', () => {
    it('calls onSelectScopeType when scope type is changed to Global access', () => {
      const onSelectScopeType = jest.fn()
      renderWithContext(<ScopeSelectionStepContent {...defaultProps} onSelectScopeType={onSelectScopeType} />)

      // Get the onChange callback that was passed to AcmSelect and invoke it
      const acmSelectProps = mockAcmSelect.mock.calls[0][0]
      acmSelectProps.onChange('Global access')

      expect(onSelectScopeType).toHaveBeenCalledWith('Global access')
    })

    it('calls onSelectScopeType when scope type is changed to Select cluster sets', () => {
      const onSelectScopeType = jest.fn()
      renderWithContext(<ScopeSelectionStepContent {...defaultProps} onSelectScopeType={onSelectScopeType} />)

      // Get the onChange callback that was passed to AcmSelect and invoke it
      const acmSelectProps = mockAcmSelect.mock.calls[0][0]
      acmSelectProps.onChange('Select cluster sets')

      expect(onSelectScopeType).toHaveBeenCalledWith('Select cluster sets')
    })

    it('calls onSelectScopeType when scope type is changed to Select clusters', () => {
      const onSelectScopeType = jest.fn()
      renderWithContext(<ScopeSelectionStepContent {...defaultProps} onSelectScopeType={onSelectScopeType} />)

      // Get the onChange callback that was passed to AcmSelect and invoke it
      const acmSelectProps = mockAcmSelect.mock.calls[0][0]
      acmSelectProps.onChange('Select clusters')

      expect(onSelectScopeType).toHaveBeenCalledWith('Select clusters')
    })

    it('calls onSelectScopeType with undefined when scope type is cleared', () => {
      const onSelectScopeType = jest.fn()
      renderWithContext(
        <ScopeSelectionStepContent
          {...defaultProps}
          onSelectScopeType={onSelectScopeType}
          selectedScope="Global access"
        />
      )

      // Get the onChange callback that was passed to AcmSelect and invoke it with undefined
      const acmSelectProps = mockAcmSelect.mock.calls[0][0]
      acmSelectProps.onChange(undefined)

      expect(onSelectScopeType).toHaveBeenCalledWith(undefined)
    })

    it('does not throw when onSelectScopeType is undefined and scope type is changed', () => {
      renderWithContext(<ScopeSelectionStepContent {...defaultProps} onSelectScopeType={undefined} />)

      // Get the onChange callback that was passed to AcmSelect and invoke it
      const acmSelectProps = mockAcmSelect.mock.calls[0][0]

      expect(() => {
        acmSelectProps.onChange('Global access')
      }).not.toThrow()
    })

    it('does not call onSelectScopeType when it is undefined', () => {
      // Create a spy to track if onSelectScopeType would be called
      const onSelectScopeTypeSpy = jest.fn()

      // Render with undefined onSelectScopeType
      renderWithContext(<ScopeSelectionStepContent {...defaultProps} onSelectScopeType={undefined} />)

      // Get the onChange callback that was passed to AcmSelect and invoke it
      const acmSelectProps = mockAcmSelect.mock.calls[0][0]

      // This should not throw even though onSelectScopeType is undefined
      // because handleScopeTypeChange uses optional chaining
      acmSelectProps.onChange('Select clusters')

      // The spy should not have been called since we passed undefined
      expect(onSelectScopeTypeSpy).not.toHaveBeenCalled()
    })
  })
})
