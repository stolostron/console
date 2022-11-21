/* Copyright Contributors to the Open Cluster Management project */
import * as React from 'react'
import {
    Decorator,
    DEFAULT_DECORATOR_RADIUS,
    DEFAULT_LAYER,
    DefaultNode,
    getDefaultShapeDecoratorCenter,
    Layer,
    Node,
    observer,
    ScaleDetailsLevel,
    ShapeProps,
    TOP_LAYER,
    TopologyQuadrant,
    useHover,
    WithContextMenuProps,
    WithCreateConnectorProps,
    WithDragNodeProps,
    WithSelectionProps,
    Ellipse,
} from '@patternfly/react-topology'

import useDetailsLevel from '@patternfly/react-topology/dist/esm/hooks/useDetailsLevel'

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
    showLabel,
    dragging,
    regrouping,
    onShowCreateConnector,
    onHideCreateConnector,
    ...rest
}) => {
    const data = element.getData()
    const detailsLevel = useDetailsLevel()
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

    React.useEffect(() => {
        if (detailsLevel === ScaleDetailsLevel.low) {
            onHideCreateConnector && onHideCreateConnector()
        }
    }, [detailsLevel, onHideCreateConnector])

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
                    scaleLabel={detailsLevel !== ScaleDetailsLevel.high}
                    scaleNode={hover && detailsLevel === ScaleDetailsLevel.low}
                    {...rest}
                    {...passedData}
                    getCustomShape={() => (passedData?.specs?.resourceCount > 1 ? MultiEllipse : Ellipse)}
                    dragging={dragging}
                    regrouping={regrouping}
                    showLabel={hover || (detailsLevel === ScaleDetailsLevel.high && showLabel)}
                    showStatusBackground={!hover && detailsLevel === ScaleDetailsLevel.low}
                    showStatusDecorator={detailsLevel === ScaleDetailsLevel.high && passedData.showStatusDecorator}
                    onContextMenu={data.showContextMenu ? onContextMenu : undefined}
                    contextMenuOpen={contextMenuOpen}
                    onShowCreateConnector={detailsLevel !== ScaleDetailsLevel.low ? onShowCreateConnector : undefined}
                    onHideCreateConnector={onHideCreateConnector}
                    labelIcon={LabelIcon && <LabelIcon noVerticalAlign />}
                    attachments={
                        detailsLevel !== ScaleDetailsLevel.low &&
                        renderDecorators(element, passedData, rest.getShapeDecoratorCenter)
                    }
                >
                    {detailsLevel !== ScaleDetailsLevel.low && (
                        <use href={`#nodeIcon_${data.shape}`} width={width} height={height} />
                    )}
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
