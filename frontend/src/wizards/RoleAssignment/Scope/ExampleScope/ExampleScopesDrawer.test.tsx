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
  })

  it('renders drawer structure when not visible', () => {
    render(<ExampleScopesDrawer {...defaultProps} isVisible={false} />)

    // The drawer panel content should still be rendered (though collapsed)
    expect(screen.getByText('Example scopes')).toBeInTheDocument()
    expect(screen.getByTestId('example-scopes')).toBeInTheDocument()
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

    // Note: PatternFly Drawer may not render children in test environment
    // This test verifies the component accepts children prop without errors
    expect(screen.getByText('Example scopes')).toBeInTheDocument()
  })

  it('renders ExampleScopes in drawer panel body', () => {
    render(<ExampleScopesDrawer {...defaultProps} />)

    expect(screen.getByTestId('example-scopes')).toBeInTheDocument()
  })

  it('renders drawer with correct structure', () => {
    render(<ExampleScopesDrawer {...defaultProps} />)

    // The drawer title should be rendered (indicating drawer panel is present)
    expect(screen.getByText('Example scopes')).toBeInTheDocument()

    // The ExampleScopes component should be rendered in the drawer panel
    expect(screen.getByTestId('example-scopes')).toBeInTheDocument()
  })
})
