/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { searchClient } from '../search-sdk/search-client'
import { useSavedSearchesQuery, useSearchResultCountQuery, UserSearch } from '../search-sdk/search-sdk'
import { convertStringToQuery } from '../search-helper'
import SuggestQueryTemplates from './SuggestedQueryTemplates'
import { AcmAlert, AcmExpandableWrapper, AcmCountCard } from '@open-cluster-management/ui-components'
import { updateBrowserUrl } from '../urlQuery'
import { SaveAndEditSearchModal } from './Modals/SaveAndEditSearchModal'
import { DeleteSearchModal } from './Modals/DeleteSearchModal'
import { ShareSearchModal } from './Modals/ShareSearchModal'
import { PageSection } from '@patternfly/react-core'

export type userSearch = {
    count: number
    description: string
    id: string
    name: string
    searchText: string
}

function SearchResultCount(
    input: any,
    queries: any,
    suggestedQueryTemplates: any,
    setCurrentQuery: React.Dispatch<React.SetStateAction<string>>,
    setSelectedSearch: React.Dispatch<React.SetStateAction<string>>
): any {
    const { t } = useTranslation()
    const { data, error, loading } = useSearchResultCountQuery({
        variables: { input: input },
        client: process.env.NODE_ENV === 'test' ? undefined : searchClient,
    })

    const [editSearch, setEditSearch] = useState(undefined)
    const [shareSearch, setShareSearch] = useState(undefined)
    const [deleteSearch, setDeleteSearch] = useState(undefined)

    const handleKeyPress = (KeyboardEvent: React.KeyboardEvent, query: userSearch) => {
        if (KeyboardEvent.key === 'Enter' || KeyboardEvent.key === ' ') {
            setCurrentQuery(query.searchText)
            updateBrowserUrl(query.searchText)
            setSelectedSearch(query.name)
        }
        return
    }

    if (loading) {
        return (
            <PageSection>
                <AcmExpandableWrapper withCount={false} expandable={false}>
                    <AcmCountCard loading />
                    <AcmCountCard loading />
                    <AcmCountCard loading />
                </AcmExpandableWrapper>
            </PageSection>
        )
    } else if (error) {
        return (
            <PageSection>
                <AcmAlert
                    noClose={true}
                    variant={'danger'}
                    isInline={true}
                    title={t('Query error related to saved search results.')}
                    subtitle={error ? error.message : ''}
                />
            </PageSection>
        )
    } else if (!loading && !error && (!data || !data.searchResult)) {
        return null
    } else if (data && data.searchResult) {
        const savedQueriesResult = data.searchResult.slice(0, queries.length).map((query, index) => {
            return { ...query, ...queries[index] }
        })
        const suggestedQueriesResult = data.searchResult.slice(queries.length).map((query, index) => {
            return { ...query, ...suggestedQueryTemplates[index] }
        })
        return (
            <PageSection>
                <SaveAndEditSearchModal
                    setSelectedSearch={setSelectedSearch}
                    editSearch={editSearch}
                    onClose={() => setEditSearch(undefined)}
                    savedSearchQueries={queries}
                />
                <ShareSearchModal shareSearch={shareSearch} onClose={() => setShareSearch(undefined)} />
                <DeleteSearchModal deleteSearch={deleteSearch} onClose={() => setDeleteSearch(undefined)} />

                {savedQueriesResult.length > 0 && (
                    <AcmExpandableWrapper
                        maxHeight={'16.5rem'}
                        headerLabel={t('Saved searches')}
                        withCount={true}
                        expandable={true}
                    >
                        {savedQueriesResult.map((query) => {
                            return (
                                <AcmCountCard
                                    key={query.id}
                                    cardHeader={{
                                        hasIcon: false,
                                        title: query.name,
                                        description: query.description,
                                        actions: [
                                            {
                                                text: t('Edit'),
                                                handleAction: () => setEditSearch(query),
                                            },
                                            {
                                                text: t('Share'),
                                                handleAction: () => setShareSearch(query),
                                            },
                                            {
                                                text: t('Delete'),
                                                handleAction: () => setDeleteSearch(query),
                                            },
                                        ],
                                    }}
                                    onCardClick={() => {
                                        setCurrentQuery(query.searchText)
                                        updateBrowserUrl(query.searchText)
                                        setSelectedSearch(query.name)
                                    }}
                                    count={query.count}
                                    countTitle={t('Results')}
                                    onKeyPress={(KeyboardEvent: React.KeyboardEvent) =>
                                        handleKeyPress(KeyboardEvent, query)
                                    }
                                />
                            )
                        })}
                    </AcmExpandableWrapper>
                )}
                {suggestedQueriesResult.length > 0 && (
                    <AcmExpandableWrapper
                        headerLabel={t('Suggested search templates')}
                        withCount={false}
                        expandable={false}
                    >
                        {suggestedQueriesResult.map((query) => {
                            return (
                                <AcmCountCard
                                    key={query.id}
                                    cardHeader={{
                                        hasIcon: true,
                                        title: query.name,
                                        description: query.description,
                                        actions: [
                                            {
                                                text: t('Share'),
                                                handleAction: () => setShareSearch(query),
                                            },
                                        ],
                                    }}
                                    onCardClick={() => {
                                        setCurrentQuery(query.searchText)
                                        updateBrowserUrl(query.searchText)
                                    }}
                                    count={query.count}
                                    countTitle={t('Results')}
                                    onKeyPress={(KeyboardEvent: React.KeyboardEvent) =>
                                        handleKeyPress(KeyboardEvent, query)
                                    }
                                />
                            )
                        })}
                    </AcmExpandableWrapper>
                )}
            </PageSection>
        )
    }
}

export default function SavedSearchQueries(props: {
    setSelectedSearch: React.Dispatch<React.SetStateAction<string>>
    setCurrentQuery: React.Dispatch<React.SetStateAction<string>>
}) {
    const { data } = useSavedSearchesQuery({
        client: process.env.NODE_ENV === 'test' ? undefined : searchClient,
    })
    const queries = data?.items ?? ([] as UserSearch[])
    // each query should contain ---- description, name, results = [], resultHeader
    const suggestedQueryTemplates = SuggestQueryTemplates?.templates ?? ([] as UserSearch[])
    // combine the suggested queries and saved queries
    const input = [
        ...queries.map((query) => convertStringToQuery(query!.searchText as string)),
        ...suggestedQueryTemplates.map((query: { searchText: string }) => convertStringToQuery(query.searchText)),
    ]
    return SearchResultCount(input, queries, suggestedQueryTemplates, props.setCurrentQuery, props.setSelectedSearch)
}
