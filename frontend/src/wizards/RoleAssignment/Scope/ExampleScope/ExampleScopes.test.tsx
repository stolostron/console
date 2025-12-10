/* Copyright Contributors to the Open Cluster Management project */

import { render, screen, fireEvent } from '@testing-library/react'
import { ExampleScopes } from './ExampleScopes'

// Mock the translation hook
jest.mock('../../../../lib/acm-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      if (key === 'Example {{current}} of {{total}}' && options) {
        return `Example ${options.current} of ${options.total}`
      }
      return key
    },
  }),
}))

// Mock the ExampleScopeBase component to avoid PatternFly TreeView issues in tests
jest.mock('./ExampleScopeBase', () => ({
  ExampleScopeBase: ({ exampleIndex }: { exampleIndex: number }) => (
    <div data-testid={`example-scope-${exampleIndex}`}>Example Scope {exampleIndex}</div>
  ),
}))

describe('ExampleScopes', () => {
  it('renders initial state correctly', () => {
    render(<ExampleScopes />)

    expect(screen.getByText('These examples show different ways to scope role assignments.')).toBeInTheDocument()
    expect(screen.getByText('Example 1 of 9')).toBeInTheDocument()

    // Instead of looking for the test ID, let's look for the mock content
    expect(screen.getByText('Example Scope 0')).toBeInTheDocument()
  })

  it('renders navigation buttons', () => {
    render(<ExampleScopes />)

    const previousButton = screen.getByLabelText('Previous example')
    const nextButton = screen.getByLabelText('Next example')

    expect(previousButton).toBeInTheDocument()
    expect(nextButton).toBeInTheDocument()
  })

  it('disables previous button on first example', () => {
    render(<ExampleScopes />)

    const previousButton = screen.getByLabelText('Previous example')
    expect(previousButton).toBeDisabled()
  })

  it('navigates to next example when next button is clicked', () => {
    render(<ExampleScopes />)

    const nextButton = screen.getByLabelText('Next example')
    fireEvent.click(nextButton)

    expect(screen.getByText('Example 2 of 9')).toBeInTheDocument()
    expect(screen.getByText('Example Scope 1')).toBeInTheDocument()
  })

  it('navigates to previous example when previous button is clicked', () => {
    render(<ExampleScopes />)

    const nextButton = screen.getByLabelText('Next example')
    const previousButton = screen.getByLabelText('Previous example')

    // Go to second example
    fireEvent.click(nextButton)
    expect(screen.getByText('Example 2 of 9')).toBeInTheDocument()

    // Go back to first example
    fireEvent.click(previousButton)
    expect(screen.getByText('Example 1 of 9')).toBeInTheDocument()
    expect(screen.getByText('Example Scope 0')).toBeInTheDocument()
  })

  it('disables next button on last example', () => {
    render(<ExampleScopes />)

    const nextButton = screen.getByLabelText('Next example')

    // Navigate to last example (8 clicks to get to index 8)
    for (let i = 0; i < 8; i++) {
      fireEvent.click(nextButton)
    }

    expect(screen.getByText('Example 9 of 9')).toBeInTheDocument()
    expect(nextButton).toBeDisabled()
  })

  it('renders card component structure', () => {
    render(<ExampleScopes />)

    // Verify the component renders without errors and contains the expected content
    expect(screen.getByText('These examples show different ways to scope role assignments.')).toBeInTheDocument()
    expect(screen.getByText('Example Scope 0')).toBeInTheDocument()

    // Verify navigation controls are present
    expect(screen.getByLabelText('Previous example')).toBeInTheDocument()
    expect(screen.getByLabelText('Next example')).toBeInTheDocument()
  })
})
