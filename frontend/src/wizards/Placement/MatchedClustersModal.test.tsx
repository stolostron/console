/* Copyright Contributors to the Open Cluster Management project */
import { render, screen, fireEvent } from '@testing-library/react'
import { MatchedClustersModal } from './MatchedClustersModal'

jest.mock('../../lib/acm-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, vars?: Record<string, unknown>) => {
      if (vars) {
        return Object.entries(vars).reduce((s, [k, v]) => s.replace(`{{${k}}}`, String(v)), key)
      }
      return key
    },
  }),
}))

const defaultProps = {
  isOpen: true,
  onClose: jest.fn(),
  matchedClusters: ['cluster1', 'cluster2'],
  notMatchedClusters: ['cluster3'],
  totalClusters: 3,
}

describe('MatchedClustersModal', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders matched and not-matched sections when both are present', () => {
    render(<MatchedClustersModal {...defaultProps} />)
    expect(screen.getByText('Matched')).toBeInTheDocument()
    expect(screen.getByText('Not matched')).toBeInTheDocument()
    expect(screen.getByText('cluster1')).toBeInTheDocument()
    expect(screen.getByText('cluster2')).toBeInTheDocument()
    expect(screen.getByText('cluster3')).toBeInTheDocument()
  })

  it('renders flat list without section headers when no notMatchedClusters', () => {
    render(<MatchedClustersModal {...defaultProps} notMatchedClusters={[]} totalClusters={2} />)
    expect(screen.getByText('cluster1')).toBeInTheDocument()
    expect(screen.getByText('cluster2')).toBeInTheDocument()
    expect(screen.queryByText('Matched')).not.toBeInTheDocument()
    expect(screen.queryByText('Not matched')).not.toBeInTheDocument()
  })

  it('filters clusters by search term', () => {
    render(<MatchedClustersModal {...defaultProps} />)
    const searchInput = screen.getByPlaceholderText('Find by name')
    fireEvent.change(searchInput, { target: { value: 'cluster1' } })
    expect(screen.getByText('cluster1')).toBeInTheDocument()
    expect(screen.queryByText('cluster2')).not.toBeInTheDocument()
    expect(screen.queryByText('cluster3')).not.toBeInTheDocument()
  })

  it('shows empty state when search matches nothing', () => {
    render(<MatchedClustersModal {...defaultProps} />)
    const searchInput = screen.getByPlaceholderText('Find by name')
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } })
    expect(screen.getByText('No clusters found matching "nonexistent"')).toBeInTheDocument()
  })

  it('shows "No clusters" when empty and no search term', () => {
    render(<MatchedClustersModal {...defaultProps} matchedClusters={[]} notMatchedClusters={[]} totalClusters={0} />)
    expect(screen.getByText('No clusters')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<MatchedClustersModal {...defaultProps} isOpen={false} />)
    expect(screen.queryByText('cluster1')).not.toBeInTheDocument()
  })

  it('calls onClose when modal is dismissed', () => {
    render(<MatchedClustersModal {...defaultProps} />)
    const closeButton = screen.getByLabelText('Close')
    fireEvent.click(closeButton)
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
  })

  it('filters notMatched clusters independently', () => {
    render(<MatchedClustersModal {...defaultProps} />)
    const searchInput = screen.getByPlaceholderText('Find by name')
    fireEvent.change(searchInput, { target: { value: 'cluster3' } })
    expect(screen.queryByText('cluster1')).not.toBeInTheDocument()
    expect(screen.getByText('cluster3')).toBeInTheDocument()
    expect(screen.queryByText('Matched')).not.toBeInTheDocument()
    expect(screen.getByText('Not matched')).toBeInTheDocument()
  })

  it('clears search when clear button is clicked', () => {
    render(<MatchedClustersModal {...defaultProps} />)
    const searchInput = screen.getByPlaceholderText('Find by name')
    fireEvent.change(searchInput, { target: { value: 'cluster1' } })
    expect(screen.queryByText('cluster2')).not.toBeInTheDocument()

    const clearButton = screen.getByLabelText('Reset')
    fireEvent.click(clearButton)
    expect(screen.getByText('cluster1')).toBeInTheDocument()
    expect(screen.getByText('cluster2')).toBeInTheDocument()
    expect(screen.getByText('cluster3')).toBeInTheDocument()
  })
})
