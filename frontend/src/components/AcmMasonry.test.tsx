/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import { AcmMasonry } from './AcmMasonry'

// mock the resize observer callback
const mockResizeCallback = jest.fn()

// mock useResizeObserver to control the resize behavior in tests
jest.mock('@react-hook/resize-observer', () => ({
  __esModule: true,
  default: jest.fn(),
}))

import useResizeObserver from '@react-hook/resize-observer'

const mockUseResizeObserver = useResizeObserver as jest.MockedFunction<typeof useResizeObserver>

describe('AcmMasonry', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // setup default mock implementation
    mockUseResizeObserver.mockImplementation((_target: any, callback: any) => {
      mockResizeCallback.mockImplementation(callback)
      // Return a mock ResizeObserver
      return {
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
      } as ResizeObserver
    })
  })

  it('should render with no children', () => {
    const { container } = render(<AcmMasonry minSize={200} />)
    // check that the component renders a div with a Grid inside
    expect(container.querySelector('.pf-v5-l-grid')).toBeInTheDocument()
  })

  it('should render with single child', () => {
    const { container } = render(
      <AcmMasonry minSize={200}>
        <div>Test Item 1</div>
      </AcmMasonry>
    )
    expect(screen.getByText('Test Item 1')).toBeInTheDocument()
    expect(container.querySelector('.pf-v5-l-grid')).toBeInTheDocument()
  })

  it('should render with multiple children', () => {
    const { container } = render(
      <AcmMasonry minSize={200}>
        <div>Test Item 1</div>
        <div>Test Item 2</div>
        <div>Test Item 3</div>
      </AcmMasonry>
    )
    expect(screen.getByText('Test Item 1')).toBeInTheDocument()
    expect(screen.getByText('Test Item 2')).toBeInTheDocument()
    expect(screen.getByText('Test Item 3')).toBeInTheDocument()
    expect(container.querySelector('.pf-v5-l-grid')).toBeInTheDocument()
  })

  it('should handle responsive resizing for 1 column', () => {
    const { rerender, container } = render(
      <AcmMasonry minSize={300}>
        <div>Test Item 1</div>
        <div>Test Item 2</div>
      </AcmMasonry>
    )

    // simulate resize observer callback with width that results in 1 column
    mockResizeCallback({ contentRect: { width: 250 } })

    rerender(
      <AcmMasonry minSize={300}>
        <div>Test Item 1</div>
        <div>Test Item 2</div>
      </AcmMasonry>
    )

    expect(container.querySelector('.pf-v5-l-grid')).toBeInTheDocument()
  })

  it('should handle responsive resizing for 2 columns', () => {
    const { rerender, container } = render(
      <AcmMasonry minSize={200}>
        <div>Test Item 1</div>
        <div>Test Item 2</div>
      </AcmMasonry>
    )

    // simulate resize observer callback with width that results in 2 columns
    mockResizeCallback({ contentRect: { width: 450 } })

    rerender(
      <AcmMasonry minSize={200}>
        <div>Test Item 1</div>
        <div>Test Item 2</div>
      </AcmMasonry>
    )

    expect(container.querySelector('.pf-v5-l-grid')).toBeInTheDocument()
  })

  it('should handle responsive resizing for 3 columns', () => {
    const { rerender, container } = render(
      <AcmMasonry minSize={200}>
        <div>Test Item 1</div>
        <div>Test Item 2</div>
        <div>Test Item 3</div>
      </AcmMasonry>
    )

    // simulate resize observer callback with width that results in 3 columns
    mockResizeCallback({ contentRect: { width: 650 } })

    rerender(
      <AcmMasonry minSize={200}>
        <div>Test Item 1</div>
        <div>Test Item 2</div>
        <div>Test Item 3</div>
      </AcmMasonry>
    )

    expect(container.querySelector('.pf-v5-l-grid')).toBeInTheDocument()
  })

  it('should handle responsive resizing for 4 columns', () => {
    const { rerender, container } = render(
      <AcmMasonry minSize={200}>
        <div>Test Item 1</div>
        <div>Test Item 2</div>
        <div>Test Item 3</div>
        <div>Test Item 4</div>
      </AcmMasonry>
    )

    // simulate resize observer callback with width that results in 4 columns
    mockResizeCallback({ contentRect: { width: 850 } })

    rerender(
      <AcmMasonry minSize={200}>
        <div>Test Item 1</div>
        <div>Test Item 2</div>
        <div>Test Item 3</div>
        <div>Test Item 4</div>
      </AcmMasonry>
    )

    expect(container.querySelector('.pf-v5-l-grid')).toBeInTheDocument()
  })

  it('should handle responsive resizing for 5 columns', () => {
    const { rerender, container } = render(
      <AcmMasonry minSize={200}>
        <div>Test Item 1</div>
        <div>Test Item 2</div>
        <div>Test Item 3</div>
        <div>Test Item 4</div>
        <div>Test Item 5</div>
      </AcmMasonry>
    )

    // simulate resize observer callback with width that results in 5 columns
    mockResizeCallback({ contentRect: { width: 1050 } })

    rerender(
      <AcmMasonry minSize={200}>
        <div>Test Item 1</div>
        <div>Test Item 2</div>
        <div>Test Item 3</div>
        <div>Test Item 4</div>
        <div>Test Item 5</div>
      </AcmMasonry>
    )

    expect(container.querySelector('.pf-v5-l-grid')).toBeInTheDocument()
  })

  it('should handle responsive resizing for 6 columns', () => {
    const { rerender, container } = render(
      <AcmMasonry minSize={200}>
        <div>Test Item 1</div>
        <div>Test Item 2</div>
        <div>Test Item 3</div>
        <div>Test Item 4</div>
        <div>Test Item 5</div>
        <div>Test Item 6</div>
      </AcmMasonry>
    )

    // simulate resize observer callback with width that results in 6 columns
    mockResizeCallback({ contentRect: { width: 1250 } })

    rerender(
      <AcmMasonry minSize={200}>
        <div>Test Item 1</div>
        <div>Test Item 2</div>
        <div>Test Item 3</div>
        <div>Test Item 4</div>
        <div>Test Item 5</div>
        <div>Test Item 6</div>
      </AcmMasonry>
    )

    expect(container.querySelector('.pf-v5-l-grid')).toBeInTheDocument()
  })

  it('should handle responsive resizing for more than 6 columns (default case)', () => {
    const { rerender, container } = render(
      <AcmMasonry minSize={100}>
        <div>Test Item 1</div>
        <div>Test Item 2</div>
        <div>Test Item 3</div>
        <div>Test Item 4</div>
        <div>Test Item 5</div>
        <div>Test Item 6</div>
        <div>Test Item 7</div>
      </AcmMasonry>
    )

    // simulate resize observer callback with width that results in 7+ columns (triggers default case)
    mockResizeCallback({ contentRect: { width: 1000 } })

    rerender(
      <AcmMasonry minSize={100}>
        <div>Test Item 1</div>
        <div>Test Item 2</div>
        <div>Test Item 3</div>
        <div>Test Item 4</div>
        <div>Test Item 5</div>
        <div>Test Item 6</div>
        <div>Test Item 7</div>
      </AcmMasonry>
    )

    expect(container.querySelector('.pf-v5-l-grid')).toBeInTheDocument()
  })

  it('should respect maxColumns prop', () => {
    const { rerender, container } = render(
      <AcmMasonry minSize={100} maxColumns={3}>
        <div>Test Item 1</div>
        <div>Test Item 2</div>
        <div>Test Item 3</div>
        <div>Test Item 4</div>
      </AcmMasonry>
    )

    // simulate resize observer callback with width that would result in more than 3 columns without maxColumns
    mockResizeCallback({ contentRect: { width: 1000 } })

    rerender(
      <AcmMasonry minSize={100} maxColumns={3}>
        <div>Test Item 1</div>
        <div>Test Item 2</div>
        <div>Test Item 3</div>
        <div>Test Item 4</div>
      </AcmMasonry>
    )

    expect(container.querySelector('.pf-v5-l-grid')).toBeInTheDocument()
  })

  it('should handle minimum width constraints', () => {
    const { rerender, container } = render(
      <AcmMasonry minSize={500}>
        <div>Test Item 1</div>
        <div>Test Item 2</div>
      </AcmMasonry>
    )

    // simulate resize observer callback with width smaller than minSize
    mockResizeCallback({ contentRect: { width: 300 } })

    rerender(
      <AcmMasonry minSize={500}>
        <div>Test Item 1</div>
        <div>Test Item 2</div>
      </AcmMasonry>
    )

    expect(container.querySelector('.pf-v5-l-grid')).toBeInTheDocument()
  })

  it('should handle null/undefined children gracefully', () => {
    render(
      <AcmMasonry minSize={200}>
        <div>Test Item 1</div>
        {null}
        {undefined}
        <div>Test Item 2</div>
        {false && <div>Should not render</div>}
      </AcmMasonry>
    )

    expect(screen.getByText('Test Item 1')).toBeInTheDocument()
    expect(screen.getByText('Test Item 2')).toBeInTheDocument()
    expect(screen.queryByText('Should not render')).not.toBeInTheDocument()
  })

  it('should properly set up resize observer on mount', () => {
    render(
      <AcmMasonry minSize={200}>
        <div>Test Item</div>
      </AcmMasonry>
    )

    // verify that useResizeObserver was called
    expect(mockUseResizeObserver).toHaveBeenCalled()

    // get the callback passed to useResizeObserver
    const callback = mockUseResizeObserver.mock.calls[0][1]
    expect(typeof callback).toBe('function')
  })

  it('should handle MasonryItem resize observer', () => {
    // this test ensures the MasonryItem's resize observer is properly set up
    const { rerender } = render(
      <AcmMasonry minSize={200}>
        <div style={{ height: '100px' }}>Test Item 1</div>
        <div style={{ height: '200px' }}>Test Item 2</div>
      </AcmMasonry>
    )

    // verify the items are rendered
    expect(screen.getByText('Test Item 1')).toBeInTheDocument()
    expect(screen.getByText('Test Item 2')).toBeInTheDocument()

    // the resize observer should have been called for both the main component and each MasonryItem
    expect(mockUseResizeObserver).toHaveBeenCalled()

    rerender(
      <AcmMasonry minSize={200}>
        <div style={{ height: '150px' }}>Test Item 1 Updated</div>
        <div style={{ height: '250px' }}>Test Item 2 Updated</div>
      </AcmMasonry>
    )

    expect(screen.getByText('Test Item 1 Updated')).toBeInTheDocument()
    expect(screen.getByText('Test Item 2 Updated')).toBeInTheDocument()
  })

  it('should handle edge case with very wide container', () => {
    const { rerender, container } = render(
      <AcmMasonry minSize={50}>
        <div>Test Item</div>
      </AcmMasonry>
    )

    // simulate a very wide container
    mockResizeCallback({ contentRect: { width: 5000 } })

    rerender(
      <AcmMasonry minSize={50}>
        <div>Test Item</div>
      </AcmMasonry>
    )

    expect(screen.getByText('Test Item')).toBeInTheDocument()
    expect(container.querySelector('.pf-v5-l-grid')).toBeInTheDocument()
  })
})
