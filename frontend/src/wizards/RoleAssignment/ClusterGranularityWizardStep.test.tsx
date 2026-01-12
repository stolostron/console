/* Copyright Contributors to the Open Cluster Management project */

import { DataContext } from '@patternfly-labs/react-form-wizard/lib/src/contexts/DataContext'
import { ItemContext } from '@patternfly-labs/react-form-wizard/lib/src/contexts/ItemContext'
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
const mockWizSelect = jest.fn()

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

// Mock WizSelect
jest.mock('@patternfly-labs/react-form-wizard/lib/src/inputs/WizSelect', () => ({
  WizSelect: (props: any) => {
    mockWizSelect(props)
    return (
      <div data-testid="wiz-select">
        <label>{props.label}</label>
        {props.options?.map((opt: any) => <div key={opt.value}>{opt.label}</div>)}
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

describe('ClusterGranularityStepContent', () => {
  const defaultProps = {
    description: 'Test description',
    selectedClusters: [{ name: 'cluster-1' }, { name: 'cluster-2' }],
  }

  beforeEach(() => {
    jest.clearAllMocks()
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

  it('renders WizSelect with access level options', () => {
    renderWithContext(<ClusterGranularityStepContent {...defaultProps} />)

    expect(mockWizSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        label: 'Access level for selected clusters',
        path: 'selectedClustersAccessLevel',
        required: true,
      })
    )
    expect(mockWizSelect.mock.calls[0][0].options).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: 'Cluster role assignment' }),
        expect.objectContaining({ value: 'Project role assignment' }),
      ])
    )
  })

  it('does not render ProjectsList when selectedClustersAccessLevel is not Project role assignment', () => {
    renderWithContext(<ClusterGranularityStepContent {...defaultProps} />, {
      selectedClustersAccessLevel: 'Cluster role assignment',
    })

    expect(mockProjectsList).not.toHaveBeenCalled()
  })

  it('renders ProjectsList when selectedClustersAccessLevel is Project role assignment', () => {
    renderWithContext(<ClusterGranularityStepContent {...defaultProps} />, {
      selectedClustersAccessLevel: 'Project role assignment',
    })

    expect(mockProjectsList).toHaveBeenCalledWith(
      expect.objectContaining({
        selectedClusters: defaultProps.selectedClusters,
      })
    )
  })

  it('passes selectedClusters to ProjectsList', () => {
    const clusters = [{ name: 'cluster-a' }, { name: 'cluster-b' }, { name: 'cluster-c' }]
    renderWithContext(<ClusterGranularityStepContent description="Test" selectedClusters={clusters} />, {
      selectedClustersAccessLevel: 'Project role assignment',
    })

    expect(mockProjectsList).toHaveBeenCalledWith(
      expect.objectContaining({
        selectedClusters: clusters,
      })
    )
  })

  it('renders with empty selectedClusters array', () => {
    renderWithContext(<ClusterGranularityStepContent description="Test" selectedClusters={[]} />, {
      selectedClustersAccessLevel: 'Project role assignment',
    })

    expect(mockProjectsList).toHaveBeenCalledWith(
      expect.objectContaining({
        selectedClusters: [],
      })
    )
  })

  it('does not render ProjectsList when item context is undefined', () => {
    renderWithContext(<ClusterGranularityStepContent {...defaultProps} />, undefined)

    expect(mockProjectsList).not.toHaveBeenCalled()
  })
})
