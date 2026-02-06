/* Copyright Contributors to the Open Cluster Management project */

const mockUseHover = jest.fn()
const mockDefaultNode = jest.fn()

jest.mock('@patternfly/react-topology', () => ({
  Ellipse: jest.fn(() => null),
  Decorator: jest.fn(({ x, y, radius, icon }) => (
    <g data-testid="decorator" data-x={x} data-y={y} data-radius={radius}>
      {icon}
    </g>
  )),
  DefaultNode: (props: Record<string, unknown>) => {
    mockDefaultNode(props)
    return (
      <g data-testid="default-node">
        {props.children as React.ReactNode}
        {props.attachments as React.ReactNode}
      </g>
    )
  },
  TopologyQuadrant: {
    upperLeft: 'upperLeft',
    upperRight: 'upperRight',
    lowerLeft: 'lowerLeft',
    lowerRight: 'lowerRight',
  },
  ScaleDetailsLevel: {
    high: 'high',
    medium: 'medium',
    low: 'low',
  },
  getDefaultShapeDecoratorCenter: jest.fn(() => ({ x: 10, y: 10 })),
  observer: jest.fn((component) => component),
  useHover: mockUseHover,
}))

jest.mock('./MultiEllipse', () => jest.fn(() => null))

import * as React from 'react'
import { render } from '@testing-library/react'
import StyledNode from './StyledNode'
import { Node, Ellipse } from '@patternfly/react-topology'
import MultiEllipse from './MultiEllipse'

const createMockElement = (
  overrides: {
    data?: Record<string, unknown>
    scale?: number
    width?: number
    height?: number
  } = {}
): Node => {
  const { data = {}, scale = 1, width = 100, height = 80 } = overrides

  return {
    getData: jest.fn(() => data),
    getGraph: jest.fn(() => ({
      getScale: jest.fn(() => scale),
    })),
    getDimensions: jest.fn(() => ({ width, height })),
  } as unknown as Node
}

describe('StyledNode tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseHover.mockReturnValue([false])
  })

  describe('rendering', () => {
    test('renders DefaultNode component', () => {
      const element = createMockElement()
      render(<StyledNode element={element} />)

      expect(mockDefaultNode).toHaveBeenCalled()
      expect(mockDefaultNode).toHaveBeenCalledWith(
        expect.objectContaining({
          element,
        })
      )
    })

    test('renders node icon when not at low detail level', () => {
      const element = createMockElement({ data: { shape: 'circle' } })
      const { container } = render(<StyledNode element={element} />)

      const useElement = container.querySelector('use')
      expect(useElement).toHaveAttribute('href', '#nodeIcon_circle')
    })

    test('renders node icon with correct dimensions', () => {
      const element = createMockElement({ data: { shape: 'test' }, width: 120, height: 90 })
      const { container } = render(<StyledNode element={element} />)

      const useElement = container.querySelector('use')
      expect(useElement).toHaveAttribute('width', '120')
      expect(useElement).toHaveAttribute('height', '90')
    })
  })

  describe('scale and detail levels', () => {
    test('uses high detail level when scale >= 0.6', () => {
      const element = createMockElement({ scale: 0.6 })
      render(<StyledNode element={element} showLabel />)

      expect(mockDefaultNode).toHaveBeenCalledWith(
        expect.objectContaining({
          scaleLabel: true,
          showLabel: true,
        })
      )
    })

    test('uses medium detail level when scale is between 0.3 and 0.6', () => {
      const element = createMockElement({ scale: 0.4, data: { secondaryLabel: 'secondary' } })
      render(<StyledNode element={element} showLabel />)

      expect(mockDefaultNode).toHaveBeenCalledWith(
        expect.objectContaining({
          scaleLabel: true,
          showLabel: true,
        })
      )
    })

    test('uses low detail level when scale < 0.3', () => {
      const element = createMockElement({ scale: 0.2 })
      render(<StyledNode element={element} showLabel />)

      expect(mockDefaultNode).toHaveBeenCalledWith(
        expect.objectContaining({
          scaleLabel: false,
          showLabel: false,
        })
      )
    })

    test('does not show node icon at low detail level without hover', () => {
      mockUseHover.mockReturnValue([false])
      const element = createMockElement({ scale: 0.2, data: { shape: 'circle' } })
      const { container } = render(<StyledNode element={element} />)

      const useElement = container.querySelector('use')
      expect(useElement).not.toBeInTheDocument()
    })

    test('shows node icon at low detail level when hovering', () => {
      mockUseHover.mockReturnValue([true])
      const element = createMockElement({ scale: 0.2, data: { shape: 'circle' } })
      const { container } = render(<StyledNode element={element} />)

      const useElement = container.querySelector('use')
      expect(useElement).toBeInTheDocument()
    })
  })

  describe('hover behavior', () => {
    test('shows label when hovering even at low detail level', () => {
      mockUseHover.mockReturnValue([true])
      const element = createMockElement({ scale: 0.2 })
      render(<StyledNode element={element} />)

      expect(mockDefaultNode).toHaveBeenCalledWith(
        expect.objectContaining({
          showLabel: true,
        })
      )
    })

    test('scales node when hovering at low detail level', () => {
      mockUseHover.mockReturnValue([true])
      const element = createMockElement({ scale: 0.2 })
      render(<StyledNode element={element} />)

      expect(mockDefaultNode).toHaveBeenCalledWith(
        expect.objectContaining({
          scaleNode: true,
        })
      )
    })

    test('does not scale node when not at low detail level', () => {
      mockUseHover.mockReturnValue([true])
      const element = createMockElement({ scale: 0.6 })
      render(<StyledNode element={element} />)

      expect(mockDefaultNode).toHaveBeenCalledWith(
        expect.objectContaining({
          scaleNode: false,
        })
      )
    })
  })

  describe('data processing', () => {
    test('removes undefined values from data', () => {
      const element = createMockElement({
        data: {
          label: 'test',
          undefinedProp: undefined,
          nullProp: null,
        },
      })
      render(<StyledNode element={element} />)

      const calledProps = mockDefaultNode.mock.calls[0][0]
      expect(calledProps.label).toBe('test')
      expect(calledProps).not.toHaveProperty('undefinedProp')
      expect(calledProps.nullProp).toBeNull()
    })

    test('removes secondaryLabel at medium detail level', () => {
      const element = createMockElement({
        scale: 0.4,
        data: { secondaryLabel: 'should be removed' },
      })
      render(<StyledNode element={element} />)

      const calledProps = mockDefaultNode.mock.calls[0][0]
      expect(calledProps).not.toHaveProperty('secondaryLabel')
    })

    test('keeps secondaryLabel at high detail level', () => {
      const element = createMockElement({
        scale: 0.8,
        data: { secondaryLabel: 'should be kept' },
      })
      render(<StyledNode element={element} />)

      const calledProps = mockDefaultNode.mock.calls[0][0]
      expect(calledProps.secondaryLabel).toBe('should be kept')
    })
  })

  describe('decorators', () => {
    test('renders status decorator when statusIcon is provided at high detail level', () => {
      const element = createMockElement({
        scale: 1,
        data: {
          statusIcon: { icon: 'warning', classType: 'warning-class', width: 16, height: 16 },
        },
      })
      render(<StyledNode element={element} />)

      // Verify attachments prop is passed with decorators
      const calledProps = mockDefaultNode.mock.calls[0][0]
      expect(calledProps.attachments).toBeTruthy()
    })

    test('renders count decorator when resourceCount > 1', () => {
      const element = createMockElement({
        scale: 1,
        data: {
          specs: { resourceCount: 3 },
        },
      })
      const { container } = render(<StyledNode element={element} />)

      const countText = container.querySelector('text')
      expect(countText).toBeInTheDocument()
      expect(countText).toHaveTextContent('3')
    })

    test('does not render decorators at low detail level', () => {
      const element = createMockElement({
        scale: 0.2,
        data: {
          statusIcon: { icon: 'warning', classType: 'warning-class', width: 16, height: 16 },
          specs: { resourceCount: 3 },
        },
      })
      const { container } = render(<StyledNode element={element} />)

      const decorator = container.querySelector('[data-testid="decorator"]')
      expect(decorator).not.toBeInTheDocument()
    })

    test('does not render count decorator when resourceCount is 1', () => {
      const element = createMockElement({
        scale: 1,
        data: {
          specs: { resourceCount: 1 },
        },
      })
      const { container } = render(<StyledNode element={element} />)

      const countText = container.querySelector('text')
      expect(countText).not.toBeInTheDocument()
    })
  })

  describe('context menu', () => {
    test('passes onContextMenu when showContextMenu is true', () => {
      const mockOnContextMenu = jest.fn()
      const element = createMockElement({
        data: { showContextMenu: true },
      })
      render(<StyledNode element={element} onContextMenu={mockOnContextMenu} />)

      expect(mockDefaultNode).toHaveBeenCalledWith(
        expect.objectContaining({
          onContextMenu: mockOnContextMenu,
        })
      )
    })

    test('does not pass onContextMenu when showContextMenu is false', () => {
      const mockOnContextMenu = jest.fn()
      const element = createMockElement({
        data: { showContextMenu: false },
      })
      render(<StyledNode element={element} onContextMenu={mockOnContextMenu} />)

      expect(mockDefaultNode).toHaveBeenCalledWith(
        expect.objectContaining({
          onContextMenu: undefined,
        })
      )
    })
  })

  describe('custom shape decorator center', () => {
    test('uses custom getShapeDecoratorCenter when provided', () => {
      const customGetCenter = jest.fn(() => ({ x: 50, y: 50 }))
      const element = createMockElement({
        scale: 1,
        data: {
          statusIcon: { icon: 'test', classType: 'test-class', width: 16, height: 16 },
        },
      })
      render(<StyledNode element={element} getShapeDecoratorCenter={customGetCenter} />)

      expect(customGetCenter).toHaveBeenCalled()
    })
  })

  describe('drag and regrouping states', () => {
    test('passes dragging prop to DefaultNode', () => {
      const element = createMockElement()
      render(<StyledNode element={element} dragging />)

      expect(mockDefaultNode).toHaveBeenCalledWith(
        expect.objectContaining({
          dragging: true,
        })
      )
    })

    test('passes regrouping prop to DefaultNode', () => {
      const element = createMockElement()
      render(<StyledNode element={element} regrouping />)

      expect(mockDefaultNode).toHaveBeenCalledWith(
        expect.objectContaining({
          regrouping: true,
        })
      )
    })
  })

  describe('label icon', () => {
    test('renders labelIcon when provided in data', () => {
      const MockIcon = ({ noVerticalAlign }: { noVerticalAlign?: boolean }) => (
        <svg data-testid="label-icon" data-no-vertical-align={String(noVerticalAlign)} />
      )
      const element = createMockElement({
        data: { labelIcon: MockIcon },
      })
      render(<StyledNode element={element} />)

      const calledProps = mockDefaultNode.mock.calls[0][0]
      expect(calledProps.labelIcon).toBeDefined()
    })

    test('passes noVerticalAlign to labelIcon', () => {
      const MockIcon = jest.fn(({ noVerticalAlign }: { noVerticalAlign?: boolean }) => (
        <svg data-testid="label-icon" data-no-vertical-align={String(noVerticalAlign)} />
      ))
      const element = createMockElement({
        data: { labelIcon: MockIcon },
      })
      render(<StyledNode element={element} />)

      // Get the labelIcon prop and render it to verify noVerticalAlign is passed
      const calledProps = mockDefaultNode.mock.calls[0][0]
      const { container } = render(calledProps.labelIcon)
      expect(container.querySelector('[data-testid="label-icon"]')).toHaveAttribute('data-no-vertical-align', 'true')
    })
  })

  describe('MultiEllipse shape', () => {
    test('uses MultiEllipse when resourceCount > 1', () => {
      const element = createMockElement({
        data: {
          specs: { resourceCount: 2 },
        },
      })
      render(<StyledNode element={element} />)

      const calledProps = mockDefaultNode.mock.calls[0][0]
      const customShape = calledProps.getCustomShape()
      expect(customShape).toBe(MultiEllipse)
    })

    test('uses Ellipse when resourceCount is 1', () => {
      const element = createMockElement({
        data: {
          specs: { resourceCount: 1 },
        },
      })
      render(<StyledNode element={element} />)

      const calledProps = mockDefaultNode.mock.calls[0][0]
      const customShape = calledProps.getCustomShape()
      expect(customShape).toBe(Ellipse)
    })

    test('uses Ellipse when resourceCount is undefined', () => {
      const element = createMockElement({
        data: {},
      })
      render(<StyledNode element={element} />)

      const calledProps = mockDefaultNode.mock.calls[0][0]
      const customShape = calledProps.getCustomShape()
      expect(customShape).toBe(Ellipse)
    })
  })

  describe('showStatusDecorator', () => {
    test('shows status decorator at high detail level when showStatusDecorator is true', () => {
      const element = createMockElement({
        scale: 1,
        data: { showStatusDecorator: true },
      })
      render(<StyledNode element={element} />)

      expect(mockDefaultNode).toHaveBeenCalledWith(
        expect.objectContaining({
          showStatusDecorator: true,
        })
      )
    })

    test('does not show status decorator at low detail level when not in data', () => {
      const element = createMockElement({
        scale: 0.2,
        data: {},
      })
      render(<StyledNode element={element} />)

      // At low detail level, showStatusDecorator should be false
      // (detailsLevel === ScaleDetailsLevel.high && passedData.showStatusDecorator)
      // = ('low' === 'high' && undefined) = false
      expect(mockDefaultNode).toHaveBeenCalledWith(
        expect.objectContaining({
          showStatusDecorator: false,
        })
      )
    })

    test('preserves showStatusDecorator from data via spread', () => {
      // Note: {...passedData} is spread after the calculated showStatusDecorator,
      // so if data contains showStatusDecorator, it overrides the calculated value
      const element = createMockElement({
        scale: 0.2,
        data: { showStatusDecorator: true },
      })
      render(<StyledNode element={element} />)

      // The passedData spread overrides the calculated value
      expect(mockDefaultNode).toHaveBeenCalledWith(
        expect.objectContaining({
          showStatusDecorator: true,
        })
      )
    })
  })

  describe('showStatusBackground', () => {
    test('shows status background at low detail level when not hovering', () => {
      mockUseHover.mockReturnValue([false])
      const element = createMockElement({ scale: 0.2 })
      render(<StyledNode element={element} />)

      expect(mockDefaultNode).toHaveBeenCalledWith(
        expect.objectContaining({
          showStatusBackground: true,
        })
      )
    })

    test('does not show status background when hovering at low detail level', () => {
      mockUseHover.mockReturnValue([true])
      const element = createMockElement({ scale: 0.2 })
      render(<StyledNode element={element} />)

      expect(mockDefaultNode).toHaveBeenCalledWith(
        expect.objectContaining({
          showStatusBackground: false,
        })
      )
    })

    test('does not show status background at high detail level', () => {
      mockUseHover.mockReturnValue([false])
      const element = createMockElement({ scale: 1 })
      render(<StyledNode element={element} />)

      expect(mockDefaultNode).toHaveBeenCalledWith(
        expect.objectContaining({
          showStatusBackground: false,
        })
      )
    })
  })

  describe('nodeStatus', () => {
    test('passes status from data to nodeStatus', () => {
      const element = createMockElement({
        data: { status: 'warning' },
      })
      render(<StyledNode element={element} />)

      expect(mockDefaultNode).toHaveBeenCalledWith(
        expect.objectContaining({
          nodeStatus: 'warning',
        })
      )
    })
  })

  describe('contextMenuOpen', () => {
    test('passes contextMenuOpen prop to DefaultNode', () => {
      const element = createMockElement()
      render(<StyledNode element={element} contextMenuOpen />)

      expect(mockDefaultNode).toHaveBeenCalledWith(
        expect.objectContaining({
          contextMenuOpen: true,
        })
      )
    })
  })
})
