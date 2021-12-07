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
import { SearchInput } from '@patternfly/react-core'
import { getSearchNames } from './helpers/filterHelper'

class Search extends React.Component {
    static propTypes = {
        locale: PropTypes.string,
        onNameSearch: PropTypes.func,
        searchName: PropTypes.string,
    }

    constructor(props) {
        super(props)
        this.state = {
            searchName: props.searchName,
        }
        this.nameSearchMode = false
    }

    handleSearch = (value) => {
        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout)
        }

        // if user clicks close button, stop search immediately
        const searchName = value || ''
        this.setState({ searchName })
        if (searchName.length > 0 || this.nameSearchMode) {
            // if not in search mode yet, wait for an input > 2 chars
            // if in search mode, keep in mode until no chars left
            const { searchNames } = getSearchNames(searchName)
            const refreshSearch = searchNames.filter((s) => s.length > 1).length > 0
            if (refreshSearch || searchName.length === 0) {
                this.typingTimeout = setTimeout(
                    () => {
                        this.props.onNameSearch(searchName)
                    },
                    searchName.length > 0 ? 500 : 1500
                )
                this.nameSearchMode = searchName.length > 0
            }
        }
    }

    handleClear = () => {
        this.setState({ searchName: '' })
        this.props.onNameSearch('')
    }

    setNameSearchRef = (ref) => {
        this.nameSearchRef = ref
    }

    shouldComponentUpdate(nextProps, nextState) {
        return this.state.searchName !== nextState.searchName
    }

    render() {
        const { locale } = this.props
        const { searchName } = this.state
        const searchTitle = t('name.label')
        const searchMsgKey = 'search.label.links'
        return (
            <div
                role="region"
                className="search-filter"
                ref={this.setNameSearchRef}
                aria-label={searchTitle}
                id={searchTitle}
            >
                <SearchInput
                    id="search-name"
                    aria-label="Search-input"
                    value={searchName}
                    placeholder={t(searchMsgKey)}
                    onChange={this.handleSearch}
                    onClear={this.handleClear}
                />
            </div>
        )
    }
}

export default Search
