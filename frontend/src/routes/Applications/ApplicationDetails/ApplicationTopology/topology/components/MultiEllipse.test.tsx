/* Copyright Contributors to the Open Cluster Management project */

const mockUseAnchor = jest.fn()

jest.mock('@patternfly/react-topology', () => ({
  useAnchor: mockUseAnchor,
  AbstractAnchor: class MockAbstractAnchor {
    owner: unknown
    offset: number
    constructor(owner: unknown, offset = 0) {
      this.owner = owner
      this.offset = offset
    }
  },
  getEllipseAnchorPoint: jest.fn(),
  Point: class MockPoint {
    x: number
    y: number
    constructor(x: number, y: number) {
      this.x = x
      this.y = y
    }
  },
}))

jest.mock('@patternfly/react-styles', () => ({
  css: jest.fn((...args) => args.join(' ')),
}))

jest.mock('@patternfly/react-topology/dist/esm/css/topology-components', () => ({
  topologyNodeBackground: 'topology-node-background',
}))

import { render } from '@testing-library/react'
import MultiEllipse from './MultiEllipse'
import MultiEllipseAnchor from './MultiEllipseAnchor'

const mockElement = {} as never

describe('MultiEllipse tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('calls useAnchor with MultiEllipseAnchor', () => {
    render(<MultiEllipse element={mockElement} width={100} height={80} />)
    expect(mockUseAnchor).toHaveBeenCalledWith(MultiEllipseAnchor)
  })

  test('renders three ellipses in a group', () => {
    const { container } = render(<MultiEllipse element={mockElement} width={100} height={80} />)

    const group = container.querySelector('g')
    expect(group).toBeInTheDocument()

    const ellipses = container.querySelectorAll('ellipse')
    expect(ellipses).toHaveLength(3)
  })

  test('calculates correct ellipse positions and dimensions', () => {
    const width = 100
    const height = 80

    const { container } = render(<MultiEllipse element={mockElement} width={width} height={height} />)
    const ellipses = container.querySelectorAll('ellipse')

    // First ellipse (rightmost, offset by 14)
    expect(ellipses[0]).toHaveAttribute('cx', String(width / 2 + 14))
    expect(ellipses[0]).toHaveAttribute('cy', String(height / 2))
    expect(ellipses[0]).toHaveAttribute('rx', String(Math.max(0, width / 2 - 1)))
    expect(ellipses[0]).toHaveAttribute('ry', String(Math.max(0, height / 2 - 1)))

    // Second ellipse (middle, offset by 7)
    expect(ellipses[1]).toHaveAttribute('cx', String(width / 2 + 7))
    expect(ellipses[1]).toHaveAttribute('cy', String(height / 2))
    expect(ellipses[1]).toHaveAttribute('rx', String(Math.max(0, width / 2 - 1)))
    expect(ellipses[1]).toHaveAttribute('ry', String(Math.max(0, height / 2 - 1)))

    // Third ellipse (leftmost, no offset)
    expect(ellipses[2]).toHaveAttribute('cx', String(width / 2))
    expect(ellipses[2]).toHaveAttribute('cy', String(height / 2))
    expect(ellipses[2]).toHaveAttribute('rx', String(Math.max(0, width / 2 - 1)))
    expect(ellipses[2]).toHaveAttribute('ry', String(Math.max(0, height / 2 - 1)))
  })

  test('applies default className from PatternFly styles', () => {
    const { container } = render(<MultiEllipse element={mockElement} width={100} height={80} />)
    const ellipses = container.querySelectorAll('ellipse')

    ellipses.forEach((ellipse) => {
      expect(ellipse).toHaveAttribute('class', 'topology-node-background')
    })
  })

  test('applies custom className when provided', () => {
    const customClassName = 'custom-ellipse-class'
    const { container } = render(
      <MultiEllipse element={mockElement} width={100} height={80} className={customClassName} />
    )
    const ellipses = container.querySelectorAll('ellipse')

    ellipses.forEach((ellipse) => {
      expect(ellipse).toHaveAttribute('class', customClassName)
    })
  })

  test('applies filter when provided', () => {
    const filter = 'url(#shadow-filter)'
    const { container } = render(<MultiEllipse element={mockElement} width={100} height={80} filter={filter} />)
    const ellipses = container.querySelectorAll('ellipse')

    ellipses.forEach((ellipse) => {
      expect(ellipse).toHaveAttribute('filter', filter)
    })
  })

  test('handles small dimensions correctly with Math.max protection', () => {
    const { container } = render(<MultiEllipse element={mockElement} width={1} height={1} />)
    const ellipses = container.querySelectorAll('ellipse')

    // rx and ry should be 0 when (width/2 - 1) or (height/2 - 1) would be negative
    ellipses.forEach((ellipse) => {
      expect(ellipse).toHaveAttribute('rx', '0')
      expect(ellipse).toHaveAttribute('ry', '0')
    })
  })

  test('handles zero dimensions', () => {
    const { container } = render(<MultiEllipse element={mockElement} width={0} height={0} />)
    const ellipses = container.querySelectorAll('ellipse')

    ellipses.forEach((ellipse) => {
      expect(ellipse).toHaveAttribute('cx')
      expect(ellipse).toHaveAttribute('cy', '0')
      expect(ellipse).toHaveAttribute('rx', '0')
      expect(ellipse).toHaveAttribute('ry', '0')
    })
  })

  test('applies dndDropRef to all ellipses', () => {
    const mockRef = jest.fn()
    render(<MultiEllipse element={mockElement} width={100} height={80} dndDropRef={mockRef} />)

    // The ref should be called for each ellipse
    expect(mockRef).toHaveBeenCalledTimes(3)
  })
})
