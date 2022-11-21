/* Copyright Contributors to the Open Cluster Management project */
import { Graph, ColaLayout, LayoutNode, NodeModel, ColaLayoutOptions, LayoutOptions } from '@patternfly/react-topology'
import get from 'lodash/get'
import chunk from 'lodash/chunk'
import uniqBy from 'lodash/uniqBy'

export interface TreeLayoutOptions {
    xSpacer: number
    ySpacer: number
    nodeWidth: number
    nodeHeight: number
    maxColumns?: number
    useCola?: boolean
    placeWith?: { parentType: string; childType: string }
    sortRowsBy?: string[]
    filterBy?: string[]
}

const TREE_LAYOUT_DEFAULTS: TreeLayoutOptions = {
    xSpacer: 70,
    ySpacer: 60,
    nodeWidth: 65,
    nodeHeight: 65,
    useCola: false,
}

interface LayoutNodeModel extends NodeModel {
    cycles: boolean
    incoming: LayoutNodeModel[]
    outgoing: LayoutNodeModel[]
}
interface NodeMapType {
    [key: string]: LayoutNodeModel
}
interface LinkMapType {
    [key: string]: any[]
}
interface RowType {
    row: LayoutNodeModel[]
    incomingRow?: RowType
    split?: boolean
}
interface ConnectedType {
    nodeMap: NodeMapType
    columns: number
    rows: RowType[]
    roots: LayoutNodeModel[]
    leaves: LayoutNodeModel[]
    width?: number
    height?: number
}
interface MetricsType {
    connected: ConnectedType[]
    unconnected: LayoutNodeModel[]
    sourceMap: LinkMapType
    targetMap: LinkMapType
    allNodeMap: NodeMapType
}

type NodeOffsetMapType = {
    [key: string]: { dx: number; dy: number }
}

class TreeLayout extends ColaLayout {
    protected treeOptions: TreeLayoutOptions

    constructor(graph: Graph, options?: Partial<ColaLayoutOptions & LayoutOptions & TreeLayoutOptions>) {
        super(graph, options)
        this.treeOptions = {
            ...TREE_LAYOUT_DEFAULTS,
            ...options,
        }
    }

    protected initializeNodePositions(nodes: LayoutNode[], graph: Graph): void {
        const { width, height } = graph.getBounds()
        const cx = width / 2
        const cy = height / 2
        const { nodeHeight, ySpacer } = this.treeOptions
        this.d3Cola.flowLayout('y', nodeHeight + ySpacer)

        nodes.forEach((node: LayoutNode) => {
            const { dx = 0, dy = 0 } = node.element.getData()
            node.setPosition(cx + dx, cy + dy)
            node.setFixed(true)
        })

        graph.fit(80)
    }

    protected startColaLayout(initialRun: boolean, addingNodes: boolean): void {
        if (this.treeOptions.useCola) {
            super.startColaLayout(initialRun, addingNodes)
        }
    }
}

////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////

export function calculateNodeOffsets(elements: { nodes: any[]; links: any[] }, options: TreeLayoutOptions) {
    const nodeOffsetMap: NodeOffsetMapType = {}
    let layout = 'TreeLayout'
    if (elements.nodes.length) {
        const metrics: MetricsType = groupNodesByConnections(elements)
        addRootsLeavesToConnectedGroups(metrics)
        sortConnectedGroupsIntoRows(metrics, options)
        const placeLast = addOffsetsToNodeMap(metrics, nodeOffsetMap, options)
        centerParentNodesWithTheirChilden(metrics, nodeOffsetMap)
        placePairedNodes(metrics, nodeOffsetMap, placeLast, options)
        if (placeLast.length > 0) {
            layout = 'ColaTreeLayout'
        }
    }
    return { nodeOffsetMap, layout }
}

function groupNodesByConnections(elements: { nodes: any[]; links: any[] }) {
    /////////////// Create some collections:
    const allNodeMap: NodeMapType = {}
    const { nodes, links } = elements
    nodes.forEach((node) => {
        allNodeMap[node.id] = node
    })
    const sourceMap: LinkMapType = {}
    const targetMap: LinkMapType = {}
    const anyConnectedSet = new Set()
    links
        .filter((link) => {
            // filter out edges that don't connect to both a source and a target node
            return link.source && link.target && allNodeMap[link.source] && allNodeMap[link.target]
        })
        .forEach((link) => {
            // all sources of this target
            let sources = sourceMap[link.target]
            if (!sources) {
                sources = sourceMap[link.target] = []
            }
            sources.push({ source: link.source, link })
            // all targets of this source
            let targets = targetMap[link.source]
            if (!targets) {
                targets = targetMap[link.source] = []
            }
            targets.push({ target: link.target, link })
            // anything that's connected
            anyConnectedSet.add(link.source)
            anyConnectedSet.add(link.target)
        })
    const directions = [
        { map: sourceMap, next: 'source', other: 'target' },
        { map: targetMap, next: 'target', other: 'source' },
    ]
    const connectedSet = new Set()
    // connected will be filled with groups of connected nodes
    const connected: ConnectedType[] = []
    // the remaining nodes
    const unconnected: any[] = []
    /////////////////////////// loop through the nodes adding to groups
    nodes.forEach((node) => {
        const { id } = node
        // if this node is connected to anything start a new group
        if (!connectedSet.has(id) && anyConnectedSet.has(id)) {
            const grp: ConnectedType = {
                nodeMap: {},
                columns: 1,
                roots: [],
                leaves: [],
                rows: [],
            }
            connected.push(grp)
            // then add everything connected to this node to this group
            gatherNodesByConnections(id, grp, directions, connectedSet, allNodeMap)
        } else if (!anyConnectedSet.has(id)) {
            // the rest are unconnected
            unconnected.push(node)
        }
    })
    return { connected, unconnected, sourceMap, targetMap, allNodeMap }
}

//////////////////////// reentrantly find all the nodes connected to that first node
function gatherNodesByConnections(
    id: string | number,
    grp: ConnectedType,
    directions: { map: any; next: any }[],
    connectedSet: Set<unknown>,
    allNodeMap: { [x: string]: any }
) {
    // already connected to another group??
    if (!connectedSet.has(id)) {
        connectedSet.add(id)

        // add this node to this group
        grp.nodeMap[id] = allNodeMap[id]

        // recurse up and down to get everything
        directions.forEach(({ map, next }) => {
            if (map[id]) {
                map[id].forEach((entry: { [x: string]: any; link?: any }) => {
                    const { link } = entry
                    const end = entry[next]
                    if (!connectedSet.has(end)) {
                        // reiterate until nothing else connected
                        gatherNodesByConnections(link[next], grp, directions, connectedSet, allNodeMap)
                    }
                })
            }
        })
    }
}

//////////////////////// Loop through connected groups adding roots and leaves
function addRootsLeavesToConnectedGroups(metrics: MetricsType) {
    const { connected, sourceMap, targetMap, allNodeMap } = metrics
    connected.forEach(({ nodeMap, roots, leaves }) => {
        Object.entries(nodeMap).forEach(([id, node]) => {
            node.incoming = uniqBy(
                (sourceMap[id] || []).map((link: { source: string | number }) => {
                    return allNodeMap[link.source]
                }),
                'id'
            )
            node.outgoing = uniqBy(
                (targetMap[id] || []).map((link: { target: string | number }) => {
                    return allNodeMap[link.target]
                }),
                'id'
            )
            if (node.incoming.length === 0) {
                roots.push(node)
            } else if (node.outgoing.length === 0) {
                leaves.push(node)
            }
        })
    })
}

/////////////////   Loop through each group creating rows (breadth first)
function sortConnectedGroupsIntoRows(metrics: MetricsType, options: TreeLayoutOptions) {
    const { connected } = metrics
    const { maxColumns = 16, sortRowsBy } = options
    connected.forEach((group) => {
        const { nodeMap, roots, rows } = group
        let groupIds = Object.keys(nodeMap)
        let lastRow: RowType = { row: [...roots] }
        let unchunkedLastRow
        do {
            const newRow: RowType = {
                row: [],
                incomingRow: lastRow,
            }
            // add all incoming nodes from last row to this one
            const set = new Set()
            ;(unchunkedLastRow || lastRow.row).forEach(({ id, outgoing }) => {
                set.add(id)
                newRow.row = [...newRow.row, ...outgoing]
            })
            rows.push(lastRow)

            // if this row has >1 columns
            if (newRow.row.length > 1) {
                // sort by incoming/outgoing row
                sortRowIntoRelatedNodes({
                    newRow,
                    sortRowsBy,
                    maxColumns,
                })

                // chunk it for real this time
                if (newRow.row.length > maxColumns) {
                    unchunkedLastRow = newRow.row
                    const chunks = chunk(newRow.row, (maxColumns * 5) / 6)
                    chunks.forEach((chunk) => {
                        const chunkRow: RowType = {
                            row: chunk,
                            incomingRow: lastRow,
                            split: true,
                        }
                        if (chunk.length > group.columns) {
                            group.columns = newRow.row.length
                        }
                        rows.push(chunkRow)
                    })
                    lastRow = rows.pop() as RowType
                } else {
                    if (newRow.row.length > group.columns) {
                        group.columns = newRow.row.length
                    }
                    lastRow = newRow
                    unchunkedLastRow = undefined
                }
            } else {
                lastRow = newRow
            }

            groupIds = groupIds.filter((id) => !set.has(id))

            // if all nodes used but outgoings aren't emtpy, mark them cycles
            if (!groupIds.length) {
                newRow.row.forEach(({ outgoing }) => {
                    outgoing.forEach((node) => {
                        node.cycles = true
                    })
                })
            }
        } while (groupIds.length)
    })
}

function sortRowIntoRelatedNodes(data: { newRow: RowType; sortRowsBy: string[] | undefined; maxColumns: number }) {
    const { newRow, sortRowsBy, maxColumns } = data
    const { incomingRow } = newRow
    if (!incomingRow) return

    // for incoming, sort nodes to fall under their parent node
    const segments: LayoutNodeModel[][] = []
    incomingRow.row.forEach(({ outgoing }) => {
        const row = outgoing

        // for outgoing, center nodes that have outgoing
        // 1) split into nodes that end and those that continue on
        const endsHere: LayoutNodeModel[] = []
        const continuesOn: LayoutNodeModel[] = []
        row.forEach((node) => {
            if (node.outgoing.length) {
                continuesOn.push(node)
            } else {
                endsHere.push(node)
            }
        })

        // 2) sort both section of nodes using 'sorRowsBy' option
        if (sortRowsBy) {
            ;[endsHere, continuesOn].forEach((arr) => {
                arr.sort((a: LayoutNodeModel, b: LayoutNodeModel) => {
                    let ret = 0
                    sortRowsBy.some((property) => {
                        const av = get(a, property)
                        const bv = get(b, property)
                        const at = typeof av
                        const bt = typeof bv
                        if (at === bt) {
                            switch (at) {
                                case 'string':
                                    ret = av.localeCompare(bv)
                                    break
                                case 'number':
                                    ret = av - bv
                                    break
                            }
                        } else if (av && !bv) {
                            ret = -1
                        } else if (!av && bv) {
                            ret = 1
                        }
                        return ret !== 0
                    })
                    return ret
                })
            })
        }

        // 3) reinsert continuesOn section into the middle of the row
        let inx = endsHere.length / 2
        if (newRow.row.length > maxColumns) {
            // if we're chunking it, what's the index of the middle of the last row
            const lr = chunk(newRow.row, (maxColumns * 5) / 6).pop()
            inx = lr ? endsHere.length - (lr.length - continuesOn.length) / 2 : inx
            if (inx < 0) inx = endsHere.length
        }
        endsHere.splice(inx, 0, ...continuesOn)
        segments.push(endsHere)
    })

    // recombine, w/o duplicating nodes
    const set = new Set()
    newRow.row = []
    segments.forEach((segment) => {
        segment.forEach((node) => {
            if (!set.has(node.id)) {
                newRow.row.push(node)
                set.add(node.id)
            }
        })
    })

    return { newRow }
}

///// assume center of group is at 0,0 then offset nodes from the center
// place paired nodes last
function addOffsetsToNodeMap(metrics: MetricsType, nodeOffsetMap: NodeOffsetMapType, options: TreeLayoutOptions) {
    const placeLast: any[] = []
    const { connected } = metrics
    const { xSpacer = 60, ySpacer = 60, nodeWidth = 65, nodeHeight = 65 } = options
    connected.forEach((group) => {
        const { rows, columns } = group
        group.height = rows.length * nodeHeight + (rows.length - 1) * ySpacer
        group.width = columns * nodeWidth + (columns - 1) * xSpacer
        let dy = -group.height / 2
        rows.forEach(({ row }) => {
            // filter out nodes that are placed last
            if (options?.placeWith) {
                row = row.filter((n) => {
                    if (options.placeWith && n.type === options.placeWith.childType) {
                        placeLast.push(n)
                        return false
                    }
                    return true
                })
            }

            const rowWidth = row.length * nodeWidth + (row.length - 1) * xSpacer
            const left = -rowWidth / 2
            row.forEach(({ id, incoming }, inx) => {
                let dx = left + (nodeWidth + xSpacer) * inx
                // if this node has only one incoming, and that incoming only has this one outgoing, line up nodes
                if (incoming.length === 1) {
                    if (incoming[0].outgoing.length === 1) {
                        ;({ dx } = nodeOffsetMap[incoming[0].id])
                    }
                }
                nodeOffsetMap[id] = { dx, dy }
            })
            dy += nodeHeight + ySpacer
        })
    })
    return placeLast
}

// center parent over its children if there are more children then parents
function centerParentNodesWithTheirChilden(metrics: MetricsType, nodeOffsetMap: NodeOffsetMapType) {
    const { connected } = metrics
    connected.forEach((group) => {
        const { rows } = group
        rows.reverse().forEach(({ row, incomingRow }) => {
            if (incomingRow && row.length > 1 && row.length >= incomingRow?.row.length) {
                incomingRow?.row.forEach(({ id, outgoing }) => {
                    if (outgoing.length) {
                        const mixDX = Math.min(
                            ...outgoing.map(({ id }) => {
                                return nodeOffsetMap[id] ? nodeOffsetMap[id].dx : Infinity
                            })
                        )
                        const maxDX = Math.max(
                            ...outgoing.map(({ id }) => {
                                return nodeOffsetMap[id] ? nodeOffsetMap[id].dx : -Infinity
                            })
                        )
                        nodeOffsetMap[id].dx = mixDX + (maxDX - mixDX) / 2
                    }
                })
            }
        })
    })
}

// place paired next to its parent
function placePairedNodes(
    metrics: MetricsType,
    nodeOffsetMap: NodeOffsetMapType,
    placeLast: any[],
    options: TreeLayoutOptions
) {
    const { allNodeMap } = metrics
    placeLast.forEach((child) => {
        const childLayout = allNodeMap[child.id]
        if (childLayout?.incoming.length > 0) {
            const { dx, dy } = nodeOffsetMap[childLayout?.incoming[0].id]
            nodeOffsetMap[child.id] = { dx: dx + options.xSpacer + options.nodeWidth, dy: dy + 20 }
        }
    })
}

export { TreeLayout }

// // eslint-disable-next-line @typescript-eslint/no-unused-vars
// protected getConstraints(nodes: ColaNode[], groups: ColaGroup[], edges: ColaLink[]): any[] {
//     return []
// }
// protected createLayoutNode(node: Node, nodeDistance: number, index: number) {
//     super.createLayoutNode()
//     return new ColaNode(node, nodeDistance, index)
// }
// protected createLayoutLink(edge: Edge, source: LayoutNode, target: LayoutNode): LayoutLink {
//     return new ColaLink(edge, source, target)
// }
// protected createLayoutGroup(node: Node, padding: number, index: number) {
//     return new ColaGroup(node, padding, index)
// }
// protected getFauxEdges(): LayoutLink[] {
//     return []
// }
// protected setupLayout(graph: Graph, nodes: LayoutNode[], edges: LayoutLink[], groups: LayoutGroup[]): void {
//     const { width, height } = graph.getBounds()
//     this.d3Cola.size([width, height])
//     // Get any custom constraints
//     this.d3Cola.constraints(this.getConstraints(nodes as ColaNode[], groups as ColaGroup[], edges))
//     this.d3Cola.nodes(nodes)
//     this.d3Cola.links(edges)
//     this.d3Cola.groups(groups)
// }

// TODO find bridges between big groupings
//   if this is a row of 1 node and that node has >1 outgoing and each has >1 outgoing
//           and rows.length >3
//           make a clone as the root of a new group and start over
//            add secondary line between them
