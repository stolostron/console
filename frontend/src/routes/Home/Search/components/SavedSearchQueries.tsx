/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
import { PageSection } from '@patternfly/react-core'
import { Fragment, useCallback, useMemo, useState } from 'react'
import { useHistory } from 'react-router-dom'
import { useTranslation } from '../../../../lib/acm-i18next'
import { SavedSearch, UserPreference } from '../../../../resources/userpreference'
import { useSharedAtoms } from '../../../../shared-recoil'
import { AcmCountCard, AcmExpandableWrapper } from '../../../../ui-components'
import { convertStringToQuery } from '../search-helper'
import { searchClient } from '../search-sdk/search-client'
import { useSearchResultCountQuery } from '../search-sdk/search-sdk'
import { updateBrowserUrl } from '../urlQuery'
import { DeleteSearchModal } from './Modals/DeleteSearchModal'
import { SaveAndEditSearchModal } from './Modals/SaveAndEditSearchModal'
import { ShareSearchModal } from './Modals/ShareSearchModal'
import { useSuggestedQueryTemplates } from './SuggestedQueryTemplates'

export default function SavedSearchQueries(props: {
  isUserPreferenceLoading: boolean
  savedSearches: SavedSearch[]
  setSelectedSearch: React.Dispatch<React.SetStateAction<string>>
  userPreference?: UserPreference
  setUserPreference: React.Dispatch<React.SetStateAction<UserPreference | undefined>>
}) {
  const { isUserPreferenceLoading, savedSearches, setSelectedSearch, userPreference, setUserPreference } = props
  const { t } = useTranslation()
  const history = useHistory()
  const { useSearchResultLimit } = useSharedAtoms()
  const searchResultLimit = useSearchResultLimit()
  const [editSavedSearch, setEditSavedSearch] = useState<SavedSearch | undefined>(undefined)
  const [shareSearch, setShareSearch] = useState<SavedSearch | undefined>(undefined)
  const [deleteSearch, setDeleteSearch] = useState<SavedSearch | undefined>(undefined)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const suggestedQueryTemplates = useSuggestedQueryTemplates().templates ?? ([] as SavedSearch[])
  // combine the suggested queries and saved queries
  const input = useMemo(
    () => [
      ...savedSearches.map((query) => convertStringToQuery(query.searchText, searchResultLimit)),
      ...suggestedQueryTemplates.map((query: { searchText: string }) =>
        convertStringToQuery(query.searchText, searchResultLimit)
      ),
    ],
    [savedSearches, suggestedQueryTemplates, searchResultLimit]
  )
  const { data, error, loading } = useSearchResultCountQuery({
    variables: { input: input },
    skip: isUserPreferenceLoading, // avoid unnecessary query until we have saved search array
    client: process.env.NODE_ENV === 'test' ? undefined : searchClient,
  })

  const handleKeyPress = useCallback(
    (KeyboardEvent: React.KeyboardEvent, query: SavedSearch) => {
      if (KeyboardEvent.key === 'Enter' || KeyboardEvent.key === ' ') {
        updateBrowserUrl(history, query.searchText)
        setSelectedSearch(query.name)
      }
    },
    [history, setSelectedSearch]
  )

  if (loading) {
    return (
      <PageSection>
        <AcmExpandableWrapper id={'loading-wrapper'} withCount={false} expandable={false}>
          <AcmCountCard key={1} loading />
          <AcmCountCard key={2} loading />
          <AcmCountCard key={3} loading />
        </AcmExpandableWrapper>
      </PageSection>
    )
  } else if (!loading && !error && (!data || !data.searchResult)) {
    return <Fragment />
  } else {
    return (
      <PageSection>
        {editSavedSearch && (
          <SaveAndEditSearchModal
            setSelectedSearch={setSelectedSearch}
            savedSearch={editSavedSearch}
            onClose={() => setEditSavedSearch(undefined)}
            savedSearchQueries={savedSearches}
            userPreference={userPreference}
            setUserPreference={setUserPreference}
          />
        )}
        {shareSearch && <ShareSearchModal shareSearch={shareSearch} onClose={() => setShareSearch(undefined)} />}
        {deleteSearch && (
          <DeleteSearchModal
            onClose={() => setDeleteSearch(undefined)}
            searchToDelete={deleteSearch}
            userPreference={userPreference}
            setUserPreference={setUserPreference}
          />
        )}
        {savedSearches.length > 0 && (
          <AcmExpandableWrapper
            id={'saved-searches'}
            headerLabel={t('Saved searches')}
            withCount={false}
            expandable={true}
            minWidth={300}
          >
            {savedSearches.map((savedSearch, index) => {
              const isErrorIndex = (error && error?.graphQLErrors.findIndex((error) => error.path?.[1] === index)) ?? -1
              return (
                <AcmCountCard
                  key={parseInt(savedSearch.id)}
                  cardHeader={{
                    hasIcon: false,
                    title: savedSearch.name,
                    description: savedSearch.description ?? '',
                    actions: [
                      {
                        text: t('Edit'),
                        handleAction: () => setEditSavedSearch(savedSearch),
                      },
                      {
                        text: t('Share'),
                        handleAction: () => setShareSearch(savedSearch),
                      },
                      {
                        text: t('Delete'),
                        handleAction: () => setDeleteSearch(savedSearch),
                      },
                    ],
                  }}
                  onCardClick={() => {
                    updateBrowserUrl(history, savedSearch.searchText)
                    setSelectedSearch(savedSearch.name)
                  }}
                  count={data?.searchResult?.[index]?.count ?? 0}
                  countTitle={t('Results')}
                  onKeyPress={(KeyboardEvent: React.KeyboardEvent) => handleKeyPress(KeyboardEvent, savedSearch)}
                  error={isErrorIndex > -1}
                  errorMessage={error && error?.graphQLErrors[isErrorIndex]?.message}
                />
              )
            })}
          </AcmExpandableWrapper>
        )}
        <AcmExpandableWrapper
          id={'suggested-search-templates'}
          headerLabel={t('Suggested search templates')}
          withCount={false}
          expandable={false}
          minWidth={300}
        >
          {suggestedQueryTemplates.map((query, index) => {
            return (
              <AcmCountCard
                key={index}
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
                  updateBrowserUrl(history, query.searchText)
                }}
                count={data?.searchResult?.[savedSearches.length + index]?.count ?? 0} // use length of savedSearches + current indeex as we run saved and suggested queries in same search request.
                countTitle={t('Results')}
                onKeyPress={(KeyboardEvent: React.KeyboardEvent) => handleKeyPress(KeyboardEvent, query)}
              />
            )
          })}
        </AcmExpandableWrapper>
      </PageSection>
    )
  }
}
