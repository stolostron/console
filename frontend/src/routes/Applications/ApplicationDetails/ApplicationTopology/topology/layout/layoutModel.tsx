/* Copyright Contributors to the Open Cluster Management project */
import { Model, NodeModel, EdgeModel } from '@patternfly/react-topology'
import { getNodeStyle, NODE_WIDTH, NODE_HEIGHT, X_SPACER, Y_SPACER } from '../components/nodeStyle'
import { calculateNodeOffsets } from './TreeLayout'

const getLayoutModel = (elements: { nodes: any[]; links: any[] }): Model => {
    // create nodes from data
    const { nodeOffsetMap, layout } = calculateNodeOffsets(elements, {
        maxColumns: 16,
        xSpacer: X_SPACER,
        ySpacer: Y_SPACER,
        nodeWidth: NODE_WIDTH,
        nodeHeight: NODE_HEIGHT,
        placeWith: { parentType: 'subscription', childType: 'placements' },
        sortRowsBy: ['type', 'name'],
    })
    const nodes: NodeModel[] = elements.nodes.map((d) => {
        const data = getNodeStyle(d, nodeOffsetMap[d.id])
        return {
            id: d.id,
            type: 'node',
            data,
            width: NODE_WIDTH,
            height: NODE_HEIGHT,
            label: data.label,
            status: data.status,
        }
    })

    // create links from data
    const edges = elements.links.map(
        (d): EdgeModel => ({
            data: d,
            source: d.source,
            target: d.target,
            id: `${d.source}_${d.target}`,
            type: 'edge',
        })
    )

    // create topology model
    const model: Model = {
        graph: {
            id: 'graph',
            type: 'graph',
            layout,
        },
        nodes,
        edges,
    }

    return model
}

export default getLayoutModel
