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

//export type ComponentFactory = (kind: ModelKind, type: string) => ComponentType<{ element: GraphElement }> | undefined;

const defaultComponentFactory: ComponentFactory = (
    kind: ModelKind
): ComponentType<{ element: GraphElement }> | undefined => {
    //const defaultComponentFactory: ComponentFactory = (kind: ModelKind): ComponentType<BaseEdge> | undefined => {
    switch (kind) {
        case ModelKind.graph:
            return withPanZoom()(GraphComponent)
        case ModelKind.node:
            return withDragNode(nodeDragSourceSpec('node', true, true))(withSelection()(StyledNode))
        case ModelKind.edge:
            return DefaultEdge
        default:
            return undefined
    }
}

export default defaultComponentFactory

//return withDragNode({ canCancel: false })(withSelection()(withContextMenu(() => defaultMenu)(Node)))

// const contextMenuItem = (label: string, i: number): React.ReactElement => {
//     if (label === '-') {
//         return <ContextMenuSeparator key={`separator:${i.toString()}`} />
//     }
//     if (label.includes('->')) {
//         const parent = label.slice(0, label.indexOf('->'))
//         const children = label.slice(label.indexOf('->') + 2).split(',')

//         return (
//             <ContextSubMenuItem label={parent} key={parent}>
//                 {children.map((child, j) => contextMenuItem(child.trim(), j))}
//             </ContextSubMenuItem>
//         )
//     }
//     return (
//         // eslint-disable-next-line no-alert
//         <ContextMenuItem key={label} onClick={() => alert(`Selected: ${label}`)}>
//             {label}
//         </ContextMenuItem>
//     )
// }

// const createContextMenuItems = (...labels: string[]): React.ReactElement[] => labels.map(contextMenuItem)

// const defaultMenu = createContextMenuItems(
//     'First',
//     'Second',
//     'Third',
//     '-',
//     'Fourth',
//     'Sub Menu-> Child1, Child2, Child3, -, Child4'
// )
