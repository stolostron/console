/* Copyright Contributors to the Open Cluster Management project */
import * as React from 'react'
import {
    DEFAULT_LAYER,
    Layer,
    Node,
    observer,
    TOP_LAYER,
    useHover,
    WithContextMenuProps,
    WithCreateConnectorProps,
    WithDragNodeProps,
    WithSelectionProps,
} from '@patternfly/react-topology'

// topology 4.85
import Ellipse from './future/Ellipse'
import DefaultNode from './future/DefaultNode'
import Decorator from './future/Decorator'
import { getDefaultShapeDecoratorCenter, ShapeProps } from './future/shapeUtils'
import { TopologyQuadrant } from './future/types'
const DEFAULT_DECORATOR_RADIUS = 12

import { SVGIconProps } from '@patternfly/react-icons/dist/esm/createIcon'

import MultiEllipse from './MultiEllipse'

type StyledNodeProps = {
    element: Node
    getCustomShape?: (node: Node) => React.FunctionComponent<ShapeProps>
    getShapeDecoratorCenter?: (quadrant: TopologyQuadrant, node: Node) => { x: number; y: number }
    showLabel?: boolean // Defaults to true
    labelIcon?: React.ComponentClass<SVGIconProps>
    showStatusDecorator?: boolean // Defaults to false
    regrouping?: boolean
    dragging?: boolean
} & WithContextMenuProps &
    WithCreateConnectorProps &
    WithDragNodeProps &
    WithSelectionProps

const StyledNode: React.FunctionComponent<StyledNodeProps> = ({
    element,
    onContextMenu,
    contextMenuOpen,
    dragging,
    regrouping,
    ...rest
}) => {
    const data = element.getData()
    const [hover, hoverRef] = useHover()

    const passedData = React.useMemo(() => {
        const newData = { ...data }
        Object.keys(newData).forEach((key) => {
            if (newData[key] === undefined) {
                delete newData[key]
            }
        })
        return newData
    }, [data])

    const LabelIcon = passedData.labelIcon
    const { width, height } = element.getDimensions()
    return (
        <Layer id={hover ? TOP_LAYER : DEFAULT_LAYER}>
            <g
                ref={(r) => {
                    r && hoverRef(r)
                }}
            >
                <DefaultNode
                    element={element}
                    nodeStatus={data.status}
                    {...rest}
                    {...passedData}
                    getCustomShape={() => (passedData?.specs?.resourceCount > 1 ? MultiEllipse : Ellipse)}
                    dragging={dragging}
                    regrouping={regrouping}
                    onContextMenu={data.showContextMenu ? onContextMenu : undefined}
                    contextMenuOpen={contextMenuOpen}
                    labelIcon={LabelIcon && <LabelIcon noVerticalAlign />}
                    attachments={renderDecorators(element, passedData, rest.getShapeDecoratorCenter)}
                >
                    <use href={`#nodeIcon_${data.shape}`} width={width} height={height} />
                </DefaultNode>
            </g>
        </Layer>
    )
}

const renderDecorators = (
    element: Node,
    data: {
        statusIcon?: { icon: string; classType: string; width: number; height: number }
        specs?: any
    },
    getShapeDecoratorCenter?: (
        quadrant: TopologyQuadrant,
        node: Node
    ) => {
        x: number
        y: number
    }
): React.ReactNode => {
    const { statusIcon, specs } = data
    return (
        <>
            {statusIcon &&
                renderStatusDecorator(element, TopologyQuadrant.upperLeft, statusIcon, getShapeDecoratorCenter)}
            {specs?.resourceCount > 1 && renderCountDecorator(element, specs?.resourceCount)}
        </>
    )
}

const renderStatusDecorator = (
    element: Node,
    quadrant: TopologyQuadrant,
    statusIcon: { icon: string; classType: string; width: number; height: number },
    getShapeDecoratorCenter?: (
        quadrant: TopologyQuadrant,
        node: Node,
        radius?: number
    ) => {
        x: number
        y: number
    }
): React.ReactNode => {
    const { x, y } = getShapeDecoratorCenter
        ? getShapeDecoratorCenter(quadrant, element)
        : getDefaultShapeDecoratorCenter(quadrant, element)
    const { icon, classType, width, height } = statusIcon
    const use = <use href={`#nodeStatusIcon_${icon}`} width={width} height={height} className={classType} />
    return <Decorator x={x} y={y} radius={DEFAULT_DECORATOR_RADIUS} showBackground icon={use} />
}

const renderCountDecorator = (element: Node, resourceCount: number): React.ReactNode => {
    const { width, height } = element.getDimensions()
    const x = width
    const y = height / 2

    return (
        <g className="pf-topology__node__decorator">
            <g transform={`translate(${x}, ${y})`}>
                <g transform={`translate(-16, -12)`}>
                    <use href={'#nodeStatusIcon_clusterCount'} width={32} height={24} className={'resourceCountIcon'} />
                </g>
                <g transform={`translate(0, 1)`}>
                    <text
                        text-anchor="middle"
                        pointer-events="none"
                        dominant-baseline="middle"
                        style={{ fontWeight: 'bold' }}
                        className={'resourceCountIcon'}
                    >
                        {resourceCount}
                    </text>
                </g>
            </g>
        </g>
    )
}

export default observer(StyledNode)
