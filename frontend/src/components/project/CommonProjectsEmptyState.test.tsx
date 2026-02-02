/* Copyright Contributors to the Open Cluster Management project */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CommonProjectsEmptyState } from './CommonProjectsEmptyState'

// Mock the translation hook
jest.mock('../../lib/acm-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

// Mock AcmEmptyState
const mockAcmEmptyState = jest.fn()

jest.mock('../../ui-components', () => ({
  AcmEmptyState: (props: any) => {
    mockAcmEmptyState(props)
    return (
      <div data-testid="acm-empty-state">
        <h1>{props.title}</h1>
        <p>{props.message}</p>
        <div data-testid="empty-state-action">{props.action}</div>
      </div>
    )
  },
}))

describe('CommonProjectsEmptyState', () => {
  const mockOnCreateCommonProject = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockAcmEmptyState.mockClear()
  })

  it('renders the empty state with correct title and message', () => {
    render(<CommonProjectsEmptyState onCreateCommonProject={mockOnCreateCommonProject} />)

    expect(screen.getByText('No common projects found')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Go back and select different clusters, or create projects with the same name on these clusters.'
      )
    ).toBeInTheDocument()
  })

  it('renders the create common project button', () => {
    render(<CommonProjectsEmptyState onCreateCommonProject={mockOnCreateCommonProject} />)

    const button = screen.getByRole('button', { name: 'Create common project' })
    expect(button).toBeInTheDocument()
  })

  it('calls onCreateCommonProject when button is clicked', async () => {
    render(<CommonProjectsEmptyState onCreateCommonProject={mockOnCreateCommonProject} />)

    const button = screen.getByRole('button', { name: 'Create common project' })
    await userEvent.click(button)

    expect(mockOnCreateCommonProject).toHaveBeenCalledTimes(1)
  })

  it('passes correct props to AcmEmptyState', () => {
    render(<CommonProjectsEmptyState onCreateCommonProject={mockOnCreateCommonProject} />)

    // Verify AcmEmptyState was called with correct props
    expect(mockAcmEmptyState).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'No common projects found',
        message: 'Go back and select different clusters, or create projects with the same name on these clusters.',
        action: expect.any(Object), // The Button component
      })
    )
  })

  it('renders Button with correct variant and onClick handler', () => {
    render(<CommonProjectsEmptyState onCreateCommonProject={mockOnCreateCommonProject} />)

    // Get the action prop that was passed to AcmEmptyState
    const actionProp = mockAcmEmptyState.mock.calls[0][0].action

    // Verify it's a Button with correct props
    expect(actionProp.props.variant).toBe('primary')
    expect(actionProp.props.onClick).toBe(mockOnCreateCommonProject)
    expect(actionProp.props.children).toBe('Create common project')
  })

  it('uses translation function for all text content', () => {
    render(<CommonProjectsEmptyState onCreateCommonProject={mockOnCreateCommonProject} />)

    // Verify that translation keys are used (our mock returns the key as-is)
    expect(screen.getByText('No common projects found')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Go back and select different clusters, or create projects with the same name on these clusters.'
      )
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create common project' })).toBeInTheDocument()
  })

  it('renders complete component structure', () => {
    render(<CommonProjectsEmptyState onCreateCommonProject={mockOnCreateCommonProject} />)

    // Verify the complete component structure is rendered
    expect(mockAcmEmptyState).toHaveBeenCalledTimes(1)

    const callArgs = mockAcmEmptyState.mock.calls[0][0]
    expect(callArgs).toEqual({
      title: 'No common projects found',
      message: 'Go back and select different clusters, or create projects with the same name on these clusters.',
      action: expect.objectContaining({
        props: expect.objectContaining({
          variant: 'primary',
          onClick: mockOnCreateCommonProject,
          children: 'Create common project',
        }),
      }),
    })
  })

  describe('createButtonDisabledReason', () => {
    it('renders button enabled with no tooltip when createButtonDisabledReason is not provided', () => {
      render(<CommonProjectsEmptyState onCreateCommonProject={mockOnCreateCommonProject} />)

      const button = screen.getByRole('button', { name: 'Create common project' })
      expect(button).not.toHaveAttribute('aria-disabled', 'true')
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    })

    it('aria-disables the button when createButtonDisabledReason is provided', () => {
      render(
        <CommonProjectsEmptyState
          onCreateCommonProject={mockOnCreateCommonProject}
          createButtonDisabledReason="Select at least two clusters to create a common project."
        />
      )

      const button = screen.getByRole('button', { name: 'Create common project' })
      expect(button).toHaveAttribute('aria-disabled', 'true')
    })

    it('shows tooltip with createButtonDisabledReason when user hovers over the disabled button', async () => {
      const disabledReason = 'Select at least two clusters to create a common project.'
      render(
        <CommonProjectsEmptyState
          onCreateCommonProject={mockOnCreateCommonProject}
          createButtonDisabledReason={disabledReason}
        />
      )

      const button = screen.getByRole('button', { name: 'Create common project' })
      await userEvent.hover(button)

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toHaveTextContent(disabledReason)
      })
    })

    it('does not show tooltip when createButtonDisabledReason is not provided and user hovers over button', async () => {
      render(<CommonProjectsEmptyState onCreateCommonProject={mockOnCreateCommonProject} />)

      const button = screen.getByRole('button', { name: 'Create common project' })
      await userEvent.hover(button)

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    })
  })
})
