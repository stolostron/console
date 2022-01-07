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
import ReactDOM from 'react-dom'
import ReactDOMServer from 'react-dom/server'
import PropTypes from 'prop-types'
import { AcmAlert } from '@open-cluster-management/ui-components'
import TypeFilterBar, { setActiveTypeFilters } from './viewer/TypeFilterBar'
import { ResourceFilterModule } from './viewer/ResourceFilterModule'
import { getResourceDefinitions } from './viewer/defaults'
import { DiagramShapes } from './shapes/DiagramShapes'
import { DiagramIcons } from './shapes/DiagramIcons'
import './css/topology-details.css'
import './css/topology-diagram.css'
import './css/topology-link.css'
import './css/topology-node.css'
import './css/topology-icons.css'
import './css/topology-controls.css'
import './css/resource-toolbar.css'
import _ from 'lodash'

class Topology extends React.Component {
    static propTypes = {
        argoAppDetailsContainerControl: PropTypes.shape({
            argoAppDetailsContainerData: PropTypes.object,
            handleArgoAppDetailsContainerUpdate: PropTypes.func,
            handleErrorMsg: PropTypes.func,
        }),
        channelControl: PropTypes.shape({
            allChannels: PropTypes.array,
            activeChannel: PropTypes.string,
            changeTheChannel: PropTypes.func,
        }),
        elements: PropTypes.shape({
            nodes: PropTypes.array,
            links: PropTypes.array,
        }).isRequired,
        fetchControl: PropTypes.shape({
            isLoaded: PropTypes.bool,
            isReloading: PropTypes.bool,
            isFailed: PropTypes.bool,
        }),
        t: PropTypes.func,
        options: PropTypes.object,
        processActionLink: PropTypes.func,
        searchName: PropTypes.string,
        searchUrl: PropTypes.string,
        setDrawerContent: PropTypes.func,
        selectionControl: PropTypes.shape({
            selectedNode: PropTypes.object,
            handleNodeSelected: PropTypes.func,
        }),
        canUpdateStatuses: PropTypes.bool,
        styles: PropTypes.shape({
            shapes: PropTypes.object,
        }),
        title: PropTypes.string,
    }

    constructor(props) {
        super(props)
        this.state = {
            links: [],
            nodes: [],
            isLoaded: true,
            availableFilters: {},
            activeFilters: {},
            otherTypeFilters: [],
            showChannelsControl: false,
        }

        // merge styles and options with defaults
        const { styles, options, searchUrl } = props
        this.staticResourceData = getResourceDefinitions(styles, options, searchUrl)

        this.knownTypes = setActiveTypeFilters(this.typeFilterCookie, this.state.activeFilters)
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
        // Keep channel control visible if multiple channels exist, or hide it otherwise
        this.setState({
            showChannelsControl: _.get(nextProps.channelControl, 'allChannels', []).length > 1,
        })

        this.setState((prevState, props) => {
            let { timestamp } = prevState
            const { userIsFiltering } = prevState
            const {
                elements: { nodes },
                fetchControl = {},
            } = nextProps
            const { isLoaded = true, isReloading = false } = fetchControl

            if (!_.isEqual(nodes, this.props.elements.nodes) && !isReloading) {
                timestamp = new Date().toString()
            }
            this.staticResourceData.updateNodeStatus(nodes, this.props.t)
            const { availableFilters, activeFilters, otherTypeFilters } = this.staticResourceData.getAllFilters(
                isLoaded,
                nodes,
                this.props.options,
                prevState.activeFilters,
                this.knownTypes,
                userIsFiltering,
                this.props.t
            )
            return {
                links: _.cloneDeep(nextProps.elements.links),
                nodes: _.cloneDeep(nextProps.elements.nodes),
                isLoaded,
                timestamp,
                availableFilters,
                activeFilters,
                otherTypeFilters,
            }
        })
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (
            !_.isEqual(this.state.nodes, nextState.nodes) ||
            !_.isEqual(this.state.links, nextState.links) ||
            !_.isEqual(this.props.fetchControl, nextProps.fetchControl) ||
            !_.isEqual(
                _.omit(this.props.channelControl, _.functions(this.props.channelControl)),
                _.omit(nextProps.channelControl, _.functions(nextProps.channelControl))
            ) ||
            !_.isEqual(this.state.availableFilters, nextState.availableFilters) ||
            !_.isEqual(this.state.activeFilters, nextState.activeFilters) ||
            this.props.canUpdateStatuses !== nextProps.canUpdateStatuses ||
            this.props.searchName !== nextProps.searchName ||
            this.state.fetchChannel !== nextState.fetchChannel ||
            this.state.isLoaded !== nextState.isLoaded
        )
    }

    render() {
        const { fetchControl = {}, t } = this.props
        const { isFailed = false } = fetchControl

        if (isFailed) {
            return <AcmAlert className="persistent" title={t('error.default.description')} variant="danger" isInline />
        }

        // if everything succeeds, show topology
        return this.renderTopology()
    }

    renderTopology() {
        const {
            title,
            options,
            styles,
            fetchControl = {},
            selectionControl = {},
            channelControl = {},
            processActionLink,
            argoAppDetailsContainerControl,
            searchName,
            t,
        } = this.props
        const { isLoaded = true, isReloading = false } = fetchControl
        const { selectedNode, handleNodeSelected } = selectionControl
        const { nodes, links, activeFilters, availableFilters, showChannelsControl } = this.state
        const DiagramViewer = this.props.diagramViewer

        return (
            <div className="topologyDiagramContainer">
                {/* {this.renderResourceFilterModule()} */}
                {/* {this.renderSearchName()} */}
                {/* {this.renderTypeFilterBar()} */}
                <DiagramShapes />
                <DiagramIcons />
                <DiagramViewer
                    title={title}
                    nodes={nodes}
                    links={links}
                    options={options}
                    styles={styles}
                    isReloading={isReloading}
                    secondaryLoad={!isLoaded}
                    selectedNode={selectedNode}
                    handleNodeSelected={handleNodeSelected}
                    searchName={searchName}
                    processActionLink={processActionLink}
                    activeFilters={activeFilters}
                    availableFilters={availableFilters}
                    staticResourceData={this.staticResourceData}
                    channelControl={channelControl}
                    showChannelsControl={showChannelsControl}
                    argoAppDetailsContainerControl={argoAppDetailsContainerControl}
                    canUpdateStatuses={this.props.canUpdateStatuses}
                    t={this.props.t}
                />
            </div>
        )
    }

    // renderResourceFilterModule() {
    //     const { portals = {} } = this.props
    //     const { assortedFilterOpenBtn } = portals
    //     if (assortedFilterOpenBtn) {
    //         const portal = document.getElementById(assortedFilterOpenBtn)
    //         if (portal) {
    //             const { availableFilters, activeFilters } = this.state
    //             return ReactDOM.createPortal(
    //                 <ResourceFilterModule
    //                     portals={portals}
    //                     activeFilters={activeFilters}
    //                     availableFilters={availableFilters}
    //                     updateActiveFilters={this.onFilterChange.bind(this)}
    //                     t={this.props.t}
    //                 />,
    //                 portal
    //             )
    //         }
    //     }
    //     return null
    // }

    // renderTypeFilterBar() {
    //     const { portals = {}, t } = this.props
    //     const { typeFilterBar } = portals
    //     if (typeFilterBar) {
    //         const portal = document.getElementById(typeFilterBar)
    //         if (portal) {
    //             const { availableFilters, activeFilters, otherTypeFilters } = this.state
    //             const filterBarTooltipMap = {
    //                 other: otherTypeFilters.join('\n'),
    //             }
    //             return ReactDOM.createPortal(
    //                 <TypeFilterBar
    //                     availableFilters={availableFilters['type']}
    //                     activeFilters={activeFilters['type']}
    //                     typeToShapeMap={this.staticResourceData.typeToShapeMap}
    //                     tooltipMap={filterBarTooltipMap}
    //                     typeFilterCookie={this.typeFilterCookie}
    //                     updateActiveFilters={this.onFilterChange.bind(this)}
    //                     t={t}
    //                 />,
    //                 portal
    //             )
    //         }
    //     }
    //     return null
    // }

    // onFilterChange(activeFilters) {
    //     this.setState((prevState) => {
    //         // update active filters
    //         activeFilters = Object.assign({}, prevState.activeFilters, activeFilters)

    //         // update available filter view filters
    //         const { nodes, options, t } = this.props
    //         const availableFilters = Object.assign(
    //             {},
    //             prevState.availableFilters,
    //             this.staticResourceData.getAvailableFilters(nodes, options, activeFilters, t)
    //         )

    //         return { activeFilters, availableFilters, userIsFiltering: true }
    //     })
    // }

    // renderSearchName() {
    //     const { portals = {}, t } = this.props
    //     const { searchTextbox } = portals
    //     if (searchTextbox) {
    //         const portal = document.getElementById(searchTextbox)
    //         if (portal) {
    //             const { searchName } = this.state
    //             return ReactDOM.createPortal(
    //                 <SearchName searchName={searchName} onNameSearch={this.onNameSearch.bind(this)} t={t} />,
    //                 portal
    //             )
    //         }
    //     }
    //     return null
    // }
}

export default Topology
