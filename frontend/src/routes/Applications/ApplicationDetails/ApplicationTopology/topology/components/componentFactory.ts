/* Copyright Contributors to the Open Cluster Management project */
import { ComponentType } from 'react'
import {
    ModelKind,
    withPanZoom,
    GraphComponent,
    GraphElement,
    ComponentFactory,
    withDragNode,
    DefaultEdge,
    nodeDragSourceSpec,
    withSelection,
} from '@patternfly/react-topology'
import StyledNode from './StyledNode'

const defaultComponentFactory: ComponentFactory = (
    kind: ModelKind
): ComponentType<{ element: GraphElement }> | undefined => {
    switch (kind) {
        case ModelKind.graph:
            return withPanZoom()(GraphComponent)
        case ModelKind.node:
            return withDragNode(nodeDragSourceSpec('node', true, true))(withSelection()(StyledNode))
        case ModelKind.edge:
            return DefaultEdge
        /* istanbul ignore next */
        default:
            return undefined
    }
}

export default defaultComponentFactory
