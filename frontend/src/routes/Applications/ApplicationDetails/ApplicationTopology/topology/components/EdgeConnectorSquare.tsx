import * as React from 'react'
import { observer } from 'mobx-react'
import last from 'lodash/last'
import head from 'lodash/head'
import reduce from 'lodash/reduce'
import { Edge, Point, ConnectDragSource } from '@patternfly/react-topology'

interface ConnectorSquareProps {
    startPoint: Point
    endPoint: Point
    className?: string
    isTarget?: boolean
    size?: number
    dragRef?: ConnectDragSource
}

const pointsStringFromPoints = (points: [number, number][]): string =>
    reduce(points, (result: string, nextPoint: [number, number]) => `${result} ${nextPoint[0]},${nextPoint[1]}`, '')

const ConnectorSquare: React.FC<ConnectorSquareProps> = ({
    startPoint,
    endPoint,
    isTarget = true,
    size = 4,
    dragRef,
}) => {
    if (!startPoint || !endPoint) {
        return null
    }
    const arrowEndPoint: [number, number] = isTarget ? [endPoint.x, endPoint.y] : [startPoint.x, startPoint.y]
    const prevPoint: [number, number] = isTarget ? [startPoint.x, startPoint.y] : [endPoint.x, endPoint.y]

    const length = Math.sqrt((arrowEndPoint[0] - prevPoint[0]) ** 2 + (arrowEndPoint[1] - prevPoint[1]) ** 2)
    if (!length) {
        return null
    }

    const ratio = (length - size) / length
    const arrowStartPoint: [number, number] = [
        prevPoint[0] + (arrowEndPoint[0] - prevPoint[0]) * ratio,
        prevPoint[1] + (arrowEndPoint[1] - prevPoint[1]) * ratio,
    ]
    const padding = Math.max(size, 4)
    const deltaY = padding / 2
    const boundingBox: [number, number][] = [
        [0, -deltaY],
        [padding, -deltaY],
        [padding, deltaY],
        [0, deltaY],
    ]

    const angleDeg =
        180 - (Math.atan2(arrowEndPoint[1] - prevPoint[1], prevPoint[0] - arrowEndPoint[0]) * 180) / Math.PI

    return (
        <g
            transform={`translate(${arrowStartPoint[0]}, ${arrowStartPoint[1]}) rotate(${angleDeg})`}
            ref={dragRef}
            className={'pf-topology-connector-arrow'}
        >
            <polygon points={pointsStringFromPoints(boundingBox)} />
        </g>
    )
}

interface EdgeConnectorSquareProps {
    edge: Edge
    className?: string
    isSource?: boolean
    size?: number
    dragRef?: ConnectDragSource
}

const EdgeConnectorSquare: React.FC<EdgeConnectorSquareProps> = ({ edge, isSource = true, ...others }) => {
    const bendPoints = edge.getBendpoints()
    const startPoint = isSource ? head(bendPoints) || edge.getEndPoint() : last(bendPoints) || edge.getStartPoint()
    const endPoint = isSource ? edge.getStartPoint() : edge.getEndPoint()
    return <ConnectorSquare startPoint={startPoint} endPoint={endPoint} {...others} />
}

export default observer(EdgeConnectorSquare)
