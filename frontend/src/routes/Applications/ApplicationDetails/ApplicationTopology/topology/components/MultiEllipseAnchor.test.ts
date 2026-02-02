/* Copyright Contributors to the Open Cluster Management project */

const mockGetEllipseAnchorPoint = jest.fn()

jest.mock('@patternfly/react-topology', () => ({
  AbstractAnchor: class MockAbstractAnchor {
    owner: unknown
    offset: number
    constructor(owner: unknown, offset = 0) {
      this.owner = owner
      this.offset = offset
    }
  },
  getEllipseAnchorPoint: mockGetEllipseAnchorPoint,
  Point: class MockPoint {
    x: number
    y: number
    constructor(x: number, y: number) {
      this.x = x
      this.y = y
    }
  },
}))

import MultiEllipseAnchor from './MultiEllipseAnchor'
import { Node, NodeModel, Point } from '@patternfly/react-topology'

const createMockOwner = (isEmpty: boolean) =>
  ({
    getBounds: () => ({
      isEmpty: () => isEmpty,
      getCenter: () => ({ x: 100, y: 100 }),
      width: 50,
      height: 40,
    }),
  }) as unknown as Node<NodeModel>

describe('MultiEllipseAnchor tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('returns center when bounds are empty', () => {
    const mockOwner = createMockOwner(true)

    const anchor = new MultiEllipseAnchor(mockOwner, 0)
    const reference = new Point(200, 200)
    const result = anchor.getLocation(reference)

    expect(result).toEqual({ x: 100, y: 100 })
    expect(mockGetEllipseAnchorPoint).not.toHaveBeenCalled()
  })

  test('calculates anchor point for reference on the right side (angle ~0 degrees)', () => {
    const mockOwner = createMockOwner(false)

    // Mock anchor point that would be on the right side (angle ~0 degrees)
    mockGetEllipseAnchorPoint.mockReturnValue(new Point(140, 100))

    const anchor = new MultiEllipseAnchor(mockOwner, 0)
    const reference = new Point(200, 100)
    const result = anchor.getLocation(reference)

    // Should return the anchor point directly (no extra offset for angles outside 200-240)
    expect(result).toEqual(new Point(140, 100))
    expect(mockGetEllipseAnchorPoint).toHaveBeenCalledWith(
      expect.objectContaining({ x: 107, y: 100 }), // shifted center (100 + SHIFT_AMOUNT)
      64, // width + offset*2 + SHIFT_AMOUNT*2 = 50 + 0 + 14
      40, // height + offset*2 = 40 + 0
      reference
    )
  })

  test('backs off extra 8px for angles between 200-240 degrees', () => {
    const mockOwner = createMockOwner(false)

    // Create an anchor point that results in angle ~220 degrees (lower-left quadrant)
    // For angle of 220 degrees from shifted center (107, 100):
    // dx = cos(220°) * distance, dy = sin(220°) * distance
    const angle220Rad = (220 * Math.PI) / 180
    const distance = 30
    const dx = Math.cos(angle220Rad) * distance
    const dy = Math.sin(angle220Rad) * distance
    const anchorX = 107 + dx // shifted center x + dx
    const anchorY = 100 + dy // shifted center y + dy

    mockGetEllipseAnchorPoint.mockReturnValue(new Point(anchorX, anchorY))

    const anchor = new MultiEllipseAnchor(mockOwner, 0)
    const reference = new Point(50, 150) // reference in lower-left direction
    const result = anchor.getLocation(reference)

    // The result should be scaled by (distance + 8) / distance from shifted center
    const scale = (distance + 8) / distance
    const expectedX = 107 + dx * scale
    const expectedY = 100 + dy * scale

    expect(result.x).toBeCloseTo(expectedX, 5)
    expect(result.y).toBeCloseTo(expectedY, 5)
  })

  test('applies offset correctly', () => {
    const mockOwner = createMockOwner(false)

    mockGetEllipseAnchorPoint.mockReturnValue(new Point(150, 100))

    const offset = 5
    const anchor = new MultiEllipseAnchor(mockOwner, offset)
    const reference = new Point(200, 100)
    anchor.getLocation(reference)

    expect(mockGetEllipseAnchorPoint).toHaveBeenCalledWith(
      expect.objectContaining({ x: 107, y: 100 }),
      74, // width + offset*2 + SHIFT_AMOUNT*2 = 50 + 10 + 14
      50, // height + offset*2 = 40 + 10
      reference
    )
  })

  test('handles negative angle conversion to positive', () => {
    const mockOwner = createMockOwner(false)

    // Create an anchor point that results in a negative angle (upper quadrants)
    // For angle of -45 degrees (or 315 degrees), which is upper-right
    const distance = 30
    const anchorX = 107 + distance * Math.cos((-45 * Math.PI) / 180)
    const anchorY = 100 + distance * Math.sin((-45 * Math.PI) / 180)

    mockGetEllipseAnchorPoint.mockReturnValue(new Point(anchorX, anchorY))

    const anchor = new MultiEllipseAnchor(mockOwner, 0)
    const reference = new Point(150, 50) // upper-right direction
    const result = anchor.getLocation(reference)

    // Angle is 315 degrees (outside 200-240 range), should return anchor point directly
    expect(result).toEqual(new Point(anchorX, anchorY))
  })

  test('does not apply extra offset at boundary angle 199 degrees', () => {
    const mockOwner = createMockOwner(false)

    const angle199Rad = (199 * Math.PI) / 180
    const distance = 30
    const anchorX = 107 + Math.cos(angle199Rad) * distance
    const anchorY = 100 + Math.sin(angle199Rad) * distance

    mockGetEllipseAnchorPoint.mockReturnValue(new Point(anchorX, anchorY))

    const anchor = new MultiEllipseAnchor(mockOwner, 0)
    const reference = new Point(50, 110)
    const result = anchor.getLocation(reference)

    // Angle is 199 degrees (just below 200), should return anchor point directly
    expect(result).toEqual(new Point(anchorX, anchorY))
  })

  test('does not apply extra offset at boundary angle 241 degrees', () => {
    const mockOwner = createMockOwner(false)

    const angle241Rad = (241 * Math.PI) / 180
    const distance = 30
    const anchorX = 107 + Math.cos(angle241Rad) * distance
    const anchorY = 100 + Math.sin(angle241Rad) * distance

    mockGetEllipseAnchorPoint.mockReturnValue(new Point(anchorX, anchorY))

    const anchor = new MultiEllipseAnchor(mockOwner, 0)
    const reference = new Point(50, 150)
    const result = anchor.getLocation(reference)

    // Angle is 241 degrees (just above 240), should return anchor point directly
    expect(result).toEqual(new Point(anchorX, anchorY))
  })
})
