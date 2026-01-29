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

  // Create curved path segments using quadratic Bezier curves that arc upward
  const curveOffset = 25 // pixels to curve upward (negative Y direction)
  const allPoints = [startPoint, endPoint]
  let d = `M${startPoint.x} ${startPoint.y}`
  for (let i = 0; i < allPoints.length - 1; i++) {
    const from = allPoints[i]
    const to = allPoints[i + 1]
    const midX = (from.x + to.x) / 2
    const midY = (from.y + to.y) / 2 - curveOffset
    d += ` Q${midX} ${midY} ${to.x} ${to.y}`
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
