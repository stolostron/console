/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import { ExampleScopeBase } from './ExampleScopeBase'

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

// Mock the helper functions
jest.mock('./ExampleScopeBaseHelper', () => ({
  getExampleTreeData: jest.fn((index: number) => [
    {
      name: `Mock Tree Data ${index}`,
      id: `mock-${index}`,
      icon: <span data-testid="mock-icon">Icon</span>,
    },
  ]),
  getExampleTitle: jest.fn((index: number) => `Mock Title ${index}`),
}))

describe('ExampleScopeBase', () => {
  it('renders with correct title and tree data for example index 0', () => {
    render(<ExampleScopeBase exampleIndex={0} />)

    expect(screen.getByText('Mock Title 0')).toBeInTheDocument()
    expect(screen.getByText('Mock Tree Data 0')).toBeInTheDocument()
  })

  it('renders with correct title and tree data for example index 5', () => {
    render(<ExampleScopeBase exampleIndex={5} />)

    expect(screen.getByText('Mock Title 5')).toBeInTheDocument()
    expect(screen.getByText('Mock Tree Data 5')).toBeInTheDocument()
  })

  it('renders TreeView with correct props', () => {
    render(<ExampleScopeBase exampleIndex={0} />)

    const treeView = screen.getByRole('tree')
    expect(treeView).toBeInTheDocument()
  })

  it('renders title with correct heading level', () => {
    render(<ExampleScopeBase exampleIndex={0} />)

    const title = screen.getByRole('heading', { level: 3 })
    expect(title).toBeInTheDocument()
    expect(title).toHaveTextContent('Mock Title 0')
  })
})
