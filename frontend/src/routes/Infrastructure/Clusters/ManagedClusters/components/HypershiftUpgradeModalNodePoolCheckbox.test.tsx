/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HypershiftUpgradeModalNodePoolCheckbox } from './HypershiftUpgradeModalNodePoolCheckbox'

const defaultProps = {
  label: 'Node pool worker-pool-1',
  isChecked: true,
  id: 'nodepool-worker-pool-1',
  name: 'nodepool-worker-pool-1',
  onChange: jest.fn(),
  isDisabled: false,
  dataTestId: 'nodepool-worker-pool-1-checkbox',
  onToggle: jest.fn(),
  isExpanded: false,
  ariaLabel: 'Toggle node pool worker-pool-1 details',
  children: <div>Child content</div>,
}

describe('HypershiftUpgradeModalNodePoolCheckbox', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders a checkbox with the given label', () => {
    render(<HypershiftUpgradeModalNodePoolCheckbox {...defaultProps} isExpandable={false} />)
    expect(screen.getByText('Node pool worker-pool-1')).toBeInTheDocument()
  })

  it('renders checkbox with data-testid', () => {
    const { container } = render(<HypershiftUpgradeModalNodePoolCheckbox {...defaultProps} isExpandable={false} />)
    expect(container.querySelector('[data-testid="nodepool-worker-pool-1-checkbox"]')).toBeInTheDocument()
  })

  it('renders checkbox as checked when isChecked is true', () => {
    render(<HypershiftUpgradeModalNodePoolCheckbox {...defaultProps} isExpandable={false} />)
    const checkbox = screen.getByRole('checkbox', { name: /Node pool worker-pool-1/ })
    expect(checkbox).toBeChecked()
  })

  it('renders checkbox as unchecked when isChecked is false', () => {
    render(<HypershiftUpgradeModalNodePoolCheckbox {...defaultProps} isChecked={false} isExpandable={false} />)
    const checkbox = screen.getByRole('checkbox', { name: /Node pool worker-pool-1/ })
    expect(checkbox).not.toBeChecked()
  })

  it('renders checkbox as disabled when isDisabled is true', () => {
    render(<HypershiftUpgradeModalNodePoolCheckbox {...defaultProps} isDisabled={true} isExpandable={false} />)
    const checkbox = screen.getByRole('checkbox', { name: /Node pool worker-pool-1/ })
    expect(checkbox).toBeDisabled()
  })

  it('calls onChange when checkbox is clicked', async () => {
    const onChange = jest.fn()
    render(<HypershiftUpgradeModalNodePoolCheckbox {...defaultProps} onChange={onChange} isExpandable={false} />)
    await userEvent.click(screen.getByRole('checkbox', { name: /Node pool worker-pool-1/ }))
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('does not call onChange when checkbox is disabled and clicked', async () => {
    const onChange = jest.fn()
    render(
      <HypershiftUpgradeModalNodePoolCheckbox
        {...defaultProps}
        onChange={onChange}
        isDisabled={true}
        isExpandable={false}
      />
    )
    await userEvent.click(screen.getByRole('checkbox', { name: /Node pool worker-pool-1/ }))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('renders only checkbox when isExpandable is false', () => {
    render(<HypershiftUpgradeModalNodePoolCheckbox {...defaultProps} isExpandable={false} />)
    expect(screen.getByText('Node pool worker-pool-1')).toBeInTheDocument()
    expect(screen.queryByText('Child content')).not.toBeInTheDocument()
  })

  it('renders expandable section with children when isExpandable is true', () => {
    render(<HypershiftUpgradeModalNodePoolCheckbox {...defaultProps} isExpandable={true} />)
    expect(screen.getByText('Node pool worker-pool-1')).toBeInTheDocument()
    expect(screen.getByText('Child content')).toBeInTheDocument()
  })

  it('renders checkbox with correct id when provided', () => {
    render(<HypershiftUpgradeModalNodePoolCheckbox {...defaultProps} isExpandable={false} />)
    expect(document.getElementById('nodepool-worker-pool-1')).toBeInTheDocument()
  })

  it('applies aria-label when expandable', () => {
    render(<HypershiftUpgradeModalNodePoolCheckbox {...defaultProps} isExpandable={true} />)
    const expandable = document.querySelector('[aria-label="Toggle node pool worker-pool-1 details"]')
    expect(expandable).toBeInTheDocument()
  })

  it('calls onToggle when expandable section is toggled', async () => {
    const onToggle = jest.fn()
    render(<HypershiftUpgradeModalNodePoolCheckbox {...defaultProps} onToggle={onToggle} isExpandable={true} />)
    const toggle = screen.getByRole('button', { name: /node pool worker-pool-1/i })
    await userEvent.click(toggle)
    expect(onToggle).toHaveBeenCalledTimes(1)
  })
})
