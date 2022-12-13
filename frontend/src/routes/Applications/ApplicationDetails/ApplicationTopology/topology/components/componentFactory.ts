/* Copyright Contributors to the Open Cluster Management project */
import { ComponentType } from 'react'
import {
    ModelKind,
    withPanZoom,
    GraphComponent,
    GraphElement,
    ComponentFactory,
    withDragNode,
    withSelection,
} from '@patternfly/react-topology'

import StyledNode from './StyledNode'
import StyledEdge from './StyledEdge'

const defaultComponentFactory: ComponentFactory = (
    kind: ModelKind
): ComponentType<{ element: GraphElement }> | undefined => {
    switch (kind) {
        case ModelKind.graph:
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore: Fixed in next pf topology
            return withPanZoom()(GraphComponent)
        case ModelKind.node:
            // 4.86 return withDragNode(nodeDragSourceSpec('node', true, true))(withSelection()(StyledNode))
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore: Fixed in next pf topology
            return withDragNode()(withSelection()(StyledNode))
        case ModelKind.edge:
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore: Fixed in next pf topology
            return StyledEdge
        /* istanbul ignore next */
        default:
            return undefined
    }
}

export default defaultComponentFactory
