/** *****************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2018, 2019. All Rights Reserved.
 *
 * Note to U.S. Government Users Restricted Rights:
 * Use, duplication or disclosure restricted by GSA ADP Schedule
 * Contract with IBM Corp.
 ****************************************************************************** */
// Copyright (c) 2020 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
'use strict'

import React from 'react'
import PropTypes from 'prop-types'
import * as d3 from 'd3'
import { Spinner } from '@patternfly/react-core'
import DetailsView from './DetailsView'
import LegendView from './LegendView'
import Zoom from './Zoom'
import ChannelControl from './ChannelControl'
import LayoutHelper from './helpers/layoutHelper'
import ZoomHelper from './helpers/zoomHelper'
import TitleHelper from './helpers/titleHelper'
import LinkHelper, { defineLinkMarkers } from './helpers/linkHelper'
import NodeHelper, { showMatches, setSelections } from './helpers/nodeHelper'
import * as c from './constants.js'
import '../css/topology-link.css'
import '../css/topology-node.css'
import '../css/topology-icons.css'
import _ from 'lodash'

class DiagramViewer extends React.Component {
    static propTypes = {
        activeFilters: PropTypes.object,
        argoAppDetailsContainerControl: PropTypes.shape({
            argoAppDetailsContainerData: PropTypes.object,
            handleArgoAppDetailsContainerUpdate: PropTypes.func,
            handleErrorMsg: PropTypes.func,
        }),
        availableFilters: PropTypes.object,
        channelControl: PropTypes.object,
        handleLegendClose: PropTypes.func,
        handleNodeSelected: PropTypes.func,
        isReloading: PropTypes.bool,
        links: PropTypes.array,
        t: PropTypes.func,
        nodes: PropTypes.array,
        processActionLink: PropTypes.func,
        searchName: PropTypes.string,
        secondaryLoad: PropTypes.bool,
        selectedNode: PropTypes.object,
        setViewer: PropTypes.func,
        showChannelsControl: PropTypes.bool,
        showLegendView: PropTypes.bool,
        staticResourceData: PropTypes.object,
        title: PropTypes.string,
    }

    constructor(props) {
        super(props)
        this.state = {
            links: _.uniqBy(props.links, 'uid'),
            nodes: _.uniqBy(props.nodes, 'uid'),
            hiddenLinks: new Set(),
            selectedNodeId: props.selectedNode ? props.selectedNode.uid : '',
            showDetailsView: null,
            observer: new ResizeObserver(()=>{
                this.getZoomHelper().zoomFit(true, false)
            }),
            clusterDetailsContainerData: {
                page: 1,
                startIdx: 0,
                clusterSearchToggle: false,
                isSelectOpen: false,
                expandSectionToggleMap: new Set(),
                clusterID: undefined,
                selected: undefined,
                selectedClusterList: [],
            },
        }
        if (props.setViewer) {
            props.setViewer(this)
        }
        this.titles = []
        this.layoutHelper = new LayoutHelper(this.props.staticResourceData, this.titles, this.props.t)
        this.diagramOptions = this.props.staticResourceData.diagramOptions || {}
        this.zoomHelper = new ZoomHelper(this, this.diagramOptions, !props.title)
        this.getLayoutNodes = this.getLayoutNodes.bind(this)
        this.getZoomHelper = this.getZoomHelper.bind(this)
        this.getViewContainer = this.getViewContainer.bind(this)
        this.handleNodeClick = this.handleNodeClick.bind(this)
        this.showsShapeTitles = typeof this.props.staticResourceData.getNodeTitle === 'function'
        this.lastLayoutBBox = null
        this.isDragging = false
        this.lastRefreshing = true
        this.detailsViewUpdate = false
        this.handleClusterDetailsContainerUpdate = this.handleClusterDetailsContainerUpdate.bind(this)
    }

    componentDidMount() {
        this.zoomHelper.mountViewer()
        this.generateDiagram()
    }

    componentDidUpdate() {
        const { secondaryLoad } = this.props

        if (!this.detailsViewUpdate && !this.props.showLegendView) {
            this.generateDiagram(secondaryLoad)
        }
        this.detailsViewUpdate = false
    }

    componentWillUnmount() {
        this.zoomHelper.dismountViewer()
        this.destroyDiagram()
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (
            this.state.selectedNodeId !== nextState.selectedNodeId ||
            this.props.showLegendView !== nextProps.showLegendView ||
            !_.isEqual(this.state.nodes, nextState.nodes) ||
            !_.isEqual(
                this.state.links.map((l) => l.uid),
                nextState.links.map((l) => l.uid)
            ) ||
            !_.isEqual(this.state.hiddenLinks, nextState.hiddenLinks) ||
            !_.isEqual(this.props.activeFilters, nextProps.activeFilters) ||
            this.props.searchName !== nextProps.searchName ||
            this.props.secondaryLoad !== nextProps.secondaryLoad ||
            (this.props.isReloading && !nextProps.isReloading)
        )
    }

    UNSAFE_componentWillReceiveProps() {
        this.setState((prevState, props) => {
            // reuse existing states for the same node
            const prevStateNodeMap = _.keyBy(prevState.nodes, 'uid')
            const nodes = props.nodes.map((node) => {
                const pnode = prevStateNodeMap[node.uid] || Object.assign(node, { layout: {} })
                pnode.specs = node.specs
                return pnode
            })

            // if the source/target are still there but link is gone, remember it as a hidden link
            // however if source or target are gone, don't remember it at all
            const nodeMap = _.keyBy(nodes, 'uid')
            const hiddenLinks = new Set()
            const currentLinks = _.uniqBy(props.links, 'uid').filter((link) => {
                const { source, target } = link
                if (!nodeMap[source] || !nodeMap[target]) {
                    return false
                }
                return true
            })
            const currentLinkMap = _.keyBy(currentLinks, 'uid')
            const previousLinks = prevState.links.filter((link) => {
                const { source, target } = link
                if (!nodeMap[source] || !nodeMap[target]) {
                    return false
                } else if (!currentLinkMap[link.uid]) {
                    // only links between kube objects can be hidden
                    if (!nodeMap[source].isDesign) {
                        hiddenLinks.add(link.uid)
                    } else {
                        return false
                    }
                }
                return true
            })

            // combine current and remaining previous links
            const compare = (a, b) => {
                return a.uid === b.uid
            }
            const links = _.unionWith(previousLinks, currentLinks, compare)

            // switching between search and not
            const { searchName = '' } = props
            const searchChanged = searchName.localeCompare(prevState.searchName || '') !== 0

            let { showDetailsView, selectedNodeId } = prevState
            if (props.secondaryLoad) {
                selectedNodeId = ''
                showDetailsView = false
            }
            if (props.showLegendView) {
                selectedNodeId = ''
                showDetailsView = false
            }
            return {
                links,
                nodes,
                hiddenLinks,
                searchName,
                searchChanged,
                showDetailsView,
                selectedNodeId,
            }
        })
    }

    setViewerContainerContainerRef = (ref) => {
        this.viewerContainerContainerRef = ref
        if (ref) {
            this.state.observer.observe(ref)
        }
    }
    setViewerContainerRef = (ref) => {
        this.viewerContainerRef = ref
    }
    setLayoutLoadingRef = (ref) => {
        this.layoutLoadingRef = ref
    }
    getZoomHelper = () => {
        return this.zoomHelper
    }
    getViewContainer = () => {
        return this.viewerContainerContainerRef
    }
    setContainerRef = (ref) => {
        if (ref) {
            this.containerRef = ref
            this.handleMouseFunc = this.handleMouse.bind(this)
            this.containerRef.parentNode.addEventListener('wheel', this.handleMouseFunc, true)
        } else if (this.containerRef) {
            this.containerRef.parentNode.removeEventListener('wheel', this.handleMouseFunc, true)
            delete this.containerRef
        }
    }

    // when use scrolls mouse wheel, don't zoom diagram UNLESS in expanded mode
    handleMouse(e) {
        if (this.diagramOptions.scrollOnScroll) {
            e.stopPropagation()
        }
    }

    render() {
        const {
            staticResourceData,
            secondaryLoad,
            processActionLink,
            title,
            channelControl,
            showChannelsControl,
            showLegendView,
            handleLegendClose,
            nodes,
            activeFilters,
            argoAppDetailsContainerControl,
        } = this.props

        const { selectedNodeId, showDetailsView, clusterDetailsContainerData } = this.state
        const currentNode = nodes.find((n) => n.uid === selectedNodeId) || {}
        const { layout = {} } = currentNode
        const selectedResourceType = layout.type || currentNode.type
        const validNodeSelected = selectedResourceType && showDetailsView
        const clusterDetailsContainerControl = {
            clusterDetailsContainerData,
            handleClusterDetailsContainerUpdate: this.handleClusterDetailsContainerUpdate,
        }
        const pointerEventStyle = secondaryLoad ? { pointerEvents: 'none' } : {}

        return (
            <div className="diagramViewerDiagram" ref={this.setContainerRef}>
                {title && <div className="diagramTitle">{title}</div>}
                <div
                    className="diagramViewerContainerContainer"
                    id="diagram-viewer-container-container"
                    ref={this.setViewerContainerContainerRef}
                >
                    <div
                        className="diagramViewerContainer"
                        ref={this.setViewerContainerRef}
                        style={{ height: '100%', width: '100%' }}
                        role="region"
                        aria-label="zoom"
                    >
                        <svg id={c.DIAGRAM_SVG_ID} className="topologyDiagram" style={pointerEventStyle} />
                    </div>
                    {secondaryLoad && (
                        <div className="secondaryLoad">
                            <Spinner />
                        </div>
                    )}
                    <div className="layoutLoadingContainer" ref={this.setLayoutLoadingRef}>
                        <Spinner />
                    </div>
                </div>
                <span className="diagramControls">
                    {showChannelsControl && <ChannelControl channelControl={channelControl} t={this.props.t} />}
                    <Zoom getZoomHelper={this.getZoomHelper} getViewContainer={this.getViewContainer} t={this.props.t}/>
                </span>
                {validNodeSelected && (
                    <DetailsView
                        onClose={this.handleDetailsClose}
                        staticResourceData={staticResourceData}
                        getLayoutNodes={this.getLayoutNodes}
                        selectedNodeId={selectedNodeId}
                        getViewContainer={this.getViewContainer}
                        processActionLink={processActionLink}
                        nodes={nodes}
                        clusterDetailsContainerControl={clusterDetailsContainerControl}
                        argoAppDetailsContainerControl={argoAppDetailsContainerControl}
                        activeFilters={activeFilters}
                        t={this.props.t}
                    />
                )}
                {showLegendView && <LegendView t={this.props.t} onClose={handleLegendClose} />}
            </div>
        )
    }

    handleNodeClick = (evt) => {
        evt.stopPropagation()
        const node = d3.select(evt.target).datum()

        // clear any currently selected nodes
        const svg = d3.select(`#${c.DIAGRAM_SVG_ID}`)
        if (svg) {
            setSelections(svg, node)
        }

        // for design nodes, sync with split screen text editor
        let showDetailsView = !!node
        if (showDetailsView) {
            const { handleNodeSelected } = this.props
            if (typeof handleNodeSelected === 'function' && handleNodeSelected(node)) {
                showDetailsView = false
            }
        }

        // else just show details view
        this.detailsViewUpdate = node ? true : false
        this.setState({
            selectedNodeId: node ? node.uid : '',
            showDetailsView,
        })
        this.props.handleLegendClose()
    }

    handleNodeDrag = (isDragging) => {
        this.isDragging = isDragging
    }

    getLayoutNodes = () => {
        return this.laidoutNodes
    }

    handleDetailsClose = () => {
        this.detailsViewUpdate = true
        this.setState({
            selectedNodeId: '',
            showDetailsView: false,
        })
    }

    handleDesignClose = () => {
        this.setState({
            selectedNodeId: '',
        })
    }

    isUserFiltering = (activeFilters) => {
        let filteringOn = false

        const keys = Object.keys(activeFilters)
        if (keys.length === 1) {
            return filteringOn
        }
        let i
        // loop until we find a filter that's set or there are no more filters
        for (i = 0; i < keys.length && filteringOn === false; i++) {
            if (keys[i] !== 'type') {
                filteringOn = activeFilters[keys[i]].size > 0
            }
        }

        return filteringOn
    }

    generateDiagram(secondaryLoad) {
        // if dragging or searching don't refresh diagram
        if (this.isDragging) {
            return
        }

        // add layers to svg
        if (!this.svg) {
            this.svg = d3.select(`#${c.DIAGRAM_SVG_ID}`)
            this.svg.append('g').attr('class', 'titles')
            this.svg.append('g').attr('class', 'links') // Links must be added before nodes, so nodes are painted on top.
            this.svg.append('g').attr('class', 'nodes')
            this.svg.on('click', this.handleNodeClick)
            this.svg.call(this.zoomHelper.canvasZoom())

            defineLinkMarkers(this.svg)
        }

        // consolidate nodes/filter links/add layout data to each element
        const { nodes = [], links = [], hiddenLinks = new Set(), searchChanged } = this.state
        const { activeFilters, availableFilters, staticResourceData, searchName } = this.props
        const options = {
            firstLayout: this.lastLayoutBBox === undefined,
            searchName,
            activeFilters,
            availableFilters,
            staticResourceData,
            showLayoutLoading: () => {
                //this.layoutLoadingRef.style.visibility = 'visible'
                this.layoutLoadingRef.style.display = 'block'
            },
        }

        if (this.viewerContainerRef) {
            this.viewerContainerRef.classList.toggle('search-mode', !!searchName)
        }

        const isFilterOn = this.isUserFiltering(activeFilters)
        // whether it was used or not, turn it off
        this.layoutHelper.layout(nodes, links, hiddenLinks, options, isFilterOn, (layoutResults) => {
            const { laidoutNodes, titles, searchNames, selfLinks, layoutBBox } = layoutResults
            this.layoutBBox = layoutBBox
            this.titles = titles
            const { firstLayout } = options

            // stop any current transitions
            this.zoomHelper.interruptElements()

            if (secondaryLoad) {
                this.zoomHelper.zoomFit(true, false)
            }

            // zoom to fit all nodes
            if (this.zoomHelper.isAutoZoomToFit() || firstLayout || searchChanged) {
                this.zoomHelper.zoomFit(false, searchChanged)
            }

            // Create or refresh the links in the diagram.
            const currentZoom = this.zoomHelper.getCurrentZoom()
            const transition = d3.transition().duration(0).ease(d3.easeCircleOut)
            const { typeToShapeMap } = this.props.staticResourceData
            const linkHelper = new LinkHelper(
                this.svg,
                links,
                selfLinks,
                laidoutNodes,
                typeToShapeMap,
                this.diagramOptions
            )

            linkHelper.updateDiagramLinks(currentZoom)
            linkHelper.moveLinks(transition, currentZoom, searchChanged)

            // Create or refresh the nodes in the diagram.
            const nodeHelper = new NodeHelper(this.svg, laidoutNodes, typeToShapeMap, this.showsShapeTitles, this.props.t, () => {
                return this.clientRef
            })
            nodeHelper.updateDiagramNodes(currentZoom, this.handleNodeClick, this.handleNodeDrag)
            nodeHelper.moveNodes(transition, currentZoom, searchChanged)

            // Create or refresh the titles in the diagram.
            if (
                this.diagramOptions.showGroupTitles !== false && titles.length>1 &&
                (titles.length || searchChanged || (this.lastTitlesLength && titles.length !== this.lastTitlesLength))
            ) {
                const titleHelper = new TitleHelper(this.svg, titles)
                titleHelper.updateDiagramTitles(currentZoom)
                titleHelper.moveTitles(transition, currentZoom, searchChanged)
                this.lastTitlesLength = titles.length
            }

            // show label matches in boldface
            if (searchChanged || (firstLayout && searchNames.length > 0)) {
                showMatches(this.svg, searchNames)
            }
            // counter zoom labels
            this.zoomHelper.counterZoomElements(this.svg)

            this.laidoutNodes = laidoutNodes
            this.lastLayoutBBox = laidoutNodes.length ? this.layoutBBox : undefined

            // if diagram split screen openned, re-select node that openned it
            if (firstLayout) {
                const { selectedNode } = this.props
                if (selectedNode) {
                    setSelections(this.svg, selectedNode)
                }
            }

            // whether it was used or not, turn it off
            if (this.layoutLoadingRef) {
                //this.layoutLoadingRef.style.visibility = 'hidden'
                this.layoutLoadingRef.style.display = 'none'
            }
        })
    }

    destroyDiagram = () => {
        this.titles = []
        this.layoutHelper.destroy()
        const svg = d3.select(`#${c.DIAGRAM_SVG_ID}`)
        if (svg) {
            svg.select('g.nodes').selectAll('*').remove()
            svg.select('g.links').selectAll('*').remove()
            svg.select('g.titles').selectAll('*').remove()
        }
    }

    handleClusterDetailsContainerUpdate = (
        page,
        startIdx,
        clusterSearchToggle,
        expandSectionToggleMap,
        clusterID,
        selected,
        selectedClusterList
    ) => {
        this.setState({
            clusterDetailsContainerData: {
                page: page,
                startIdx: startIdx,
                clusterSearchToggle: clusterSearchToggle,
                expandSectionToggleMap: expandSectionToggleMap,
                clusterID: clusterID,
                selected: selected,
                selectedClusterList: selectedClusterList,
            },
        })
    }
}

export default DiagramViewer
