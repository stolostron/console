/* Copyright Contributors to the Open Cluster Management project */
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


import PropTypes from 'prop-types'
import { Checkbox } from '@patternfly/react-core'
import '../css/resource-filter-view.css'
import _ from 'lodash'

//if section has more then this number of filters, add "show more"
const SHOW_MORE = 10

const ShowOrMoreItem = ({ count, isExpanded, onExpand, t }) => {
    return (
        <div className="filter-section-expand" tabIndex="0" role={'button'} onClick={onExpand} onKeyPress={onExpand}>
            {isExpanded ? t('See less') : t('See {{0}} more', [count])}
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
            activeFilters: _.cloneDeep(this.props.activeFilters || {}),
        }
    }

    render() {
        const { availableFilters = {}, t } = this.props
        const { activeFilters } = this.state

        // add filter sections
        const sections = []

        Object.keys(availableFilters).forEach((key) => {
            if (key !== 'type') {
                sections.push(this.getSectionData(key, availableFilters[key], t, activeFilters[key]))
            }
        })

        return (
            <div className="resource-filter-view" ref={this.setFilterViewRef}>
                <div ref={this.setContainerRef} className="filter-sections-container">
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
                </div>
            </div>
        )
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
                        : this.updateActiveFilter.bind(this, key, value),
                }
            })
            .filter(({ label }) => {
                return label && label.length !== 0
            })
        if (multipleChoices) {
            filters.unshift({
                key: key + 'all',
                label: t('All'),
                isAll: true,
                checked: activeSet.size === 0,
                onChange: this.updateActiveFilter.bind(this, key, 'all'),
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

    onExpand = (label) => {
        this.setState((prevState) => {
            const expanded = _.cloneDeep(prevState.expanded)
            expanded[label] = !expanded[label]
            return { expanded }
        })
    }

    updateActiveFilter = (key, value, checked) => {
        const { updateActiveFilters } = this.props
        let { activeFilters } = this.state
        activeFilters = _.cloneDeep(activeFilters)
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
        this.setState({ activeFilters })
        updateActiveFilters(activeFilters)
    }
}

ResourceFilterView.propTypes = {
    activeFilters: PropTypes.object,
    availableFilters: PropTypes.object,
    t: PropTypes.func,
    updateActiveFilters: PropTypes.func,
}

export default ResourceFilterView
