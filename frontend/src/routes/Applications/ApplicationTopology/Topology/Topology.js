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
import PropTypes from 'prop-types'
import { AcmAlert } from '@open-cluster-management/ui-components'
import SearchName from './viewer/SearchName'
import TypeFilterBar, { setActiveTypeFilters } from './viewer/TypeFilterBar'
import { ResourceFilterModule } from './viewer/ResourceFilterModule'
import DiagramViewer from './viewer/DiagramViewer'
import { getResourceDefinitions } from './viewer/defaults'
import './css/topology-details.css'
import './css/topology-diagram.css'
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
            isChangingChannel: PropTypes.bool,
            changeTheChannel: PropTypes.func,
        }),
        fetchControl: PropTypes.shape({
            isLoaded: PropTypes.bool,
            isReloading: PropTypes.bool,
            isFailed: PropTypes.bool,
        }),
        handleLegendClose: PropTypes.func,
        links: PropTypes.array.isRequired,
        locale: PropTypes.string,
        nodes: PropTypes.array.isRequired,
        options: PropTypes.object,
        portals: PropTypes.object,
        processActionLink: PropTypes.func,
        searchUrl: PropTypes.string,
        selectionControl: PropTypes.shape({
            selectedNode: PropTypes.object,
            handleNodeSelected: PropTypes.func,
        }),
        showLegendView: PropTypes.bool,
        styles: PropTypes.shape({
            shapes: PropTypes.object,
        }),
        title: PropTypes.string,
    }

    constructor(props) {
        super(props)
        this.state = {
            isLoaded: true,
            searchName: '',
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

        this.setState((prevState) => {
            let { timestamp } = prevState
            const { userIsFiltering } = prevState
            const { nodes, fetchControl = {} } = nextProps
            const { isLoaded = true, isReloading = false } = fetchControl

            if (!_.isEqual(nodes, this.props.nodes) && !isReloading) {
                timestamp = new Date().toString()
            }
            this.staticResourceData.updateNodeStatus(nodes, this.props.locale)
            const { availableFilters, activeFilters, otherTypeFilters } = this.staticResourceData.getAllFilters(
                isLoaded,
                nodes,
                this.props.options,
                prevState.activeFilters,
                this.knownTypes,
                userIsFiltering,
                this.props.locale
            )
            return {
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
            !_.isEqual(
                this.props.nodes.map((n) => n.uid),
                nextProps.nodes.map((n) => n.uid)
            ) ||
            !_.isEqual(
                this.props.links.map((n) => n.uid),
                nextProps.links.map((n) => n.uid)
            ) ||
            !_.isEqual(this.props.fetchControl, nextProps.fetchControl) ||
            !_.isEqual(this.props.channelControl, nextProps.channelControl) ||
            !_.isEqual(this.state.availableFilters, nextState.availableFilters) ||
            !_.isEqual(this.state.activeFilters, nextState.activeFilters) ||
            this.state.searchName !== nextState.searchName ||
            this.state.fetchChannel !== nextState.fetchChannel ||
            this.state.isLoaded !== nextState.isLoaded
        )
    }

    render() {
        const { fetchControl = {}, locale } = this.props
        const { isFailed = false } = fetchControl

        if (isFailed) {
            return (
                <AcmAlert
                    className="persistent"
                    title={t('error.default.description')}
                    variant="danger"
                    isInline
                />
            )
        }

        // if everything succeeds, show topology
        return this.renderTopology()
    }

    renderTopology() {
        const {
            title,
            nodes,
            links,
            options,
            styles,
            showLegendView,
            handleLegendClose,
            fetchControl = {},
            selectionControl = {},
            channelControl = {},
            processActionLink,
            locale,
            argoAppDetailsContainerControl,
        } = this.props
        const { isLoaded = true, isReloading = false } = fetchControl
        const { isChangingChannel = false } = channelControl
        const { selectedNode, handleNodeSelected } = selectionControl
        const { searchName = '', activeFilters, availableFilters, showChannelsControl } = this.state

        return (
            <div className="topologyDiagramContainer">
                {this.renderResourceFilterModule()}
                {this.renderSearchName()}
                {this.renderTypeFilterBar()}
                <DiagramViewer
                    title={title}
                    nodes={nodes}
                    links={links}
                    options={options}
                    styles={styles}
                    isReloading={isReloading}
                    secondaryLoad={isChangingChannel || !isLoaded}
                    selectedNode={selectedNode}
                    handleNodeSelected={handleNodeSelected}
                    searchName={searchName}
                    processActionLink={processActionLink}
                    t={this.props.t}
                    activeFilters={activeFilters}
                    availableFilters={availableFilters}
                    staticResourceData={this.staticResourceData}
                    channelControl={channelControl}
                    showChannelsControl={showChannelsControl}
                    showLegendView={showLegendView}
                    handleLegendClose={handleLegendClose}
                    argoAppDetailsContainerControl={argoAppDetailsContainerControl}
                />
            </div>
        )
    }

    renderResourceFilterModule() {
        const { portals = {} } = this.props
        const { assortedFilterOpenBtn } = portals
        if (assortedFilterOpenBtn) {
            const portal = document.getElementById(assortedFilterOpenBtn)
            if (portal) {
                const { availableFilters, activeFilters } = this.state
                return ReactDOM.createPortal(
                    <ResourceFilterModule
                        portals={portals}
                        activeFilters={activeFilters}
                        availableFilters={availableFilters}
                        updateActiveFilters={this.onFilterChange.bind(this)}
                        locale={this.props.locale}
                    />,
                    portal
                )
            }
        }
        return null
    }

    renderTypeFilterBar() {
        const { portals = {}, locale } = this.props
        const { typeFilterBar } = portals
        if (typeFilterBar) {
            const portal = document.getElementById(typeFilterBar)
            if (portal) {
                const { availableFilters, activeFilters, otherTypeFilters } = this.state
                const filterBarTooltipMap = {
                    other: otherTypeFilters.join('\n'),
                }
                return ReactDOM.createPortal(
                    <TypeFilterBar
                        availableFilters={availableFilters['type']}
                        activeFilters={activeFilters['type']}
                        typeToShapeMap={this.staticResourceData.typeToShapeMap}
                        tooltipMap={filterBarTooltipMap}
                        typeFilterCookie={this.typeFilterCookie}
                        updateActiveFilters={this.onFilterChange.bind(this)}
                        locale={locale}
                    />,
                    portal
                )
            }
        }
        return null
    }

    onFilterChange(activeFilters) {
        this.setState((prevState) => {
            // update active filters
            activeFilters = Object.assign({}, prevState.activeFilters, activeFilters)

            // update available filter view filters
            const { nodes, options, locale } = this.props
            const availableFilters = Object.assign(
                {},
                prevState.availableFilters,
                this.staticResourceData.getAvailableFilters(nodes, options, activeFilters, locale)
            )

            return { activeFilters, availableFilters, userIsFiltering: true }
        })
    }

    renderSearchName() {
        const { portals = {}, locale } = this.props
        const { searchTextbox } = portals
        if (searchTextbox) {
            const portal = document.getElementById(searchTextbox)
            if (portal) {
                const { searchName } = this.state
                return ReactDOM.createPortal(
                    <SearchName searchName={searchName} onNameSearch={this.onNameSearch.bind(this)} locale={locale} />,
                    portal
                )
            }
        }
        return null
    }

    onNameSearch(searchName) {
        this.setState({ searchName })
    }
}

export default Topology
