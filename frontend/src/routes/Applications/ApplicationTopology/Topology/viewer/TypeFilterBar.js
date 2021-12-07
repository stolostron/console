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
import './graphics/diagramShapes.svg'
import './graphics/diagramIcons.svg'
import '../css/diagram-filter-bar.css'
import _ from 'lodash'

export class FilterButton extends React.Component {
    static propTypes = {
        handleClick: PropTypes.func,
        label: PropTypes.string,
        locale: PropTypes.string,
        selected: PropTypes.bool,
        tooltip: PropTypes.string,
        typeToShapeMap: PropTypes.object,
    }

    handleClick = () => {
        document.activeElement.blur()
        this.props.handleClick(this.props.label)
    }

    handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            this.props.handleClick(this.props.label)
        }
    }

    shouldComponentUpdate(nextProps) {
        return this.props.selected !== nextProps.selected || this.props.tooltip !== nextProps.tooltip
    }

    render() {
        const { label, tooltip, selected, typeToShapeMap, locale } = this.props
        const { shape = 'other', className = 'default' } = typeToShapeMap[label] || {}
        return (
            <div className="filter-bar-button-container" key={label} title={tooltip || ''}>
                <div
                    className="filter-bar-button"
                    aria-checked={selected}
                    tabIndex="0"
                    role={'checkbox'}
                    aria-label={t(selected ? 'select' : 'unselect')}
                    onClick={this.handleClick}
                    onKeyPress={this.handleKeyPress}
                >
                    <svg width="16px" height="16px">
                        <use href={`#diagramShapes_${shape}`} className={`${className} filter-bar-button-icon`} />
                    </svg>
                    <div className="filter-bar-button-label">{label}</div>
                </div>
                {selected && (
                    <div className="filter-bar-button-checkmark">
                        <svg width="8px" height="8px">
                            <use href={'#diagramIcons_checkmark'} />
                        </svg>
                    </div>
                )}
            </div>
        )
    }
}

class TypeFilterBar extends React.Component {
    static propTypes = {
        activeFilters: PropTypes.array,
        availableFilters: PropTypes.array,
        locale: PropTypes.string,
        tooltipMap: PropTypes.object,
        typeFilterCookie: PropTypes.string,
        typeToShapeMap: PropTypes.object,
        updateActiveFilters: PropTypes.func,
    }

    constructor(props) {
        super(props)
        this.state = {
            activeFilters: _.cloneDeep(props.activeFilters || []),
        }
    }

    handleClick = (type) => {
        this.setState((prevState) => {
            // change check
            const activeFilters = _.cloneDeep(prevState.activeFilters)
            const idx = activeFilters.indexOf(type)
            if (idx !== -1) {
                activeFilters.splice(idx, 1)
            } else {
                activeFilters.push(type)
            }
            // change diagram
            this.props.updateActiveFilters({ type: activeFilters })
            saveActiveTypeFilters(this.props.typeFilterCookie, activeFilters, this.props.availableFilters)
            return { activeFilters }
        })
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
        this.setState({
            activeFilters: _.cloneDeep(nextProps.activeFilters || []),
        })
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (
            !_.isEqual(this.props.activeFilters, nextProps.activeFilters) ||
            !_.isEqual(this.props.availableFilters, nextProps.availableFilters) ||
            !_.isEqual(this.state.activeFilters, nextState.activeFilters) ||
            !_.isEqual(this.props.tooltipMap, nextProps.tooltipMap)
        )
    }

    render() {
        const { activeFilters } = this.state
        const { availableFilters = [], typeToShapeMap, tooltipMap = {}, locale } = this.props
        const typeFilterTitle = t('type')
        return (
            <div className="topology-type-filter-bar" role="region" aria-label={typeFilterTitle} id={typeFilterTitle}>
                <div className="filter-bar">
                    {availableFilters.map((type) => {
                        let displayName = t(`filterbar.type.${type}`)
                        // if no i18n for type, use original type
                        if (displayName.indexOf('filterbar.type.') !== -1) {
                            displayName = type
                        }
                        const selected = activeFilters.indexOf(type) !== -1
                        return (
                            <FilterButton
                                key={type}
                                label={displayName}
                                selected={selected}
                                typeToShapeMap={typeToShapeMap}
                                tooltip={tooltipMap[type]}
                                handleClick={this.handleClick}
                            />
                        )
                    })}
                </div>
            </div>
        )
    }
}

export const setActiveTypeFilters = (cookieKey, activeFilters) => {
    let knownTypes = []
    if (cookieKey) {
        const savedTypeFilters = localStorage.getItem(cookieKey)
        if (savedTypeFilters) {
            try {
                const saved = JSON.parse(savedTypeFilters)
                if (saved.activeTypes !== undefined) {
                    activeFilters['type'] = saved.activeTypes
                    knownTypes = saved.knownTypes || []
                }
            } catch (e) {
                //
            }
        }
    }
    return knownTypes
}

export const saveActiveTypeFilters = (cookieKey, activeTypes, knownTypes) => {
    localStorage.setItem(cookieKey, JSON.stringify({ activeTypes, knownTypes }))
}

export default TypeFilterBar
