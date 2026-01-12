/* Copyright Contributors to the Open Cluster Management project */

import { DataContext } from '@patternfly-labs/react-form-wizard/lib/src/contexts/DataContext'
import { ItemContext } from '@patternfly-labs/react-form-wizard/lib/src/contexts/ItemContext'
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
const mockWizSelect = jest.fn()

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

// Mock WizSelect
jest.mock('@patternfly-labs/react-form-wizard/lib/src/inputs/WizSelect', () => ({
  WizSelect: (props: any) => {
    mockWizSelect(props)
    return (
      <div data-testid="wiz-select">
        {props.options?.map((opt: any) => (
          <div key={opt.value} data-testid={`option-${opt.value}`}>
            {opt.label}
          </div>
        ))}
      </div>
    )
  },
}))

const renderWithContext = (component: React.ReactNode, itemValue: any = {}, updateFn: () => void = jest.fn()) => {
  return render(
    <ItemContext.Provider value={itemValue}>
      <DataContext.Provider value={{ update: updateFn }}>{component}</DataContext.Provider>
    </ItemContext.Provider>
  )
}

describe('ScopeSelectionStepContent', () => {
  const defaultProps = {
    isDrawerExpanded: false,
    setIsDrawerExpanded: jest.fn(),
    onSelectClusterSets: jest.fn(),
    onSelectClusters: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockGranularityStepContent.mockClear()
    mockGlobalScopeSelection.mockClear()
    mockClusterSetsList.mockClear()
    mockClusterList.mockClear()
    mockWizSelect.mockClear()
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

  it('renders WizSelect with scope options', () => {
    renderWithContext(<ScopeSelectionStepContent {...defaultProps} />)

    expect(mockWizSelect).toHaveBeenCalled()
    expect(mockWizSelect.mock.calls[0][0].options).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: 'Global access' }),
        expect.objectContaining({ value: 'Select cluster sets' }),
        expect.objectContaining({ value: 'Select clusters' }),
      ])
    )
  })

  it('renders GlobalScopeSelection when scopeType is Global access', () => {
    renderWithContext(<ScopeSelectionStepContent {...defaultProps} />, { scopeType: 'Global access' })

    expect(mockGlobalScopeSelection).toHaveBeenCalled()
    expect(mockClusterSetsList).not.toHaveBeenCalled()
    expect(mockClusterList).not.toHaveBeenCalled()
  })

  it('renders ClusterSetsList when scopeType is Select cluster sets', () => {
    renderWithContext(<ScopeSelectionStepContent {...defaultProps} />, { scopeType: 'Select cluster sets' })

    expect(mockClusterSetsList).toHaveBeenCalled()
    expect(mockGlobalScopeSelection).not.toHaveBeenCalled()
    expect(mockClusterList).not.toHaveBeenCalled()
  })

  it('renders ClusterList when scopeType is Select clusters', () => {
    renderWithContext(<ScopeSelectionStepContent {...defaultProps} />, { scopeType: 'Select clusters' })

    expect(mockClusterList).toHaveBeenCalled()
    expect(mockGlobalScopeSelection).not.toHaveBeenCalled()
    expect(mockClusterSetsList).not.toHaveBeenCalled()
  })

  it('renders nothing for unrecognized scopeType', () => {
    renderWithContext(<ScopeSelectionStepContent {...defaultProps} />, { scopeType: 'unknown' })

    expect(mockGlobalScopeSelection).not.toHaveBeenCalled()
    expect(mockClusterSetsList).not.toHaveBeenCalled()
    expect(mockClusterList).not.toHaveBeenCalled()
  })

  it('renders nothing when scopeType is undefined', () => {
    renderWithContext(<ScopeSelectionStepContent {...defaultProps} />, {})

    expect(mockGlobalScopeSelection).not.toHaveBeenCalled()
    expect(mockClusterSetsList).not.toHaveBeenCalled()
    expect(mockClusterList).not.toHaveBeenCalled()
  })

  it('calls onSelectClusterSets when cluster sets are selected', () => {
    const onSelectClusterSets = jest.fn()
    renderWithContext(<ScopeSelectionStepContent {...defaultProps} onSelectClusterSets={onSelectClusterSets} />, {
      scopeType: 'Select cluster sets',
    })

    fireEvent.click(screen.getByRole('button', { name: 'Select Cluster Set' }))
    expect(onSelectClusterSets).toHaveBeenCalledWith([{ name: 'test-cs' }])
  })

  it('calls onSelectClusters when clusters are selected', () => {
    const onSelectClusters = jest.fn()
    renderWithContext(<ScopeSelectionStepContent {...defaultProps} onSelectClusters={onSelectClusters} />, {
      scopeType: 'Select clusters',
    })

    fireEvent.click(screen.getByRole('button', { name: 'Select Cluster' }))
    expect(onSelectClusters).toHaveBeenCalledWith([{ name: 'test-cluster' }])
  })

  it('does not throw when onSelectClusterSets is undefined', () => {
    renderWithContext(<ScopeSelectionStepContent {...defaultProps} onSelectClusterSets={undefined} />, {
      scopeType: 'Select cluster sets',
    })

    expect(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Select Cluster Set' }))
    }).not.toThrow()
  })

  it('does not throw when onSelectClusters is undefined', () => {
    renderWithContext(<ScopeSelectionStepContent {...defaultProps} onSelectClusters={undefined} />, {
      scopeType: 'Select clusters',
    })

    expect(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Select Cluster' }))
    }).not.toThrow()
  })
})
