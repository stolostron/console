/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CommonProjectsEmptyState } from './CommonProjectsEmptyState'

// Mock the translation hook
jest.mock('../../lib/acm-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

// Mock AcmEmptyState
jest.mock('../../ui-components', () => ({
  AcmEmptyState: ({ title, message, action }: any) => (
    <div data-testid="acm-empty-state">
      <h1>{title}</h1>
      <p>{message}</p>
      <div data-testid="empty-state-action">{action}</div>
    </div>
  ),
}))

describe('CommonProjectsEmptyState', () => {
  const mockOnCreateCommonProject = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
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

  it('renders with AcmEmptyState component', () => {
    render(<CommonProjectsEmptyState onCreateCommonProject={mockOnCreateCommonProject} />)

    // Verify that the component renders without errors and contains expected elements
    expect(screen.getByText('No common projects found')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create common project' })).toBeInTheDocument()
  })
})
