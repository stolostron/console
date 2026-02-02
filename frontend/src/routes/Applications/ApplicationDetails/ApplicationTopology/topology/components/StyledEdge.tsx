/* Copyright Contributors to the Open Cluster Management project */
import * as React from 'react'
import { css } from '@emotion/css'
import {
  Edge,
  Layer,
  WithRemoveConnectorProps,
  WithSourceDragProps,
  WithTargetDragProps,
  observer,
  DefaultConnectorTerminal,
  EdgeTerminalType,
} from '@patternfly/react-topology'

type EdgeProps = {
  element: Edge
  dragging?: boolean
} & WithSourceDragProps &
  WithTargetDragProps &
  WithRemoveConnectorProps

const StyledEdge: React.FunctionComponent<EdgeProps> = ({ element, dragging }) => {
  const startPoint = element.getStartPoint()
  const endPoint = element.getEndPoint()

  // Create path: straight line if horizontally aligned, otherwise curved
  const horizontalDistance = Math.abs(endPoint.y - startPoint.y)
  let d: string

  if (horizontalDistance <= 50) {
    // Use straight line when target is within 50px vertically of source
    d = `M${startPoint.x} ${startPoint.y} L${endPoint.x} ${endPoint.y}`
  } else {
    // Use quadratic Bezier curve with gradual offset based on vertical distance
    const verticalDelta = endPoint.y - startPoint.y
    // Scale curve offset proportionally to vertical distance
    // Positive delta (target below) curves up (negative offset), negative delta curves down
    const maxCurveOffset = 50
    const curveScale = Math.min(Math.abs(verticalDelta) / 200, 1) // Normalize to max at 200px distance
    const curveOffset = -Math.sign(verticalDelta) * maxCurveOffset * curveScale
    const midX = (startPoint.x + endPoint.x) / 2
    const midY = (startPoint.y + endPoint.y) / 2 + curveOffset
    d = `M${startPoint.x} ${startPoint.y} Q${midX} ${midY} ${endPoint.x} ${endPoint.y}`
  }

  const edgeColor = (element.getData() && element.getData().color) || '#808080'
  const markerId = `arrowhead-${element.getId()}`

  const solidSquareClass = css`
    & rect {
      fill: ${edgeColor};
      stroke: ${edgeColor};
    }
  `

  return (
    <>
      <defs>
        <marker
          id={markerId}
          markerWidth="15"
          markerHeight="10.5"
          refX="13.5"
          refY="5.25"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <polygon points="0 0, 15 5.25, 0 10.5" fill={edgeColor} />
        </marker>
      </defs>
      <Layer id={dragging ? 'top' : undefined}>
        <DefaultConnectorTerminal
          className={solidSquareClass}
          isTarget={false}
          edge={element}
          size={4}
          terminalType={EdgeTerminalType.square}
        />
        <path strokeWidth={1} stroke={edgeColor} d={d} fill="none" markerEnd={`url(#${markerId})`} />
      </Layer>
    </>
  )
}

export default observer(StyledEdge)
