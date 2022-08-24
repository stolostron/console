/* Copyright Contributors to the Open Cluster Management project */

// @types/react-tag-autocomplete is not up-to-date with react-tag-autocomplete library
// using the following line to override for time being
declare module 'react-tag-autocomplete'
import { Button } from '@patternfly/react-core'
import HelpIcon from '@patternfly/react-icons/dist/js/icons/help-icon'
import SearchIcon from '@patternfly/react-icons/dist/js/icons/search-icon'
import TimesIcon from '@patternfly/react-icons/dist/js/icons/times-icon'
import { createRef, useEffect, useState } from 'react'
import { useHistory } from 'react-router-dom'
import ReactTags from 'react-tag-autocomplete'
import './AcmSearchbar.css'
import { convertStringToTags } from './helper'

const operators = ['=', '<', '>', '<=', '>=', '!=', '!']

export type DropdownSuggestionsProps = {
    id: string | number
    name: string
    kind?: 'filter' | 'value' | 'label'
    disabled?: boolean
}

type AcmSearchbarProps = {
    loadingSuggestions: boolean
    queryString: string
    suggestions: DropdownSuggestionsProps[]
    currentQueryCallback: (query: string) => void
    toggleInfoModal: () => void
    updateBrowserUrl: (history: any, currentQuery: string) => void
}

export function AcmSearchbar(props: AcmSearchbarProps) {
    const history = useHistory()
    const reactTags: any = createRef()
    const { loadingSuggestions, suggestions, queryString, currentQueryCallback, toggleInfoModal, updateBrowserUrl } =
        props
    const [currentQuery, setCurrentQuery] = useState(queryString)
    const [searchbarTags, setSearchbarTags] = useState(convertStringToTags(currentQuery))

    // rerender component with new props after initial load
    useEffect(() => {
        setCurrentQuery(queryString)
        setSearchbarTags(convertStringToTags(queryString))
    }, [queryString])

    function keyDownHandler(event: React.KeyboardEvent) {
        // dont run a search if the user has text in the input element.
        const currentInputText = document.getElementsByClassName('react-tags__search-input')[0] as HTMLInputElement
        if (
            event.key === 'Enter' &&
            currentQuery !== '' &&
            !currentQuery.endsWith(':') &&
            currentInputText.value === ''
        ) {
            updateBrowserUrl(history, currentQuery)
            document.getElementById('inputDropdownButton1')?.focus()
        }
    }

    return (
        <div className={'searchbar-container'} onKeyDown={keyDownHandler}>
            <SearchIcon className={'search-icon'} noVerticalAlign />
            <ReactTags
                ref={reactTags}
                ariaLabelText={'search-bar'}
                placeholderText={''}
                tags={searchbarTags}
                suggestions={
                    loadingSuggestions !== true ? suggestions : [{ id: 'loading', name: 'Loading...', disabled: true }]
                }
                suggestionsFilter={(suggestion: DropdownSuggestionsProps, query: string) => {
                    return suggestion.name.toLowerCase().includes(query.toLowerCase())
                }}
                onDelete={(idx: number) => {
                    if (idx >= 0) {
                        const newSearchbarTags = searchbarTags
                        // need to check if there are 2+ values @ tag[idx] - if there are we only delete the last one
                        const tagToDelete = newSearchbarTags[idx]
                        if (tagToDelete.name.includes(',')) {
                            const values = tagToDelete.name.split(',')
                            values.splice(values.length - 1, 1)
                            tagToDelete.name = values.join(',')
                        } else {
                            newSearchbarTags.splice(idx, 1)
                        }
                        setCurrentQuery(newSearchbarTags.map((tag) => tag.name).join(' '))
                        currentQueryCallback(newSearchbarTags.map((tag) => tag.name).join(' '))
                        setSearchbarTags(newSearchbarTags)
                    }
                }}
                onAddition={(tag: DropdownSuggestionsProps) => {
                    if (
                        (!tag.id && tag.name === '') ||
                        (operators.some((operator: string) => currentQuery.endsWith(operator)) &&
                            isNaN(parseInt(tag.name, 10)))
                    ) {
                        // don't allow blank tags to be added to searchbar
                        // don't allow non-ints to be added when using an operator
                        return
                    }
                    if (tag.kind === 'filter') {
                        const newQueryString = `${currentQuery === '' ? '' : `${currentQuery} `}${tag.name}:`
                        setCurrentQuery(newQueryString)
                        currentQueryCallback(newQueryString)
                        setSearchbarTags(convertStringToTags(newQueryString))
                    } else if (tag.kind === 'value' || currentQuery.endsWith(':')) {
                        const newQueryString = `${currentQuery}${tag.name}`
                        const tags = convertStringToTags(newQueryString)
                        if (tags.length > 1) {
                            const lastTag = tags[tags.length - 1]
                            tags.forEach((t, idx) => {
                                if (
                                    idx !== tags.length - 1 &&
                                    lastTag &&
                                    t.name.split(':')[0] === lastTag.name.split(':')[0]
                                ) {
                                    t.name = `${t.name},${lastTag.name.split(':')[1]}`
                                    tags.pop()
                                }
                                return t
                            })
                        }
                        setCurrentQuery(tags.map((t) => t.name).join(' '))
                        currentQueryCallback(tags.map((t) => t.name).join(' '))
                        setSearchbarTags(tags)
                    } else if (
                        operators.some((operator: string) => currentQuery.endsWith(operator)) &&
                        !isNaN(parseInt(tag.name, 10))
                    ) {
                        // case for user adding a number after operator
                        const newQueryString = `${currentQuery}${tag.name}`
                        const tags = convertStringToTags(newQueryString)
                        setCurrentQuery(tags.map((t) => t.name).join(' '))
                        currentQueryCallback(tags.map((t) => t.name).join(' '))
                        setSearchbarTags(tags)
                    } else {
                        // adding a keyword - not an item from dropdown suggestions
                        const newQueryString = `${currentQuery === '' ? '' : `${currentQuery} `}${tag.name}`
                        setCurrentQuery(newQueryString)
                        currentQueryCallback(newQueryString)
                        setSearchbarTags(convertStringToTags(newQueryString))
                    }
                }}
                noSuggestionsText={'No matching filters'}
                autoresize={true}
                minQueryLength={0}
                allowNew={true}
                delimiters={[' ', ':', ',', 'Enter']}
                maxSuggestionsLength={Number.MAX_SAFE_INTEGER}
            />
            <TimesIcon
                id={'clear-all-search-tags-button'}
                className={'clear-button'}
                onClick={() => {
                    setCurrentQuery('')
                    currentQueryCallback('')
                    setSearchbarTags([])
                    reactTags.current.clearInput()
                }}
                noVerticalAlign
                title={'Remove current search tags'}
            />
            <HelpIcon
                id={'toggle-searchbar-help-button'}
                className={'help-button'}
                onClick={toggleInfoModal}
                noVerticalAlign
                title={'Open help modal'}
            />
            <Button
                id="inputDropdownButton1"
                variant="control"
                onClick={() => {
                    if (currentQuery !== '' && !currentQuery.endsWith(':')) {
                        updateBrowserUrl(history, currentQuery)
                    }
                }}
                style={{
                    width: '125px',
                    height: '100%',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                }}
            >
                {'Run search'}
            </Button>
        </div>
    )
}
