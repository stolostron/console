/* Copyright Contributors to the Open Cluster Management project */

import * as React from 'react'
import { render, screen } from '@testing-library/react'
import type { DragEvent, DragSourceMonitor, WithDragNodeProps } from '@patternfly/react-topology'
import {
  ElementContext,
  ModelKind,
  SELECTION_EVENT,
  DRAG_NODE_START_EVENT,
  DRAG_NODE_EVENT,
  DRAG_NODE_END_EVENT,
} from '@patternfly/react-topology'
import type { Node } from '@patternfly/react-topology'
import { withDragNodeAfterThreshold } from './withDragNodeAfterThreshold'

const useDndDragMock = jest.fn()

jest.mock('@patternfly/react-topology', () => {
  const actual = jest.requireActual('@patternfly/react-topology')
  return {
    ...actual,
    useDndDrag: (...args: unknown[]) => useDndDragMock(...args),
    useDndManager: jest.fn(() => ({ cancel: jest.fn() })),
    observer: (Component: React.ComponentType) => Component,
  }
})

type DragSpec = {
  item?: unknown
  operation?: unknown
  begin?: (monitor: DragSourceMonitor, p: object) => unknown
  drag?: (event: DragEvent, monitor: DragSourceMonitor, p: object) => void
  end?: (dropResult: unknown, monitor: DragSourceMonitor, p: object) => Promise<void> | void
  canDrag?: unknown
  collect?: unknown
  canCancel?: unknown
}

function createMockNode(): Node {
  const fireEvent = jest.fn()
  const controller = { fireEvent }
  const translateResult = { x: 0, y: 0 }
  const cloneObj = {
    translate: jest.fn((tx: number, ty: number) => {
      translateResult.x += tx
      translateResult.y += ty
      return translateResult
    }),
  }
  const position = {
    clone: jest.fn(() => cloneObj),
  }
  return {
    getKind: () => ModelKind.node,
    raise: jest.fn(),
    isGroup: jest.fn(() => false),
    getChildren: jest.fn(() => []),
    getController: jest.fn(() => controller),
    getId: () => 'test-node-id',
    getPosition: jest.fn(() => position),
    setPosition: jest.fn(),
  } as unknown as Node
}

/** Avoid spreading drag props onto the DOM; collected props can override JSX children. */
const Inner: React.FC<WithDragNodeProps> = () => <div id="inner-node">inner</div>

function renderWrapped(spec?: Parameters<typeof withDragNodeAfterThreshold>[0], thresholdPx?: number, node?: Node) {
  const Wrapped = withDragNodeAfterThreshold(spec, thresholdPx)(Inner)
  const element = node ?? createMockNode()
  return {
    ...render(
      <ElementContext.Provider value={element}>
        <Wrapped />
      </ElementContext.Provider>
    ),
    node: element,
  }
}

describe('withDragNodeAfterThreshold', () => {
  let lastSpec: DragSpec

  beforeEach(() => {
    jest.clearAllMocks()
    useDndDragMock.mockImplementation((spec: DragSpec) => {
      lastSpec = spec
      return [{ dragging: false }, jest.fn()]
    })
  })

  test('throws when ElementContext is not a Node', () => {
    const Wrapped = withDragNodeAfterThreshold()(Inner)
    const BadContext = { getKind: () => ModelKind.graph } as unknown as Node

    expect(() =>
      render(
        <ElementContext.Provider value={BadContext}>
          <Wrapped />
        </ElementContext.Provider>
      )
    ).toThrow('withDragNodeAfterThreshold must wrap a component used within the scope of a Node')
  })

  test('renders wrapped component and wires useDndDrag', () => {
    renderWrapped()
    expect(screen.getByTestId('inner-node')).toBeInTheDocument()
    expect(useDndDragMock).toHaveBeenCalled()
    expect(lastSpec.item).toEqual({ type: '#useDragNode#' })
  })

  test('uses custom spec.item when provided', () => {
    const customItem = { type: 'custom' }
    renderWrapped({ item: customItem })
    expect(lastSpec.item).toEqual(customItem)
  })

  test('begin raises node and fires DRAG_NODE_START_EVENT', () => {
    const node = createMockNode()
    const monitor = {
      getDragEvent: jest.fn(),
      getOperation: jest.fn(() => 'move'),
    } as unknown as DragSourceMonitor

    renderWrapped(undefined, undefined, node)
    const result = lastSpec.begin!(monitor, {})

    expect(node.raise).toHaveBeenCalled()
    expect(node.getController().fireEvent).toHaveBeenCalledWith(
      DRAG_NODE_START_EVENT,
      node,
      monitor.getDragEvent(),
      monitor.getOperation()
    )
    expect(result).toBe(node)
  })

  test('begin invokes spec.begin when provided', () => {
    const specBegin = jest.fn(() => 'from-spec')
    const node = createMockNode()
    const monitor = {
      getDragEvent: jest.fn(),
      getOperation: jest.fn(() => 'move'),
    } as unknown as DragSourceMonitor

    renderWrapped({ begin: specBegin }, undefined, node)
    const result = lastSpec.begin!(monitor, {})

    expect(specBegin).toHaveBeenCalledWith(monitor, {})
    expect(result).toBe('from-spec')
  })

  test('drag does not move node until Chebyshev distance exceeds threshold', () => {
    const node = createMockNode()
    renderWrapped(undefined, 4, node)
    const monitor = {
      getDragEvent: jest.fn(),
      getOperation: jest.fn(),
    } as unknown as DragSourceMonitor

    lastSpec.begin!(monitor, {})

    lastSpec.drag!({ initialX: 0, initialY: 0, x: 3, y: 3, dx: 3, dy: 3 } as DragEvent, monitor, {})
    expect(node.setPosition).not.toHaveBeenCalled()

    lastSpec.drag!({ initialX: 0, initialY: 0, x: 5, y: 0, dx: 5, dy: 0 } as DragEvent, monitor, {})
    expect(node.setPosition).toHaveBeenCalled()
  })

  test('drag fires DRAG_NODE_EVENT after threshold', () => {
    const node = createMockNode()
    renderWrapped(undefined, 2, node)
    const monitor = {
      getDragEvent: jest.fn(),
      getOperation: jest.fn(() => 'op'),
    } as unknown as DragSourceMonitor
    lastSpec.begin!(monitor, {})

    lastSpec.drag!({ initialX: 0, initialY: 0, x: 10, y: 0, dx: 10, dy: 0 } as DragEvent, monitor, {})

    expect(node.getController().fireEvent).toHaveBeenCalledWith(DRAG_NODE_EVENT, node, expect.anything(), 'op')
  })

  test('end fires SELECTION_EVENT when drag stayed within threshold', async () => {
    const node = createMockNode()
    renderWrapped(undefined, 10, node)
    const monitor = {
      getDragEvent: jest.fn(),
      getOperation: jest.fn(() => 'move'),
      isCancelled: jest.fn(() => false),
    } as unknown as DragSourceMonitor

    lastSpec.begin!(monitor, {})
    await lastSpec.end!(undefined, monitor, {})

    expect(node.getController().fireEvent).toHaveBeenCalledWith(SELECTION_EVENT, ['test-node-id'])
  })

  test('end does not fire SELECTION_EVENT when node moved past threshold', async () => {
    const node = createMockNode()
    renderWrapped(undefined, 2, node)
    const monitor = {
      getDragEvent: jest.fn(),
      getOperation: jest.fn(() => 'move'),
      isCancelled: jest.fn(() => false),
    } as unknown as DragSourceMonitor

    lastSpec.begin!(monitor, {})
    lastSpec.drag!({ initialX: 0, initialY: 0, x: 5, y: 0, dx: 5, dy: 0 } as DragEvent, monitor, {})
    ;(node.getController().fireEvent as jest.Mock).mockClear()

    await lastSpec.end!(undefined, monitor, {})

    expect(node.getController().fireEvent).not.toHaveBeenCalledWith(SELECTION_EVENT, ['test-node-id'])
    expect(node.getController().fireEvent).toHaveBeenCalledWith(
      DRAG_NODE_END_EVENT,
      node,
      monitor.getDragEvent(),
      monitor.getOperation()
    )
  })

  test('wrapped component displayName mentions HOC', () => {
    Inner.displayName = 'InnerDisplay'
    const Wrapped = withDragNodeAfterThreshold()(Inner)
    expect(Wrapped.displayName).toBe('withDragNodeAfterThreshold(InnerDisplay)')
  })
})
