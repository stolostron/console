/** *****************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2019. All Rights Reserved.
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
import { CSSTransition } from 'react-transition-group'
import { TimesIcon } from '@patternfly/react-icons'
import { Checkbox, Chip, ChipGroup } from '@patternfly/react-core'
import { Scrollbars } from 'react-custom-scrollbars'
import '../css/resource-filter-view.css'
import _ from 'lodash'

//if section has more then this number of filters, add "show more"
const SHOW_MORE = 10

const ShowOrMoreItem = ({ count, isExpanded, onExpand, t }) => {
    return (
        <div className="filter-section-expand" tabIndex="0" role={'button'} onClick={onExpand} onKeyPress={onExpand}>
            {isExpanded ? t('filter.view.collapse') : t('filter.view.expand', [count])}
        </div>
    )
}

ShowOrMoreItem.propTypes = {
    count: PropTypes.number,
    isExpanded: PropTypes.bool,
    onExpand: PropTypes.func,
    t: PropTypes.func,
}

const FilterSection = ({ section: { name, filters, isExpanded, onExpand }, showThreshold, t }) => {
    filters.sort(({ label: a = '', isAll: ia, isOther: oa }, { label: b = '', isAll: ib, isOther: ob }) => {
        if (ia && !ib) {
            return -1
        } else if (!ia && ib) {
            return 1
        }
        if (oa && !ob) {
            return 1
        } else if (!oa && ob) {
            return -1
        }
        return a.localeCompare(b)
    })

    // show more/or less
    const count = filters.length - showThreshold
    const showMoreOrLess = count > 0
    if (showMoreOrLess && !isExpanded) {
        filters = filters.slice(0, showThreshold)
    }

    return (
        <div className="filter-section">
            <div className="filter-section-title">{name}</div>
            {filters.map(({ key, label, checked, onChange }) => {
                return (
                    <Checkbox
                        id={key}
                        key={key}
                        className="filter-section-checkbox"
                        label={label}
                        isChecked={checked}
                        onChange={onChange}
                    />
                )
            })}
            {showMoreOrLess && <ShowOrMoreItem count={count} isExpanded={isExpanded} onExpand={onExpand} t={t} />}
        </div>
    )
}

FilterSection.propTypes = {
    section: PropTypes.object,
    showThreshold: PropTypes.number,
    t: PropTypes.func,
}

export class ResourceFilterView extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            expanded: {},
        }
        this.resize = _.debounce(() => {
            this.layoutView()
        }, 150)
        this.handleMouse = this.handleMouse.bind(this)
        this.handleWheel = this.handleWheel.bind(this)
        this.handleFilterClose = this.handleFilterClose.bind(this)
    }

    componentDidMount() {
        window.addEventListener('resize', this.resize)
        window.addEventListener('mouseup', this.handleMouse, true)
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.resize)
        window.removeEventListener('mouseup', this.handleMouse, true)
    }

    handleMouse(event) {
        // close view when clicking outside
        if (this.filterViewRef && !this.filterViewRef.contains(event.target)) {
            this.handleFilterClose()
        }
    }

    layoutView() {
        this.forceUpdate()
    }

    setContainerRef = (ref) => {
        this.containerRef = ref
    }

    setFilterViewRef = (ref) => {
        if (ref) {
            this.filterViewRef = ref
            this.filterViewRef.addEventListener('wheel', this.handleWheel, {
                passive: false,
            })
        } else if (this.filterViewRef) {
            this.filterViewRef.removeEventListener('wheel', this.handleWheel, {
                passive: false,
            })
            this.filterViewRef = ref
        }
    }

    // prevent mouse wheel from affecting main display
    handleWheel(event) {
        if (this.containerRef) {
            this.containerRef.view.scrollTop = this.containerRef.view.scrollTop + event.deltaY
            event.preventDefault()
            event.stopPropagation()
        }
    }

    render() {
        const { availableFilters = {}, activeFilters, t } = this.props

        // add filter sections
        const sections = []

        Object.keys(availableFilters).forEach((key) => {
            if (key !== 'type') {
                sections.push(this.getSectionData(key, availableFilters[key], t, activeFilters[key]))
            }
        })

        // calc height of scrollbar container
        const height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
        const rectElement = document.getElementById('header-container')
        const rect = rectElement ? rectElement.getBoundingClientRect() : { height: 0 }
        const scrollHeight = height - rect.height
        const containerWidth = 260 // based on resource-filter-view width of 300px
        return (
            <div className="resource-filter-view" ref={this.setFilterViewRef} style={{ height: scrollHeight + 3 }}>
                <h3 className="filterHeader">
                    <svg className="titleIcon">
                        <use href={'#diagramIcons_filter'} />
                    </svg>
                    <div className="titleText">{t('filter.view.title')}</div>
                    <TimesIcon
                        className="closeIcon"
                        description={t('filter.view.close')}
                        onClick={this.handleFilterClose}
                    />
                </h3>
                <Scrollbars
                    style={{ width: containerWidth, height: scrollHeight - 60 }}
                    renderView={this.renderView}
                    renderThumbVertical={this.renderThumbVertical}
                    ref={this.setContainerRef}
                    className="filter-sections-container"
                >
                    {sections.map((section, idx) => {
                        return (
                            <FilterSection
                                key={section.key}
                                section={section}
                                t={t}
                                showThreshold={idx === sections.length - 1 ? Number.MAX_SAFE_INTEGER : SHOW_MORE}
                            />
                        )
                    })}
                </Scrollbars>
            </div>
        )
    }

    renderView({ style, ...props }) {
        style.marginBottom = 0
        style['overflowY'] = 'scroll'
        style['overflowX'] = 'hidden'
        return <div {...props} style={{ ...style }} />
    }

    renderThumbVertical({ style, ...props }) {
        const finalStyle = {
            ...style,
            cursor: 'pointer',
            borderRadius: 'inherit',
            backgroundColor: 'rgba(255,255,255,.2)',
        }
        return <div className={'filter-sections-scrollbar'} style={finalStyle} {...props} />
    }

    getSectionData(key, availableFilters, t, activeSet = new Set()) {
        const { name, availableSet } = availableFilters
        const multipleChoices = availableSet.size > 1
        const other = t('overview.policy.overview.other')
        const filters = Array.from(availableSet)
            .map((v) => {
                const [value, label] = Array.isArray(v) ? v : [v, v]
                return {
                    key: key + value,
                    label,
                    isOther: value === other,
                    checked: !multipleChoices || activeSet.has(value),
                    onChange: !multipleChoices
                        ? () => {
                              // noop function for optional property
                          }
                        : this.onChange.bind(this, key, value),
                }
            })
            .filter(({ label }) => {
                return label && label.length !== 0
            })
        if (multipleChoices) {
            filters.unshift({
                key: key + 'all',
                label: t('filter.view.all'),
                isAll: true,
                checked: activeSet.size === 0,
                onChange: this.onChange.bind(this, key, 'all'),
            })
        }
        return {
            key,
            name,
            filters,
            isExpanded: this.state.expanded[key],
            onExpand: this.onExpand.bind(this, key),
        }
    }

    onChange = (key, value, checked) => {
        const { updateFilters } = this.props
        updateFilters(key, value, checked)
    }

    onExpand = (label) => {
        this.setState((prevState) => {
            const expanded = _.cloneDeep(prevState.expanded)
            expanded[label] = !expanded[label]
            return { expanded }
        })
    }

    handleFilterClose = () => {
        this.props.onClose()
    }
}

ResourceFilterView.propTypes = {
    activeFilters: PropTypes.object,
    availableFilters: PropTypes.object,
    onClose: PropTypes.func,
    t: PropTypes.func,
    updateFilters: PropTypes.func,
}

const clearFilterList = (activeFilters, updateActiveFilters) => {
    Object.keys(activeFilters).forEach((key) => {
        if (key !== 'type') {
            activeFilters[key].clear()
            updateActiveFilters(activeFilters)
        }
    })
}

const ResourceUnfilterBar = ({ activeFilters, boundFilters = [], updateActiveFilters, t }) => {
    return (
        <div className="resource-filter-bar">
            <ChipGroup
                categoryName={t('filter.remove.label')}
                numChips={8}
                isClosable
                onClick={() => clearFilterList(_.cloneDeep(activeFilters || {}), updateActiveFilters)}
            >
                {boundFilters.map(({ name, onClick }) => (
                    <Chip key={name} onClick={onClick}>
                        {name}
                    </Chip>
                ))}
            </ChipGroup>
        </div>
    )
}
ResourceUnfilterBar.propTypes = {
    activeFilters: PropTypes.object,
    boundFilters: PropTypes.array,
    t: PropTypes.func,
    updateActiveFilters: PropTypes.func,
}

export class ResourceFilterModule extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            filterViewOpen: false,
        }
        this.handleFilterClose = this.handleFilterClose.bind(this)
        this.updateFilters = this.updateFilters.bind(this)
        this.toggleFilterModel = this.toggleFilterModel.bind(this)
        this.toggleFilterModelPress = this.toggleFilterModelPress.bind(this)
    }

    render() {
        return (
            <React.Fragment>
                {this.renderResourceFilterButton()}
                {this.renderResourceFilterView()}
                {this.renderResourceUnfilterBar()}
            </React.Fragment>
        )
    }

    renderResourceFilterButton() {
        const { t } = this.props
        return (
            <div
                tabIndex="0"
                role={'button'}
                className="resource-filter-button"
                onClick={this.toggleFilterModel}
                onKeyPress={this.toggleFilterModelPress}
            >
                <svg className="button-icon">
                    <use href={'#diagramIcons_filter'} />
                </svg>
                <div className="button-label">{t('Filter')}</div>
            </div>
        )
    }

    renderResourceFilterView() {
        const { availableFilters = {}, activeFilters = {}, t } = this.props
        const { filterViewOpen } = this.state
        return (
            <CSSTransition
                in={filterViewOpen}
                timeout={300}
                classNames="transition"
                mountOnEnter={true}
                unmountOnExit={true}
            >
                <ResourceFilterView
                    updateFilters={this.updateFilters}
                    onClose={this.handleFilterClose}
                    activeFilters={activeFilters}
                    availableFilters={availableFilters}
                    t={t}
                />
            </CSSTransition>
        )
    }

    renderResourceUnfilterBar() {
        const { activeFilters, portals = {}, updateActiveFilters, t } = this.props
        const { assortedFilterCloseBtns } = portals
        if (assortedFilterCloseBtns) {
            const portal = document.getElementById(assortedFilterCloseBtns)
            if (portal) {
                const boundFilters = this.getBoundFilters(t)
                return ReactDOM.createPortal(
                    <ResourceUnfilterBar
                        activeFilters={activeFilters}
                        boundFilters={boundFilters}
                        updateActiveFilters={updateActiveFilters}
                        t={t}
                    />,
                    portal
                )
            }
        }
        return null
    }

    toggleFilterModel() {
        this.setState(({ filterViewOpen }) => {
            return { filterViewOpen: !filterViewOpen }
        })
    }

    toggleFilterModelPress(e) {
        if (e.key === 'Enter') {
            this.toggleFilterModel()
        }
    }

    handleFilterClose = () => {
        this.setState({ filterViewOpen: false })
    }

    updateFilters = (key, value, checked) => {
        this.updateActiveFilter(key, value, checked)
    }

    getBoundFilters(t) {
        const resourceStatusMap = new Map([
            ['green', t('topology.filter.category.status.success')],
            ['orange', t('topology.filter.category.status.pending')],
            ['yellow', t('topology.filter.category.status.warning')],
            ['red', t('topology.filter.category.status.error')],
        ])
        const boundFilters = []
        const { activeFilters = {} } = this.props
        Object.keys(activeFilters).forEach((key) => {
            if (key !== 'type') {
                const activeSet = activeFilters[key]
                activeSet.forEach((value) => {
                    let name = value
                    if (key === 'resourceStatuses') {
                        name = resourceStatusMap.get(value)
                    }
                    if (name.length > 26) {
                        name = name.substr(0, 12) + '..' + name.substr(-12)
                    }
                    boundFilters.push({
                        name,
                        onClick: this.removeActiveFilter.bind(this, key, value),
                    })
                })
            }
        })
        return boundFilters
    }

    removeActiveFilter(key, value) {
        this.updateActiveFilter(key, value, false)
    }

    updateActiveFilter = (key, value, checked) => {
        const { updateActiveFilters } = this.props
        const activeFilters = _.cloneDeep(this.props.activeFilters || {})
        let activeSet = activeFilters[key]
        if (!activeSet) {
            activeSet = activeFilters[key] = new Set()
        }
        if (value === 'all') {
            activeSet.clear()
        } else {
            if (checked) {
                activeSet.add(value)
            } else {
                activeSet.delete(value)
            }
        }
        updateActiveFilters(activeFilters)
    }
}

ResourceFilterModule.propTypes = {
    activeFilters: PropTypes.object,
    availableFilters: PropTypes.object,
    t: PropTypes.func,
    portals: PropTypes.object,
    updateActiveFilters: PropTypes.func,
}

export default ResourceFilterModule
