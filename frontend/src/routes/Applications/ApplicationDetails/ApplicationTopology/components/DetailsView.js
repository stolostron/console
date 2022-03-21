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

import _ from 'lodash'
import R from 'ramda'
import React, { Fragment } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import { Button, Spinner, Tabs, Tab, TabTitleText } from '@patternfly/react-core'
import jsYaml from 'js-yaml'
import { createResourceSearchLink, createResourceURL, getFilteredNode } from '../helpers/diagram-helpers'
import { getLegendTitle } from '../options/titles'
import ClusterDetailsContainer from './ClusterDetailsContainer'
import ArgoAppDetailsContainer from './ArgoAppDetailsContainer'
import DetailsTable from './DetailsTable'
import { LogsContainer } from './LogsContainer'
import { YAMLContainer } from './YAMLContainer'

const DetailsViewDecorator = ({ shape, className }) => {
    return (
        <div className="detailsIconContainer">
            <svg width="58px" height="58px" viewBox="0 0 58 58">
                <use href={`#diagramShapes_${shape}`} className={`${className} detailsIcon`} />
            </svg>
        </div>
    )
}

DetailsViewDecorator.propTypes = {
    className: PropTypes.string,
    shape: PropTypes.string,
}

const resourcesWithPods = new Set(['pod', 'replicaset', 'replicationcontroller', 'statefulset', 'daemonset'])

class DetailsView extends React.Component {
    constructor(props) {
        super(props)
        this.toggleLinkLoading = this.toggleLinkLoading.bind(this)
        this.handleTabClick = this.handleTabClick.bind(this)

        this.state = {
            isLoading: false,
            linkID: '',
            activeTabKey: this.props.activeTabKey,
            filteredNode: undefined,
        }
    }

    handleClick(value) {
        this.setState({ linkID: value.id })
        this.processActionLink(value)
    }

    handleKeyPress(value, e) {
        if (e.key === 'Enter') {
            this.setState({ linkID: value.id })
            this.processActionLink(value)
        }
    }

    toggleLinkLoading() {
        this.setState((prevState) => ({
            isLoading: !prevState.isLoading,
        }))
    }

    processActionLink(value) {
        const { processActionLink } = this.props
        const { data } = value
        processActionLink(data, this.toggleLinkLoading)
    }

    handleTabClick(event, tabIndex) {
        this.setState({
            activeTabKey: tabIndex,
        })
    }

    componentDidUpdate(prevProps) {
        if (prevProps.selectedNodeId !== this.props.selectedNodeId) {
            this.setState({
                activeTabKey: 0,
            })
        }
    }

    renderResourceURLLink = (resource, t, isLogURL = false) => {
        return (
            <div>
                <div className="spacer" />
                <span
                    className="link sectionLabel"
                    id="linkForNodeAction"
                    tabIndex="0"
                    role="button"
                    onClick={this.processActionLink.bind(this, resource)}
                    onKeyDown={this.handleKeyPress.bind(this, resource)}
                    style={{ padding: '10px' }}
                >
                    {isLogURL && t('View logs in Search details')}
                    {!isLogURL && t('View YAML in Search details')}
                    <svg width="12px" height="12px" style={{ marginLeft: '8px', stroke: '#0066CC' }}>
                        <use href="#diagramIcons_carbonLaunch" className="label-icon" />
                    </svg>
                </span>
                <div className="spacer" />
            </div>
        )
    }

    UNSAFE_componentWillReceiveProps() {
        this.setState({ filteredNode: undefined })
    }

    render() {
        const { filteredNode } = this.state
        const { getLayoutNodes, options, selectedNodeId, nodes, t } = this.props
        const { typeToShapeMap } = options
        const currentNode = filteredNode || getLayoutNodes().find((n) => n.uid === selectedNodeId) || {}
        const currentUpdatedNode = filteredNode || nodes.find((n) => n.uid === selectedNodeId)
        const { layout = {} } = currentNode
        const resourceType = layout.type || currentNode.type || currentUpdatedNode.type
        const isTableView = _.get(currentNode, 'specs.resourceCount', 0) > 1 && currentNode.type !== 'cluster'
        const { shape = 'other', className = 'default' } = typeToShapeMap[resourceType] || {}
        let name = isTableView || currentNode.type === 'cluster' ? '' : currentNode.name
        if (!name) {
            name = _.get(currentNode, 'specs.raw.metadata.name')
        }
        const legend = getLegendTitle(resourceType, t)
        const searchLink = createResourceSearchLink(currentNode, t)

        return (
            <div className="topologyDetails">
                {filteredNode && (
                    <div style={{ margin: '0 0 20px 10px' }}>
                        <Button onClick={() => this.setState({ filteredNode: undefined })} variant="link" isInline>
                            {t(`< Back to all ${resourceType}s`)}
                        </Button>
                    </div>
                )}
                <div className="detailsHeader">
                    <DetailsViewDecorator shape={shape} className={className} />
                    <div>
                        <div className="sectionContent">
                            <span className="label">{legend}</span>
                        </div>
                        {!isTableView && (
                            <Fragment>
                                <div className="sectionContent">
                                    <span className="titleNameText">{name}</span>
                                </div>
                                <div className="openSearchLink">{this.renderLink(searchLink, t)}</div>
                            </Fragment>
                        )}
                    </div>
                </div>
                <Fragment>
                    {isTableView ? this.renderTable(currentNode) : this.renderTabs(currentNode, currentUpdatedNode)}
                </Fragment>
            </div>
        )
    }

    renderTable(node) {
        const { t } = this.props
        return <DetailsTable id="details-view-table" node={node} handleOpen={this.handleOpen.bind(this)} t={t} />
    }

    handleOpen(node, item) {
        const filteredNode = getFilteredNode(node, item)
        this.setState({ filteredNode })
    }

    renderTabs(node, currentUpdatedNode) {
        const { options, activeFilters, t } = this.props
        const selectedNodeId = node.id
        const { getNodeDetails } = options
        const details = getNodeDetails(node, currentUpdatedNode, activeFilters, t)
        const name = node.type === 'cluster' ? '' : node.name
        const yamlURL = createResourceURL(node, t)
        const { namespace, type } = node
        const isLogTabHidden = !resourcesWithPods.has(node.type)
        const { activeTabKey } = this.state

        // Only YAML tab has a key so it will get recreated when switching between nodes
        return (
            <Tabs activeKey={activeTabKey} onSelect={this.handleTabClick} mountOnEnter={true} unmountOnExit={true}>
                <Tab eventKey={0} title={<TabTitleText>{t('Details')}</TabTitleText>} isHidden={false}>
                    {details.map((detail) => this.renderDetail(detail, t))}
                </Tab>
                <Tab eventKey={1} title={<TabTitleText>{t('Logs')}</TabTitleText>} isHidden={isLogTabHidden}>
                    <LogsContainer node={node} t={t} renderResourceURLLink={this.renderResourceURLLink} />
                </Tab>
                <Tab eventKey={2} title={<TabTitleText>{t('YAML')}</TabTitleText>} isHidden={node.type === 'cluster'}>
                    {this.renderResourceURLLink(
                        { data: { action: 'open_link', targetLink: yamlURL, name, namespace, kind: type } },
                        t
                    )}
                    <YAMLContainer key={selectedNodeId} node={node} t={t} />
                </Tab>
            </Tabs>
        )
    }

    renderDetail(detail, t) {
        switch (detail.type) {
            case 'spacer':
                return this.renderSpacer()
            case 'link':
                return this.renderLink(detail, t)
            case 'snippet':
                return this.renderSnippet(detail, t)
            case 'clusterdetailcombobox':
                return this.renderClusterDetailComboBox(detail, t)
            case 'relatedargoappdetails':
                return this.renderRelatedArgoAppDetails(detail, t)
            default:
                return this.renderLabel(detail, t)
        }
    }

    renderLabel({ labelKey, labelValue, value, indent, status }, t) {
        let label = labelValue
        const fillMap = new Map([
            ['checkmark', '#3E8635'],
            ['failure', '#C9190B'],
            ['warning', '#F0AB00'],
            ['pending', '#878D96'],
        ])
        if (labelKey) {
            label = labelValue ? t(labelKey, [labelValue], t) : t(labelKey)
        }
        label = value !== undefined ? `${label}:` : label //add : for 0 values
        const mainSectionClasses = classNames({
            sectionContent: true,
            borderLeft: value !== undefined ? true : false,
        })
        const labelClass = classNames({
            label: true,
            sectionLabel: value ? true : false,
        })
        const valueClass = classNames({
            value: true,
            ksLabelBackground: label && label === `${t('resource.labels')}:` ? true : false,
        })
        const statusIcon = status ? status : undefined
        const iconFill = statusIcon ? fillMap.get(statusIcon) : '#FFFFFF'
        return (
            <div className={mainSectionClasses} key={Math.random()}>
                {(labelKey || labelValue) && statusIcon ? (
                    <span className="label sectionLabel">
                        <svg width="10px" height="10px" fill={iconFill} style={{ marginRight: '8px' }}>
                            <use href={`#diagramIcons_${statusIcon}`} className="label-icon" />
                        </svg>
                        <span>{label} </span>
                    </span>
                ) : (
                    <span className={labelClass}>{label} </span>
                )}
                {indent && <span className="indent" />}
                <span className={valueClass}>{value}</span>
            </div>
        )
    }

    renderSnippet({ value }) {
        if (value) {
            const yaml = jsYaml.safeDump(value).split('\n')
            return (
                <div className="sectionContent snippet">
                    {yaml.map((line) => {
                        return <code key={Math.random()}>{line}</code>
                    })}
                </div>
            )
        }
        return null
    }

    renderLink({ value, indent }, t) {
        if (!value) {
            return <div />
        }
        const { isLoading, linkID } = this.state
        const loadingArgoLink = isLoading && value.id === linkID
        const handleClick = this.handleClick.bind(this, value)
        const handleKeyPress = this.handleKeyPress.bind(this, value)
        const showLaunchOutIcon = !R.pathOr(false, ['data', 'specs', 'isDesign'])(value) //if not show yaml
        const isExternal =
            _.get(value, 'data.action', '') !== 'show_search' &&
            _.get(value, 'data.action', '') !== 'show_resource_yaml'

        const label = value.labelKey ? t(value.labelKey) : value.label

        const mainSectionClasses = classNames({
            sectionContent: true,
            borderLeft: indent ? true : false,
        })

        const linkLabelClasses = classNames({
            link: true,
            sectionLabel: indent ? true : false,
        })

        return (
            <div className={mainSectionClasses} key={Math.random()}>
                <span
                    className={`${linkLabelClasses} ${loadingArgoLink ? 'loadingLink' : ''}`}
                    id="linkForNodeAction"
                    tabIndex="0"
                    role={'button'}
                    onClick={handleClick}
                    onKeyPress={handleKeyPress}
                >
                    {loadingArgoLink && <Spinner size="sm" />}
                    {label}
                    {showLaunchOutIcon &&
                        (isExternal ? (
                            <svg width="12px" height="12px" style={{ marginLeft: '8px', stroke: '#0066CC' }}>
                                <use href="#diagramIcons_carbonLaunch" className="label-icon" />
                            </svg>
                        ) : (
                            <svg width="12px" height="12px" style={{ marginLeft: '8px', stroke: '#0066CC' }}>
                                <use href="#diagramIcons_open-new-tab" className="label-icon" />
                            </svg>
                        ))}
                </span>
            </div>
        )
    }

    renderSpacer() {
        return (
            <div className="sectionContent" key={Math.random()}>
                <div className="spacer" />
            </div>
        )
    }

    renderClusterDetailComboBox({ comboboxdata }, t) {
        const { clusterDetailsContainerControl } = this.props
        return (
            <div className="sectionContent" key={Math.random()}>
                <ClusterDetailsContainer
                    clusterList={comboboxdata.clusterList}
                    sortedClusterNames={comboboxdata.sortedClusterNames}
                    searchClusters={comboboxdata.searchClusters}
                    clusterID={comboboxdata.clusterID}
                    t={t}
                    clusterDetailsContainerControl={clusterDetailsContainerControl}
                />
            </div>
        )
    }

    renderRelatedArgoAppDetails({ relatedargoappsdata }, t) {
        const { argoAppDetailsContainerControl } = this.props
        return (
            <div className="sectionContent" key={Math.random()}>
                <ArgoAppDetailsContainer
                    argoAppList={relatedargoappsdata.argoAppList}
                    t={t}
                    argoAppDetailsContainerControl={argoAppDetailsContainerControl}
                />
            </div>
        )
    }
}

DetailsView.propTypes = {
    activeFilters: PropTypes.object,
    argoAppDetailsContainerControl: PropTypes.shape({
        argoAppDetailsContainerData: PropTypes.object,
        handleArgoAppDetailsContainerUpdate: PropTypes.func,
        handleErrorMsg: PropTypes.func,
    }),
    clusterDetailsContainerControl: PropTypes.shape({
        clusterDetailsContainerData: PropTypes.object,
        handleClusterDetailsContainerUpdate: PropTypes.func,
    }),
    getLayoutNodes: PropTypes.func,
    t: PropTypes.func,
    nodes: PropTypes.array,
    onClose: PropTypes.func,
    processActionLink: PropTypes.func,
    selectedNodeId: PropTypes.string,
    options: PropTypes.object,
    activeTabKey: PropTypes.number,
}

export default DetailsView
