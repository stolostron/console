/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { WithScrollContainer } from './WithScrollContainer'

// mock the utils function
jest.mock('./utils', () => ({
  getParentScrollableElement: jest.fn(),
}))

import { getParentScrollableElement } from './utils'

const mockGetParentScrollableElement = getParentScrollableElement as jest.MockedFunction<
  typeof getParentScrollableElement
>

describe('WithScrollContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render span when no scroll container is found', () => {
    mockGetParentScrollableElement.mockReturnValue(undefined)

    render(<WithScrollContainer>{() => <div data-testid="content">Content</div>}</WithScrollContainer>)

    expect(screen.queryByTestId('content')).not.toBeInTheDocument()
    expect(document.querySelector('span')).toBeInTheDocument()
  })

  it('should render children when scroll container is found', () => {
    const mockScrollContainer = document.createElement('div')
    mockGetParentScrollableElement.mockReturnValue(mockScrollContainer)

    // Test the children function directly
    const children = jest.fn().mockReturnValue(<div data-testid="content">Content</div>)

    render(<WithScrollContainer>{children}</WithScrollContainer>)

    // Simulate the ref callback being called
    const span = document.querySelector('span')
    if (span) {
      const refCallback = (span as any).ref
      if (refCallback) {
        refCallback(span)
      }
    }

    expect(children).toHaveBeenCalledWith(mockScrollContainer)
  })

  it('should call getParentScrollableElement with the ref element', () => {
    mockGetParentScrollableElement.mockReturnValue(undefined)

    render(<WithScrollContainer>{() => <div>Content</div>}</WithScrollContainer>)

    const span = document.querySelector('span')
    expect(span).toBeInTheDocument()

    // Simulate the ref callback being called
    const refCallback = (span as any).ref
    if (refCallback) {
      refCallback(span)
    }

    expect(mockGetParentScrollableElement).toHaveBeenCalledWith(span)
  })

  it('should handle null children return', () => {
    const mockScrollContainer = document.createElement('div')
    mockGetParentScrollableElement.mockReturnValue(mockScrollContainer)

    render(<WithScrollContainer>{() => null}</WithScrollContainer>)

    expect(screen.queryByTestId('content')).not.toBeInTheDocument()
  })
})
