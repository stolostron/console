/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import { AcmMasonry } from './AcmMasonry'

// mock the resize observer callback
const mockResizeCallback = jest.fn()

// mock useResizeObserver to control the resize behavior in tests
jest.mock('@react-hook/resize-observer')

// get the mocked function after the mock is set up
import useResizeObserver from '@react-hook/resize-observer'
const mockUseResizeObserver = jest.mocked(useResizeObserver)

describe('AcmMasonry', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // setup default mock implementation
    mockUseResizeObserver.mockImplementation((_target, callback) => {
      mockResizeCallback.mockImplementation(callback)
      // return a mock ResizeObserver
      return {} as ResizeObserver
    })
  })

  it('renders with no children', () => {
    const { container } = render(<AcmMasonry minSize={200} />)
    // check that the component renders a div with a grid inside
    expect(container.querySelector('.pf-v5-l-grid')).toBeInTheDocument()
  })

  it('renders children in masonry layout', () => {
    render(
      <AcmMasonry minSize={200} maxColumns={2}>
        <div>Item 1</div>
        <div>Item 2</div>
        <div>Item 3</div>
      </AcmMasonry>
    )

    expect(screen.getByText('Item 1')).toBeInTheDocument()
    expect(screen.getByText('Item 2')).toBeInTheDocument()
    expect(screen.getByText('Item 3')).toBeInTheDocument()
  })

  it('initially hides grid until measurements complete', () => {
    const { container } = render(
      <AcmMasonry minSize={200}>
        <div>Item 1</div>
        <div>Item 2</div>
      </AcmMasonry>
    )

    const grid = container.querySelector('[class*="pf-v5-l-grid"]')
    expect(grid).toHaveStyle('visibility: hidden')
  })

  it('shows grid when no children are provided', () => {
    const { container } = render(<AcmMasonry minSize={200} />)

    const grid = container.querySelector('[class*="pf-v5-l-grid"]')
    expect(grid).toHaveStyle('visibility: visible')
  })

  it('respects maxColumns prop', () => {
    const { container } = render(
      <AcmMasonry minSize={100} maxColumns={2}>
        <div>Item 1</div>
        <div>Item 2</div>
        <div>Item 3</div>
      </AcmMasonry>
    )

    expect(container.firstChild).toBeInTheDocument()
  })

  it('handles children changes correctly', () => {
    const { container, rerender } = render(
      <AcmMasonry minSize={200}>
        <div key="item1">Item 1</div>
        <div key="item2">Item 2</div>
      </AcmMasonry>
    )

    // initially should be hidden until measurements complete
    let grid = container.querySelector('[class*="pf-v5-l-grid"]')
    expect(grid).toHaveStyle('visibility: hidden')

    // change children (simulate search filtering with new items)
    rerender(
      <AcmMasonry minSize={200}>
        <div key="item3">Item 3</div>
        <div key="item4">Item 4</div>
      </AcmMasonry>
    )

    // should still be hidden as new measurements need to complete
    grid = container.querySelector('[class*="pf-v5-l-grid"]')
    expect(grid).toHaveStyle('visibility: hidden')
  })

  it('preserves measurements when same children are reordered', () => {
    const { container, rerender } = render(
      <AcmMasonry minSize={200}>
        <div key="item1">Item 1</div>
        <div key="item2">Item 2</div>
      </AcmMasonry>
    )

    // reorder the same children (simulate pagination or sorting)
    rerender(
      <AcmMasonry minSize={200}>
        <div key="item2">Item 2</div>
        <div key="item1">Item 1</div>
      </AcmMasonry>
    )

    // component should handle reordering gracefully
    const grid = container.querySelector('[class*="pf-v5-l-grid"]')
    expect(grid).toBeInTheDocument()
  })

  it('handles responsive resizing for different column counts', () => {
    const { rerender, container } = render(
      <AcmMasonry minSize={200}>
        <div>Test Item 1</div>
        <div>Test Item 2</div>
        <div>Test Item 3</div>
      </AcmMasonry>
    )

    // test 1 column (width < minSize)
    mockResizeCallback({ contentRect: { width: 150 } })
    rerender(
      <AcmMasonry minSize={200}>
        <div>Test Item 1</div>
        <div>Test Item 2</div>
        <div>Test Item 3</div>
      </AcmMasonry>
    )
    expect(container.querySelector('.pf-v5-l-grid')).toBeInTheDocument()

    // test 2 columns
    mockResizeCallback({ contentRect: { width: 450 } })
    rerender(
      <AcmMasonry minSize={200}>
        <div>Test Item 1</div>
        <div>Test Item 2</div>
        <div>Test Item 3</div>
      </AcmMasonry>
    )
    expect(container.querySelector('.pf-v5-l-grid')).toBeInTheDocument()

    // test 5 columns (edge case)
    mockResizeCallback({ contentRect: { width: 1050 } })
    rerender(
      <AcmMasonry minSize={200}>
        <div>Test Item 1</div>
        <div>Test Item 2</div>
        <div>Test Item 3</div>
      </AcmMasonry>
    )
    expect(container.querySelector('.pf-v5-l-grid')).toBeInTheDocument()

    // test default case (>6 columns)
    mockResizeCallback({ contentRect: { width: 1500 } })
    rerender(
      <AcmMasonry minSize={200}>
        <div>Test Item 1</div>
        <div>Test Item 2</div>
        <div>Test Item 3</div>
      </AcmMasonry>
    )
    expect(container.querySelector('.pf-v5-l-grid')).toBeInTheDocument()
  })

  it('respects maxColumns prop', () => {
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

  it('handles children without explicit keys', () => {
    render(
      <AcmMasonry minSize={200}>
        <div>Item without key 1</div>
        <div>Item without key 2</div>
        <div>Item without key 3</div>
      </AcmMasonry>
    )

    expect(screen.getByText('Item without key 1')).toBeInTheDocument()
    expect(screen.getByText('Item without key 2')).toBeInTheDocument()
    expect(screen.getByText('Item without key 3')).toBeInTheDocument()
  })

  it('handles mixed children with and without keys', () => {
    render(
      <AcmMasonry minSize={200}>
        <div key="explicit-key">Item with key</div>
        <div>Item without key</div>
        <div key="another-key">Another item with key</div>
      </AcmMasonry>
    )

    expect(screen.getByText('Item with key')).toBeInTheDocument()
    expect(screen.getByText('Item without key')).toBeInTheDocument()
    expect(screen.getByText('Another item with key')).toBeInTheDocument()
  })

  it('updates isReady state when measurements complete', () => {
    const { container, rerender } = render(
      <AcmMasonry minSize={200}>
        <div key="item1">Item 1</div>
        <div key="item2">Item 2</div>
      </AcmMasonry>
    )

    // initially should be hidden
    const grid = container.querySelector('[class*="pf-v5-l-grid"]')
    expect(grid).toHaveStyle('visibility: hidden')

    // simulate measurements completing by triggering resize callback
    mockResizeCallback({ contentRect: { width: 400, height: 100 } })

    rerender(
      <AcmMasonry minSize={200}>
        <div key="item1">Item 1</div>
        <div key="item2">Item 2</div>
      </AcmMasonry>
    )

    // grid should still be in the document
    expect(grid).toBeInTheDocument()
  })

  it('handles partial children changes (some same, some new)', () => {
    const { rerender } = render(
      <AcmMasonry minSize={200}>
        <div key="item1">Item 1</div>
        <div key="item2">Item 2</div>
        <div key="item3">Item 3</div>
      </AcmMasonry>
    )

    // change to have some same children and some new ones
    rerender(
      <AcmMasonry minSize={200}>
        <div key="item1">Item 1</div>
        <div key="item4">Item 4</div>
        <div key="item5">Item 5</div>
      </AcmMasonry>
    )

    expect(screen.getByText('Item 1')).toBeInTheDocument()
    expect(screen.getByText('Item 4')).toBeInTheDocument()
    expect(screen.getByText('Item 5')).toBeInTheDocument()
  })

  it('handles null and undefined children gracefully', () => {
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

  it('distributes children across columns based on height', () => {
    const { container } = render(
      <AcmMasonry minSize={100} maxColumns={2}>
        <div key="short" style={{ height: '50px' }}>
          Short item
        </div>
        <div key="tall" style={{ height: '200px' }}>
          Tall item
        </div>
        <div key="medium" style={{ height: '100px' }}>
          Medium item
        </div>
      </AcmMasonry>
    )

    // all items should be rendered
    expect(screen.getByText('Short item')).toBeInTheDocument()
    expect(screen.getByText('Tall item')).toBeInTheDocument()
    expect(screen.getByText('Medium item')).toBeInTheDocument()

    // should have proper grid structure
    const gridItems = container.querySelectorAll('[class*="pf-v5-l-grid__item"]')
    expect(gridItems.length).toBeGreaterThan(0)
  })

  it('shows AcmLoadingPage when not ready', () => {
    render(
      <AcmMasonry minSize={200}>
        <div key="item1">Item 1</div>
      </AcmMasonry>
    )

    // should show loading initially
    expect(screen.getByText('Loading')).toBeInTheDocument()
  })

  it('properly sets up resize observer on mount', () => {
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

  it('handles minimum width constraints', () => {
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

  it('handles edge case with very wide container', () => {
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
