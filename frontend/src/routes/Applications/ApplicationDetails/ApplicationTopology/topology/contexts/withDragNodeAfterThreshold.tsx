/* Copyright Contributors to the Open Cluster Management project */
import { useContext, useRef, useMemo, type ComponentType, type FunctionComponent } from 'react'
import {
  action,
  observer,
  Controller,
  ElementContext,
  isNode,
  Node,
  useDndDrag,
  useDndManager,
  WithDragNodeProps,
  Modifiers,
  DragSourceSpec,
  DragEvent,
  DragObjectWithType,
  DragSpecOperationType,
  DragOperationWithType,
  DragSourceMonitor,
  DRAG_NODE_EVENT,
  DRAG_NODE_START_EVENT,
  DRAG_NODE_END_EVENT,
  DRAG_MOVE_OPERATION,
  SELECTION_EVENT,
} from '@patternfly/react-topology'

const defaultOperation = {
  [Modifiers.DEFAULT]: { type: DRAG_MOVE_OPERATION },
}

/** Ignore pointer movement until Chebyshev distance from drag start exceeds this many pixels. */
const DEFAULT_THRESHOLD_PX = 4

export const withDragNodeAfterThreshold =
  <
    DragObject extends DragObjectWithType = DragObjectWithType,
    DropResult = any,
    CollectedProps extends object = object,
    Props extends object = object,
  >(
    spec?: Omit<
      DragSourceSpec<DragObject, DragSpecOperationType<DragOperationWithType>, DropResult, CollectedProps, Props>,
      'item'
    > & {
      item?: DragObject
    },
    thresholdPx: number = DEFAULT_THRESHOLD_PX
  ) =>
  <P extends WithDragNodeProps & CollectedProps & Props>(WrappedComponent: ComponentType<P>) => {
    const Component: FunctionComponent<Omit<P, keyof WithDragNodeProps>> = (props) => {
      const element = useContext(ElementContext)
      if (!isNode(element)) {
        throw new Error('withDragNodeAfterThreshold must wrap a component used within the scope of a Node')
      }
      const elementRef = useRef(element)
      elementRef.current = element

      const activatedRef = useRef(false)
      const dndManager = useDndManager()

      const [dragNodeProps, dragNodeRef] = useDndDrag(
        useMemo(() => {
          const sourceSpec: DragSourceSpec<any, any, any, any, Props> = {
            item: (spec && spec.item) || { type: '#useDragNode#' },
            operation: (monitor: DragSourceMonitor, p: Props) => {
              if (spec) {
                const operation = typeof spec.operation === 'function' ? spec.operation(monitor, p) : spec.operation
                if (typeof operation === 'object' && Object.keys(operation).length > 0) {
                  return {
                    ...defaultOperation,
                    ...operation,
                  }
                }
              }
              return defaultOperation
            },
            begin: (monitor, p) => {
              activatedRef.current = false
              elementRef.current.raise()
              if (elementRef.current.isGroup()) {
                elementRef.current.getChildren().forEach((c) => {
                  c.raise()
                })
              }

              const result = spec && spec.begin && spec.begin(monitor, p)

              elementRef.current
                .getController()
                .fireEvent(DRAG_NODE_START_EVENT, elementRef.current, monitor.getDragEvent(), monitor.getOperation())

              return result || elementRef.current
            },
            drag: (event: DragEvent, monitor, p) => {
              const { initialX, initialY, x, y, dx, dy } = event
              if (Math.max(Math.abs(x - initialX), Math.abs(y - initialY)) <= thresholdPx) {
                return
              }

              function moveElement(e: Node, tx: number, ty: number) {
                let moved = true
                if (e.isGroup()) {
                  const nodeChildren = e.getChildren().filter(isNode)
                  if (nodeChildren.length) {
                    moved = false
                    nodeChildren.forEach((child) => moveElement(child, tx, ty))
                  }
                }
                if (moved) {
                  e.setPosition(e.getPosition().clone().translate(tx, ty))
                }
              }

              if (!activatedRef.current) {
                activatedRef.current = true
                moveElement(elementRef.current, x - initialX, y - initialY)
              } else {
                moveElement(elementRef.current, dx, dy)
              }

              if (spec?.drag) {
                spec.drag(event, monitor, p)
              }

              elementRef.current
                .getController()
                .fireEvent(DRAG_NODE_EVENT, elementRef.current, event, monitor.getOperation())
            },
            canDrag: spec ? spec.canDrag : undefined,
            end: async (dropResult, monitor, p) => {
              const didMovePastThreshold = activatedRef.current
              activatedRef.current = false
              let controller: Controller
              try {
                controller = elementRef.current.getController()
              } catch {
                return
              }

              if (spec && spec.end) {
                try {
                  await spec.end(dropResult, monitor, p)
                } catch {
                  dndManager.cancel()
                }
              }

              action(() => {
                controller.fireEvent(
                  DRAG_NODE_END_EVENT,
                  elementRef.current,
                  monitor.getDragEvent(),
                  monitor.getOperation()
                )
              })()

              // d3 drag prevents the native click; treat sub-threshold gesture as a click for selection.
              if (!didMovePastThreshold && !monitor.isCancelled()) {
                controller.fireEvent(SELECTION_EVENT, [elementRef.current.getId()])
              }
            },
            collect: spec ? spec.collect : undefined,
            canCancel: spec ? spec.canCancel : true,
          }
          return sourceSpec
        }, [dndManager]),
        props as any
      )
      return <WrappedComponent {...(props as any)} dragNodeRef={dragNodeRef} {...dragNodeProps} />
    }
    Component.displayName = `withDragNodeAfterThreshold(${WrappedComponent.displayName || WrappedComponent.name})`
    return observer(Component)
  }
