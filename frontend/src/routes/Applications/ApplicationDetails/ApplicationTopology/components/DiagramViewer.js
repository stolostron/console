/* Copyright Contributors to the Open Cluster Management project */
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

import { Component } from 'react'
import PropTypes from 'prop-types'
import * as d3 from 'd3'
import { Spinner } from '@patternfly/react-core'
import DetailsView from './DetailsView'
import Zoom from '../../../../../components/Topology/components/Zoom'
import ChannelControl from './ChannelControl'
import LayoutHelper from '../../../../../components/Topology/helpers/layoutHelper'
import ZoomHelper from '../../../../../components/Topology/helpers/zoomHelper'
import TitleHelper from '../../../../../components/Topology/helpers/titleHelper'
import LinkHelper, { defineLinkMarkers } from '../../../../../components/Topology/helpers/linkHelper'
import NodeHelper, { showMatches, setSelections } from '../../../../../components/Topology/helpers/nodeHelper'
import * as c from '../../../../../components/Topology/constants.js'
import _ from 'lodash'
import './DiagramViewer.css'

class DiagramViewer extends Component {
    static propTypes = {
        activeFilters: PropTypes.object,
        argoAppDetailsContainerControl: PropTypes.shape({
            argoAppDetailsContainerData: PropTypes.object,
            handleArgoAppDetailsContainerUpdate: PropTypes.func,
            handleErrorMsg: PropTypes.func,
        }),
        availableFilters: PropTypes.object,
        channelControl: PropTypes.object,
        handleNodeSelected: PropTypes.func,
        isReloading: PropTypes.bool,
        canUpdateStatuses: PropTypes.bool,
        links: PropTypes.array,
        t: PropTypes.func,
        nodes: PropTypes.array,
        processActionLink: PropTypes.func,
        searchName: PropTypes.string,
        secondaryLoad: PropTypes.bool,
        selectedNode: PropTypes.object,
        setDrawerContent: PropTypes.func,
        setViewer: PropTypes.func,
        showChannelsControl: PropTypes.bool,
        options: PropTypes.object,
        title: PropTypes.string,
    }

    constructor(props) {
        super(props)
        this.state = {
            hasSpinners: true,
            svgLinks: _.uniqBy(props.links, 'uid'),
            svgNodes: _.uniqBy(props.nodes, 'uid'),
            observer: new ResizeObserver(() => {
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
        this.layoutHelper = new LayoutHelper(this.props.options, this.titles, this.props.t)
        this.diagramOptions = this.props.options.diagramOptions || {}
        this.zoomHelper = new ZoomHelper(this, this.diagramOptions, !props.title)
        this.getLayoutNodes = this.getLayoutNodes.bind(this)
        this.getZoomHelper = this.getZoomHelper.bind(this)
        this.getViewContainer = this.getViewContainer.bind(this)
        this.handleNodeClick = this.handleNodeClick.bind(this)
        this.handleNodeDrag = this.handleNodeDrag.bind(this)
        this.showsShapeTitles = typeof this.props.options.getNodeTitle === 'function'
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

        if (!this.detailsViewUpdate) {
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
            this.props.canUpdateStatuses !== nextProps.canUpdateStatuses ||
            !_.isEqual(this.state.nodes, nextState.nodes) ||
            !_.isEqual(this.state.links, nextState.links) ||
            !_.isEqual(this.props.activeFilters, nextProps.activeFilters) ||
            this.props.searchName !== nextProps.searchName ||
            this.props.secondaryLoad !== nextProps.secondaryLoad ||
            (this.props.isReloading && !nextProps.isReloading)
        )
    }

    UNSAFE_componentWillReceiveProps() {
        this.setState((prevState, props) => {
            // for the React world, so that shouldUpdate works, copy arrays
            const links = _.cloneDeep(props.links)
            const nodes = _.cloneDeep(props.nodes)

            // for svg d3 world maintain existing svgNodes/Links so that
            // we're not constantly removing/ creating svg elements
            // we can update the inner objects of the node/link to update the diagram
            // but not the outer node/link
            const svgNodeMap = {}
            const prevSvgNodeMap = _.keyBy(prevState.svgNodes, 'uid')
            const svgNodes = props.nodes.map((node) => {
                const svgNode = prevSvgNodeMap[node.uid] || Object.assign(node, { layout: {} })
                svgNode.specs = node.specs
                svgNodeMap[node.uid] = svgNode
                return svgNode
            })

            // if source or target are gone, filter it
            const prevSvgLinkMap = _.keyBy(prevState.svgLinks, 'uid')
            const svgLinks = _.uniqBy(props.links, 'uid')
                .filter((link) => {
                    const { source, target } = link
                    if (!svgNodeMap[source] || !svgNodeMap[target]) {
                        return false
                    }
                    return true
                })
                .map((link) => {
                    const svgLink = prevSvgLinkMap[link.uid] || link
                    return svgLink
                })

            // switching between search and not
            const { searchName = '' } = props
            const searchChanged = searchName.localeCompare(prevState.searchName || '') !== 0

            return {
                links,
                nodes,
                svgNodes,
                svgLinks,
                searchName,
                searchChanged,
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
        const { hasSpinners } = this.state
        const { secondaryLoad, title, channelControl, showChannelsControl } = this.props
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
                        {hasSpinners && (
                            <svg width="0" height="0" ref={this.setSpinnerSymbol}>
                                <symbol className="spinner" viewBox="0 0 40 40" id="drawerShapes_spinner">
                                    <circle cx="20" cy="20" r="18" fill="white"></circle>
                                    <circle className="swirly" cx="20" cy="20" r="18"></circle>
                                </symbol>
                            </svg>
                        )}
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
                    {showChannelsControl && (
                        <ChannelControl
                            channelControl={channelControl}
                            t={this.props.t}
                            setDrawerContent={this.props.setDrawerContent}
                        />
                    )}
                    <Zoom
                        getZoomHelper={this.getZoomHelper}
                        getViewContainer={this.getViewContainer}
                        t={this.props.t}
                    />
                </span>
            </div>
        )
    }

    handleNodeClick = (evt) => {
        const node = evt.subject

        // clear any currently selected nodes
        const svg = d3.select(`#${c.DIAGRAM_SVG_ID}`)
        if (svg) {
            setSelections(svg, node)
        }

        // show resource details in side drawer
        if (node) {
            const { options, processActionLink, nodes, activeFilters, argoAppDetailsContainerControl, t } = this.props
            const { clusterDetailsContainerData } = this.state
            const selectedNodeId = node.uid
            const selectedResourceType = node.type
            const clusterDetailsContainerControl = {
                clusterDetailsContainerData,
                handleClusterDetailsContainerUpdate: this.handleClusterDetailsContainerUpdate,
            }
            if (selectedResourceType) {
                this.props.setDrawerContent(
                    t('Details'),
                    false, // inline
                    true, // resizable
                    true, // no drawerhead
                    true, // no padding for drawerpanelbody
                    <DetailsView
                        options={options}
                        getLayoutNodes={this.getLayoutNodes}
                        selectedNodeId={selectedNodeId}
                        processActionLink={processActionLink}
                        nodes={nodes}
                        clusterDetailsContainerControl={clusterDetailsContainerControl}
                        argoAppDetailsContainerControl={argoAppDetailsContainerControl}
                        activeFilters={activeFilters}
                        t={t}
                    />,
                    false
                )
            }
        }
    }

    handleNodeDrag = (isDragging) => {
        this.isDragging = isDragging
    }

    getLayoutNodes = () => {
        return this.laidoutNodes
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
        const { svgNodes = [], svgLinks = [], searchChanged } = this.state
        const { activeFilters, availableFilters, options, searchName, canUpdateStatuses } = this.props
        const layoutOptions = {
            firstLayout: this.lastLayoutBBox === undefined,
            searchName,
            activeFilters,
            availableFilters,
            options,
            canUpdateStatuses,
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
        this.layoutHelper.layout(svgNodes, svgLinks, new Set(), layoutOptions, isFilterOn, (layoutResults) => {
            const { laidoutNodes, titles, searchNames, selfLinks, layoutBBox } = layoutResults
            this.layoutBBox = layoutBBox
            this.titles = titles
            const { firstLayout } = layoutOptions

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
            const { typeToShapeMap } = this.props.options
            const linkHelper = new LinkHelper(
                this.svg,
                svgLinks,
                selfLinks,
                laidoutNodes,
                typeToShapeMap,
                this.diagramOptions
            )

            linkHelper.updateDiagramLinks(currentZoom)
            linkHelper.moveLinks(transition, currentZoom, searchChanged)

            setTimeout(() => {
                const hasSpinners = laidoutNodes.some(({ specs = {} }) => {
                    return specs.pulse === 'spinner'
                })
                this.setState({ hasSpinners })
            }, 1000)

            // Create or refresh the nodes in the diagram.
            const nodeHelper = new NodeHelper(
                this.svg,
                laidoutNodes,
                typeToShapeMap,
                this.showsShapeTitles,
                this.props.t,
                () => {
                    return this.clientRef
                }
            )
            nodeHelper.updateDiagramNodes(currentZoom, this.handleNodeClick, this.handleNodeDrag)
            nodeHelper.moveNodes(transition, currentZoom, searchChanged)

            // Create or refresh the titles in the diagram.
            if (
                this.diagramOptions.showGroupTitles !== false &&
                titles.length > 1 &&
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
