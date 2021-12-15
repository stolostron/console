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
import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import { Scrollbars } from 'react-custom-scrollbars'
import { TimesIcon } from '@patternfly/react-icons'
import { Spinner } from '@patternfly/react-core'
import jsYaml from 'js-yaml'
import { createResourceSearchLink } from '../utils/diagram-helpers'
import { getLegendTitle } from './defaults/titles'
import ClusterDetailsContainer from './ClusterDetailsContainer'
import ArgoAppDetailsContainer from './ArgoAppDetailsContainer'

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

class DetailsView extends React.Component {
    constructor(props) {
        super(props)
        this.toggleLinkLoading = this.toggleLinkLoading.bind(this)

        this.state = {
            isLoading: false,
            linkID: '',
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

    render() {
        const { onClose, getLayoutNodes, staticResourceData, selectedNodeId, nodes, activeFilters, t } = this.props
        const { typeToShapeMap, getNodeDetails } = staticResourceData
        const currentUpdatedNode = nodes.find((n) => n.uid === selectedNodeId)
        const currentNode = getLayoutNodes().find((n) => n.uid === selectedNodeId) || {}
        const { layout = {} } = currentNode
        const resourceType = layout.type || currentNode.type || currentUpdatedNode.type
        const { shape = 'other', className = 'default' } = typeToShapeMap[resourceType] || {}
        const details = getNodeDetails(currentNode, currentUpdatedNode, activeFilters, t)
        const name = currentNode.type === 'cluster' ? '' : currentNode.name
        const legend = getLegendTitle(resourceType, t)

        const searchLink = createResourceSearchLink(currentNode, t)
        return (
            <div className="topologyDetails">
                <div className="detailsHeader">
                    <DetailsViewDecorator shape={shape} className={className} />
                    <div>
                        <div className="sectionContent">
                            <span className="label">{legend}</span>
                        </div>
                        <div className="sectionContent">
                            <span className="titleNameText">{name}</span>
                        </div>
                        <div className="openSearchLink">{this.renderLink(searchLink)}</div>
                    </div>
                    <TimesIcon className="closeIcon" description={t('topology.details.close')} onClick={onClose} />
                </div>
                <hr />
                <Scrollbars
                    renderView={this.renderView}
                    renderThumbVertical={this.renderThumbVertical}
                    className="details-view-container"
                >
                    {details.map((detail) => this.renderDetail(detail, t))}
                </Scrollbars>
            </div>
        )
    }

    renderDetail(detail, t) {
        switch (detail.type) {
            case 'spacer':
                return this.renderSpacer()
            case 'link':
                return this.renderLink(detail, true, t)
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

    renderLink({ value, indent, t }) {
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

    setSubmitBtn = (ref) => {
        this.submitBtn = ref
    }

    enableSubmitBtn() {
        this.submitBtn.disabled = false
    }

    onSubmit() {
        this.props.onClose()
    }

    renderSpacer() {
        return (
            <div className="sectionContent" key={Math.random()}>
                <div className="spacer" />
            </div>
        )
    }

    renderView({ style, ...props }) {
        style.height = 'calc(100vh - 370px)'
        return <div {...props} style={{ ...style }} />
    }

    renderThumbVertical({ style, ...props }) {
        const finalStyle = {
            ...style,
            cursor: 'pointer',
            borderRadius: 'inherit',
            backgroundColor: 'rgba(0,0,0,.2)',
        }
        return <div className={'details-view-scrollbar'} style={finalStyle} {...props} />
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
    getViewContainer: PropTypes.func,
    t: PropTypes.func,
    nodes: PropTypes.array,
    onClose: PropTypes.func,
    processActionLink: PropTypes.func,
    selectedNodeId: PropTypes.string,
    staticResourceData: PropTypes.object,
}

export default DetailsView
