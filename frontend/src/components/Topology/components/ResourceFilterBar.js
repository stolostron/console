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

import React from 'react'
import PropTypes from 'prop-types'
import { Chip, ChipGroup } from '@patternfly/react-core'
import '../css/resource-filter-view.css'
import _ from 'lodash'

const clearFilterList = (activeFilters, updateActiveFilters) => {
    Object.keys(activeFilters).forEach((key) => {
        if (key !== 'type') {
            activeFilters[key].clear()
            updateActiveFilters(activeFilters)
        }
    })
}

const getBoundFilters = (activeFilters, updateActiveFilters, t) => {
    const resourceStatusMap = new Map([
        ['green', t('Success')],
        ['orange', t('Unknown')],
        ['yellow', t('Warning')],
        ['red', t('Error')],
    ])
    const boundFilters = []
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
                    onClick: ((key, value) => {
                        activeFilters = _.cloneDeep(activeFilters)
                        let activeSet = activeFilters[key]
                        activeSet.delete(value)
                        updateActiveFilters(activeFilters)
                    }).bind(null, key, value),
                })
            })
        }
    })
    return boundFilters
}

const ResourceFilterBar = ({ activeFilters, updateActiveFilters, t }) => {
    const boundFilters = getBoundFilters(activeFilters, updateActiveFilters, t)
    return (
        <div className="resource-filter-bar">
            <ChipGroup
                categoryName={t('Show only:')}
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

ResourceFilterBar.propTypes = {
    activeFilters: PropTypes.object,
    t: PropTypes.func,
    updateActiveFilters: PropTypes.func,
}

export default ResourceFilterBar
