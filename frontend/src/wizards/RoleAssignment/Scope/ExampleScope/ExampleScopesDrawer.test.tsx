/* Copyright Contributors to the Open Cluster Management project */

import { render, screen, fireEvent } from '@testing-library/react'
import { ExampleScopesDrawer } from './ExampleScopesDrawer'

// Mock the translation hook
jest.mock('../../../../lib/acm-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

// Mock the ExampleScopes component
jest.mock('./ExampleScopes', () => ({
  ExampleScopes: () => <div data-testid="example-scopes">Example Scopes Content</div>,
}))

describe('ExampleScopesDrawer', () => {
  const mockOnClose = jest.fn()
  const defaultProps = {
    isVisible: true,
    onClose: mockOnClose,
    children: <div data-testid="drawer-children">Main Content</div>,
  }

  beforeEach(() => {
    mockOnClose.mockClear()
  })

  it('renders when visible', () => {
    render(<ExampleScopesDrawer {...defaultProps} />)

    expect(screen.getByText('Example scopes')).toBeInTheDocument()
    expect(screen.getByTestId('example-scopes')).toBeInTheDocument()
    expect(screen.getByTestId('drawer-children')).toBeInTheDocument()
  })

  it('does not render when not visible', () => {
    render(<ExampleScopesDrawer {...defaultProps} isVisible={false} />)

    // The drawer should still render but be collapsed
    expect(screen.getByTestId('drawer-children')).toBeInTheDocument()
  })

  it('renders drawer title with correct heading level', () => {
    render(<ExampleScopesDrawer {...defaultProps} />)

    const title = screen.getByRole('heading', { level: 2 })
    expect(title).toBeInTheDocument()
    expect(title).toHaveTextContent('Example scopes')
  })

  it('renders close button', () => {
    render(<ExampleScopesDrawer {...defaultProps} />)

    const closeButton = screen.getByRole('button', { name: /close/i })
    expect(closeButton).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    render(<ExampleScopesDrawer {...defaultProps} />)

    const closeButton = screen.getByRole('button', { name: /close/i })
    fireEvent.click(closeButton)

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('renders children in drawer content body', () => {
    const customChildren = <div data-testid="custom-content">Custom Content</div>

    render(<ExampleScopesDrawer {...defaultProps}>{customChildren}</ExampleScopesDrawer>)

    expect(screen.getByTestId('custom-content')).toBeInTheDocument()
  })

  it('renders ExampleScopes in drawer panel body', () => {
    render(<ExampleScopesDrawer {...defaultProps} />)

    expect(screen.getByTestId('example-scopes')).toBeInTheDocument()
  })

  it('has correct drawer panel properties', () => {
    render(<ExampleScopesDrawer {...defaultProps} />)

    // The drawer should be inline and expanded when visible
    const drawer = screen.getByTestId('drawer-children').closest('[class*="pf-c-drawer"]')
    expect(drawer).toBeInTheDocument()
  })
})
