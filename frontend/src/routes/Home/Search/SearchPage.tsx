/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
import { ApolloError } from '@apollo/client'
import { makeStyles } from '@material-ui/styles'
import {
    AcmActionGroup,
    AcmAlert,
    AcmButton,
    AcmDropdown,
    AcmIcon,
    AcmIconVariant,
    AcmPage,
    AcmRoute,
    AcmScrollable,
    AcmSearchbar,
} from '@open-cluster-management/ui-components'
import { ButtonVariant, PageSection } from '@patternfly/react-core'
import _ from 'lodash'
import React, { Fragment, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRecoilState } from 'recoil'
import { acmRouteState } from '../../../atoms'
import { searchClient } from './search-sdk/search-client'
import {
    useGetMessagesQuery,
    UserSearch,
    useSavedSearchesQuery,
    useSearchCompleteQuery,
    useSearchSchemaQuery,
} from './search-sdk/search-sdk'
import HeaderWithNotification from './components/HeaderWithNotification'
import { SaveAndEditSearchModal } from './components/Modals/SaveAndEditSearchModal'
import { SearchInfoModal } from './components/Modals/SearchInfoModal'
import SavedSearchQueries from './components/SavedSearchQueries'
import SearchResults from './components/SearchResults'
import { convertStringToQuery, formatSearchbarSuggestions, getSearchCompleteString } from './search-helper'
import { transformBrowserUrlToSearchString, updateBrowserUrl } from './urlQuery'

const operators = ['=', '<', '>', '<=', '>=', '!=', '!']

const useStyles = makeStyles({
    actionGroup: {
        backgroundColor: 'var(--pf-global--BackgroundColor--100)',
        paddingRight: 'var(--pf-c-page__main-section--PaddingRight)',
        paddingLeft: 'var(--pf-c-page__main-section--PaddingLeft)',
        paddingBottom: 'var(--pf-c-page__header-sidebar-toggle__c-button--PaddingBottom)',
    },
    dropdown: {
        '& ul': {
            right: 'unset !important',
        },
    },
})

// Adds AcmAlert to page if there's errors from the Apollo queries.
function HandleErrors(schemaError: ApolloError | undefined, completeError: ApolloError | undefined) {
    const { t } = useTranslation()
    if (schemaError || completeError) {
        return (
            <div style={{ marginBottom: '1rem' }}>
                <AcmAlert
                    noClose
                    variant={
                        schemaError?.message.includes('not enabled') || completeError?.message.includes('not enabled')
                            ? 'info'
                            : 'danger'
                    }
                    isInline
                    title={
                        schemaError?.message.includes('not enabled') || completeError?.message.includes('not enabled')
                            ? t('search.filter.info.title')
                            : t('search.filter.errors.title')
                    }
                    subtitle={schemaError?.message || completeError?.message}
                />
            </div>
        )
    }
}

function RenderSearchBar(props: {
    searchQuery: string
    setCurrentQuery: React.Dispatch<React.SetStateAction<string>>
    setSelectedSearch: React.Dispatch<React.SetStateAction<string>>
    queryErrors: boolean
    setQueryErrors: React.Dispatch<React.SetStateAction<boolean>>
    savedSearchQueries: UserSearch[]
}) {
    const { searchQuery, setCurrentQuery, queryErrors, setQueryErrors, savedSearchQueries } = props
    const { t } = useTranslation()
    const [saveSearch, setSaveSearch] = useState<string>()
    const [open, toggleOpen] = useState<boolean>(false)
    const toggle = () => toggleOpen(!open)
    const searchSchemaResults = useSearchSchemaQuery({
        skip: searchQuery.endsWith(':') || operators.some((operator: string) => searchQuery.endsWith(operator)),
        client: process.env.NODE_ENV === 'test' ? undefined : searchClient,
    })

    const searchCompleteValue = getSearchCompleteString(searchQuery)
    const searchCompleteQuery = convertStringToQuery(searchQuery)
    searchCompleteQuery.filters = searchCompleteQuery.filters.filter((filter) => {
        return filter.property !== searchCompleteValue
    })
    const searchCompleteResults = useSearchCompleteQuery({
        skip: !searchQuery.endsWith(':') && !operators.some((operator: string) => searchQuery.endsWith(operator)),
        client: process.env.NODE_ENV === 'test' ? undefined : searchClient,
        variables: {
            property: searchCompleteValue,
            query: searchCompleteQuery,
        },
    })

    useEffect(() => {
        if (searchSchemaResults?.error || searchCompleteResults?.error) {
            setQueryErrors(true)
        } else if (queryErrors) {
            setQueryErrors(false)
        }
    }, [searchSchemaResults, searchCompleteResults, queryErrors, setQueryErrors])

    return (
        <Fragment>
            <PageSection>
                <SaveAndEditSearchModal
                    setSelectedSearch={props.setSelectedSearch}
                    saveSearch={saveSearch}
                    onClose={() => setSaveSearch(undefined)}
                    savedSearchQueries={savedSearchQueries}
                />
                <SearchInfoModal isOpen={open} onClose={() => toggleOpen(false)} />
                {HandleErrors(searchSchemaResults.error, searchCompleteResults.error)}
                <div style={{ display: 'flex' }}>
                    <AcmSearchbar
                        loadingSuggestions={searchSchemaResults.loading || searchCompleteResults.loading}
                        queryString={searchQuery}
                        suggestions={
                            searchQuery === '' ||
                            (!searchQuery.endsWith(':') &&
                                !operators.some((operator: string) => searchQuery.endsWith(operator)))
                                ? formatSearchbarSuggestions(
                                      _.get(searchSchemaResults, 'data.searchSchema.allProperties', []),
                                      'filter',
                                      '' // Dont need to de-dupe filters
                                  )
                                : formatSearchbarSuggestions(
                                      _.get(searchCompleteResults, 'data.searchComplete', []),
                                      'value',
                                      searchQuery // pass current search query in order to de-dupe already selected values
                                  )
                        }
                        currentQueryCallback={(newQuery) => {
                            setCurrentQuery(newQuery)
                            updateBrowserUrl(newQuery)
                            if (newQuery !== searchQuery) {
                                props.setSelectedSearch('Saved searches')
                            }
                        }}
                        toggleInfoModal={toggle}
                    />
                    <AcmButton
                        style={{ marginLeft: '1rem' }}
                        onClick={() => setSaveSearch(searchQuery)}
                        isDisabled={searchQuery === ''}
                    >
                        {t('Save search')}
                    </AcmButton>
                </div>
            </PageSection>
        </Fragment>
    )
}

function RenderDropDownAndNewTab(props: {
    selectedSearch: string
    setSelectedSearch: React.Dispatch<React.SetStateAction<string>>
    setCurrentQuery: React.Dispatch<React.SetStateAction<string>>
    savedSearchQueries: UserSearch[]
}) {
    const classes = useStyles()
    const { t } = useTranslation()

    const SelectQuery = (id: string) => {
        if (id === 'savedSearchesID') {
            props.setCurrentQuery('')
            updateBrowserUrl('')
            props.setSelectedSearch('Saved searches')
        } else {
            const selectedQuery = props.savedSearchQueries!.filter((query) => query!.id === id)
            props.setCurrentQuery(selectedQuery[0]!.searchText || '')
            updateBrowserUrl(selectedQuery[0]!.searchText || '')
            props.setSelectedSearch(selectedQuery[0]!.name || '')
        }
    }

    const SavedSearchDropdown = (props: { selectedSearch: string; savedSearchQueries: UserSearch[] }) => {
        const dropdownItems: any[] = props.savedSearchQueries.map((query) => {
            return { id: query!.id, text: query!.name }
        })

        dropdownItems.unshift({ id: 'savedSearchesID', text: 'Saved searches' })

        return (
            <div className={classes.dropdown}>
                <AcmDropdown
                    isDisabled={false}
                    id="dropdown"
                    onSelect={(id) => {
                        SelectQuery(id)
                    }}
                    text={props.selectedSearch}
                    dropdownItems={dropdownItems}
                    isKebab={false}
                />
            </div>
        )
    }

    return (
        <div className={classes.actionGroup}>
            <AcmActionGroup>
                <SavedSearchDropdown
                    selectedSearch={props.selectedSearch}
                    savedSearchQueries={props.savedSearchQueries}
                />
                <AcmButton
                    href={'/multicloud/search'}
                    variant={ButtonVariant.link}
                    component="a"
                    target="_blank"
                    rel="noreferrer"
                    id={'newsearchtab'}
                    icon={<AcmIcon icon={AcmIconVariant.openNewTab} />}
                    iconPosition="right"
                >
                    {t('Open new search tab')}
                </AcmButton>
            </AcmActionGroup>
        </div>
    )
}

export default function SearchPage() {
    const [, setRoute] = useRecoilState(acmRouteState)
    useEffect(() => setRoute(AcmRoute.Search), [setRoute])
    // Only using setCurrentQuery to trigger a re-render
    // useEffect using window.location to trigger re-render doesn't work cause react hooks can't use window
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {
        prefillSearchQuery: searchQuery = '',
        preSelectedRelatedResources = [], // used to show any related resource on search page navigation
    } = transformBrowserUrlToSearchString(window.location.search || '')
    const [currentQuery, setCurrentQuery] = useState(searchQuery)
    const [selectedSearch, setSelectedSearch] = useState('Saved searches')
    const [queryErrors, setQueryErrors] = useState(false)
    const [queryMessages, setQueryMessages] = useState<any[]>([])

    useEffect(() => {
        setCurrentQuery(currentQuery)
    }, [currentQuery])
    useEffect(() => {
        if (searchQuery === '') {
            setSelectedSearch('Saved searches')
        }
    }, [searchQuery])

    const query = convertStringToQuery(searchQuery)

    const { data } = useSavedSearchesQuery({
        client: process.env.NODE_ENV === 'test' ? undefined : searchClient,
    })
    const savedSearchQueries = (data?.items as UserSearch[]) ?? ([] as UserSearch[])

    const msgQuery = useGetMessagesQuery({
        client: process.env.NODE_ENV === 'test' ? undefined : searchClient,
    })
    useEffect(() => {
        if (msgQuery.data?.messages) {
            setQueryMessages(msgQuery.data?.messages)
        }
    }, [queryMessages, msgQuery])

    return (
        <AcmPage
            header={
                <div>
                    <HeaderWithNotification messages={queryMessages} />
                    <RenderDropDownAndNewTab
                        selectedSearch={selectedSearch}
                        setSelectedSearch={setSelectedSearch}
                        setCurrentQuery={setCurrentQuery}
                        savedSearchQueries={savedSearchQueries}
                    />
                </div>
            }
        >
            <AcmScrollable>
                <RenderSearchBar
                    setSelectedSearch={setSelectedSearch}
                    searchQuery={searchQuery}
                    setCurrentQuery={setCurrentQuery}
                    queryErrors={queryErrors}
                    setQueryErrors={setQueryErrors}
                    savedSearchQueries={savedSearchQueries}
                />
                {!queryErrors ? (
                    searchQuery !== '' && (query.keywords.length > 0 || query.filters.length > 0) ? (
                        <SearchResults
                            currentQuery={searchQuery}
                            preSelectedRelatedResources={preSelectedRelatedResources}
                        />
                    ) : (
                        <SavedSearchQueries setSelectedSearch={setSelectedSearch} setCurrentQuery={setCurrentQuery} />
                    )
                ) : null}
            </AcmScrollable>
        </AcmPage>
    )
}
