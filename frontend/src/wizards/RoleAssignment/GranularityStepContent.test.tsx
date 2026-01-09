/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import { GranularityStepContent } from './GranularityStepContent'

describe('GranularityStepContent', () => {
  it('renders title correctly', () => {
    render(<GranularityStepContent title="Test Title" description="Test description" />)

    expect(screen.getByRole('heading', { name: 'Test Title' })).toBeInTheDocument()
  })

  it('renders single description string', () => {
    render(<GranularityStepContent title="Title" description="Single description" />)

    expect(screen.getByText('Single description')).toBeInTheDocument()
  })

  it('renders multiple description strings', () => {
    render(<GranularityStepContent title="Title" description={['First description', 'Second description']} />)

    expect(screen.getByText('First description')).toBeInTheDocument()
    expect(screen.getByText('Second description')).toBeInTheDocument()
  })

  it('renders action element when provided', () => {
    render(<GranularityStepContent title="Title" description="Description" action={<button>Action Button</button>} />)

    expect(screen.getByRole('button', { name: 'Action Button' })).toBeInTheDocument()
  })

  it('does not render action element when not provided', () => {
    render(<GranularityStepContent title="Title" description="Description" />)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('renders with default xl title size', () => {
    render(<GranularityStepContent title="Title" description="Description" />)

    const heading = screen.getByRole('heading', { name: 'Title' })
    expect(heading).toHaveClass('pf-m-xl')
  })

  it('renders with lg title size when specified', () => {
    render(<GranularityStepContent title="Title" description="Description" titleSize="lg" />)

    const heading = screen.getByRole('heading', { name: 'Title' })
    expect(heading).toHaveClass('pf-m-lg')
  })

  it('renders title and action in flex container when action is provided', () => {
    const { container } = render(
      <GranularityStepContent title="Title" description="Description" action={<button>Action</button>} />
    )

    const flexContainer = container.querySelector('div[style*="display: flex"]')
    expect(flexContainer).toBeInTheDocument()
  })

  it('renders multiple descriptions with correct structure', () => {
    render(<GranularityStepContent title="Title" description={['Desc 1', 'Desc 2', 'Desc 3']} />)

    expect(screen.getByText('Desc 1')).toBeInTheDocument()
    expect(screen.getByText('Desc 2')).toBeInTheDocument()
    expect(screen.getByText('Desc 3')).toBeInTheDocument()
  })
})
