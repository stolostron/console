/* Copyright Contributors to the Open Cluster Management project */
import * as React from 'react'
import { observer } from 'mobx-react'
import {
  Edge,
  Layer,
  Point,
  useBendpoint,
  WithRemoveConnectorProps,
  WithSourceDragProps,
  WithTargetDragProps,
} from '@patternfly/react-topology'
import EdgeConnectorSquare from './EdgeConnectorSquare'

type EdgeProps = {
  element: Edge
  dragging?: boolean
} & WithSourceDragProps &
  WithTargetDragProps &
  WithRemoveConnectorProps

interface BendpointProps {
  point: Point
}

const Bendpoint: React.FunctionComponent<BendpointProps> = observer(({ point }) => {
  const [hover, setHover] = React.useState(false)
  const [, ref] = useBendpoint(point)
  return (
    <circle
      ref={ref}
      cx={point.x}
      cy={point.y}
      r={5}
      fill="lightblue"
      fillOpacity={hover ? 0.8 : 0}
      onMouseOver={() => setHover(true)}
      onMouseOut={() => setHover(false)}
    />
  )
})

const StyledEdge: React.FunctionComponent<EdgeProps> = ({
  element,
  sourceDragRef,
  dragging,
  onShowRemoveConnector,
  onHideRemoveConnector,
}) => {
  const startPoint = element.getStartPoint()
  const endPoint = element.getEndPoint()
  const bendpoints = element.getBendpoints()

  // Create curved path segments using quadratic Bezier curves that arc upward
  const curveOffset = 25 // pixels to curve upward (negative Y direction)
  const allPoints = [startPoint, ...bendpoints, endPoint]
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
        <EdgeConnectorSquare dragRef={sourceDragRef} edge={element} />
        <path
          strokeWidth={1}
          stroke={edgeColor}
          d={d}
          fill="none"
          markerEnd={`url(#${markerId})`}
          onMouseEnter={onShowRemoveConnector}
          onMouseLeave={onHideRemoveConnector}
        />
        {sourceDragRef && <circle ref={sourceDragRef} r={8} cx={startPoint.x} cy={startPoint.y} fillOpacity={0} />}
      </Layer>
      {bendpoints && bendpoints.map((p, i) => <Bendpoint point={p} key={i.toString()} />)}
    </>
  )
}

export default observer(StyledEdge)
