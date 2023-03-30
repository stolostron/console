/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
import { ApolloError } from '@apollo/client'
import { makeStyles } from '@mui/styles'
import {
  ButtonVariant,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  PageSection,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core'
import { ExclamationCircleIcon, ExternalLinkAltIcon, InfoCircleIcon } from '@patternfly/react-icons'
import _ from 'lodash'
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { useHistory } from 'react-router-dom'
import { useTranslation } from '../../../lib/acm-i18next'
import { NavigationPath } from '../../../NavigationPath'
import { getUserPreference, SavedSearch, UserPreference } from '../../../resources/userpreference'
import { useSharedAtoms } from '../../../shared-recoil'
import { AcmActionGroup, AcmButton, AcmDropdown, AcmPage, AcmScrollable } from '../../../ui-components'
import HeaderWithNotification from './components/HeaderWithNotification'
import { SaveAndEditSearchModal } from './components/Modals/SaveAndEditSearchModal'
import { SearchInfoModal } from './components/Modals/SearchInfoModal'
import SavedSearchQueries from './components/SavedSearchQueries'
import { Searchbar } from './components/Searchbar'
import { convertStringToQuery, formatSearchbarSuggestions, getSearchCompleteString, operators } from './search-helper'
import { searchClient } from './search-sdk/search-client'
import {
  useGetMessagesQuery,
  useSearchCompleteQuery,
  useSearchResultItemsQuery,
  useSearchSchemaQuery,
} from './search-sdk/search-sdk'
import SearchResults from './SearchResults/SearchResults'
import { transformBrowserUrlToSearchString, updateBrowserUrl } from './urlQuery'

const useStyles = makeStyles({
  actionGroup: {
    backgroundColor: 'var(--pf-global--BackgroundColor--100)',
    paddingRight: 'var(--pf-c-page__main-section--PaddingRight)',
    paddingLeft: 'var(--pf-c-page__main-section--PaddingLeft)',
    paddingBottom: 'var(--pf-c-page__header-sidebar-toggle__c-button--PaddingBottom)',
    paddingTop: 'var(--pf-c-page__header-sidebar-toggle__c-button--PaddingTop)',
  },
  dropdown: {
    '& ul': {
      right: 'unset !important',
    },
  },
})

function HandleErrors(schemaError: ApolloError | undefined, completeError: ApolloError | undefined) {
  const { t } = useTranslation()
  const notEnabled = 'not enabled'
  if (schemaError?.message.includes(notEnabled) || completeError?.message.includes(notEnabled)) {
    return (
      <EmptyState>
        <EmptyStateIcon icon={InfoCircleIcon} color={'var(--pf-global--info-color--100)'} />
        <Title size="lg" headingLevel="h4">
          {t('search.filter.info.title')}
        </Title>
        <EmptyStateBody>{schemaError?.message || completeError?.message}</EmptyStateBody>
      </EmptyState>
    )
  } else if (schemaError || completeError) {
    const unexpectedToken = 'Unexpected token'
    const extraErrorInfo =
      (!schemaError?.message.includes(unexpectedToken) &&
        !completeError?.message.includes(unexpectedToken) &&
        schemaError?.message) ||
      completeError?.message
    return (
      <EmptyState>
        <EmptyStateIcon icon={ExclamationCircleIcon} color={'var(--pf-global--danger-color--100)'} />
        <Title size="lg" headingLevel="h4">
          {t('search.filter.errors.title')}
        </Title>
        <EmptyStateBody>
          <Stack>
            <StackItem>{t('Error occurred while contacting the search service.')}</StackItem>
            <StackItem>{extraErrorInfo}</StackItem>
          </Stack>
        </EmptyStateBody>
      </EmptyState>
    )
  }
  return <Fragment />
}

function RenderSearchBar(props: {
  presetSearchQuery: string
  setSelectedSearch: React.Dispatch<React.SetStateAction<string>>
  queryErrors: boolean
  setQueryErrors: React.Dispatch<React.SetStateAction<boolean>>
  savedSearchQueries: SavedSearch[]
  userPreference?: UserPreference
  setUserPreference: React.Dispatch<React.SetStateAction<UserPreference | undefined>>
  refetchSearch: any
  searchQueryLoading: boolean
}) {
  const {
    presetSearchQuery,
    queryErrors,
    savedSearchQueries,
    setQueryErrors,
    setSelectedSearch,
    userPreference,
    setUserPreference,
    refetchSearch,
  } = props
  const { t } = useTranslation()
  const history = useHistory()
  const [currentSearch, setCurrentSearch] = useState<string>(presetSearchQuery)
  const [saveSearch, setSaveSearch] = useState<SavedSearch>()
  const [open, toggleOpen] = useState<boolean>(false)
  const { useSavedSearchLimit, useSearchAutocompleteLimit } = useSharedAtoms()
  const savedSearchLimit = useSavedSearchLimit()
  const searchAutocompleteLimit = useSearchAutocompleteLimit()
  const toggle = () => toggleOpen(!open)

  useEffect(() => {
    setCurrentSearch(presetSearchQuery)
  }, [presetSearchQuery])

  const { data: searchSchemaData, error: searchSchemaError } = useSearchSchemaQuery({
    skip: currentSearch.endsWith(':') || operators.some((operator: string) => currentSearch.endsWith(operator)),
    client: process.env.NODE_ENV === 'test' ? undefined : searchClient,
  })

  const { searchCompleteValue, searchCompleteQuery } = useMemo(() => {
    const value = getSearchCompleteString(currentSearch)
    const query = convertStringToQuery(currentSearch, searchAutocompleteLimit)
    query.filters = query.filters.filter((filter) => {
      return filter.property !== value
    })
    return { searchCompleteValue: value, searchCompleteQuery: query }
  }, [currentSearch, searchAutocompleteLimit])

  const { data: searchCompleteData, error: searchCompleteError } = useSearchCompleteQuery({
    skip: !currentSearch.endsWith(':') && !operators.some((operator: string) => currentSearch.endsWith(operator)),
    client: process.env.NODE_ENV === 'test' ? undefined : searchClient,
    variables: {
      property: searchCompleteValue,
      query: searchCompleteQuery,
      limit: searchAutocompleteLimit,
    },
  })

  useEffect(() => {
    if (searchSchemaError || searchCompleteError) {
      setQueryErrors(true)
    } else {
      setQueryErrors(false)
    }
  }, [searchSchemaError, searchCompleteError, queryErrors, setQueryErrors])

  const suggestions = useMemo(() => {
    return currentSearch === '' ||
      (!currentSearch.endsWith(':') && !operators.some((operator: string) => currentSearch.endsWith(operator)))
      ? formatSearchbarSuggestions(
          _.get(searchSchemaData, 'searchSchema.allProperties', [
            'name',
            'namespace',
            'label',
            'kind',
            'cluster',
            'apigroup',
            'created',
            t('Loading more...'),
          ]),
          'filter',
          '', // Dont need to de-dupe filters
          searchAutocompleteLimit,
          t
        )
      : formatSearchbarSuggestions(
          _.get(searchCompleteData || [], 'searchComplete', ['Loading...']),
          'value',
          currentSearch, // pass current search query in order to de-dupe already selected values
          searchAutocompleteLimit,
          t
        )
  }, [currentSearch, searchSchemaData, searchCompleteData, searchAutocompleteLimit, t])

  const saveSearchTooltip = useMemo(() => {
    if (savedSearchQueries.length >= savedSearchLimit) {
      return t('Saved search query limit has been reached. Please delete a saved search to save another.')
    } else if (
      savedSearchQueries.find((savedQuery: SavedSearch) => savedQuery.searchText === currentSearch) !== undefined
    ) {
      return t('A saved search already exists for the current search criteria.')
    } else if (currentSearch === '' || currentSearch.endsWith(':')) {
      return t('Enter valid search criteria to save a search.')
    }
    return undefined
  }, [currentSearch, savedSearchLimit, savedSearchQueries, t])

  return (
    <Fragment>
      <PageSection>
        <SaveAndEditSearchModal
          setSelectedSearch={setSelectedSearch}
          savedSearch={saveSearch}
          onClose={() => setSaveSearch(undefined)}
          savedSearchQueries={savedSearchQueries}
          userPreference={userPreference}
          setUserPreference={setUserPreference}
        />
        <SearchInfoModal isOpen={open} onClose={() => toggleOpen(false)} />
        <Searchbar
          queryString={currentSearch}
          saveSearchTooltip={saveSearchTooltip}
          setSaveSearch={setSaveSearch}
          suggestions={suggestions}
          currentQueryCallback={(newQuery) => {
            setCurrentSearch(newQuery)
            if (newQuery === '') {
              updateBrowserUrl(history, newQuery)
            }
            if (newQuery !== currentSearch) {
              setSelectedSearch(t('Saved searches'))
            }
          }}
          toggleInfoModal={toggle}
          updateBrowserUrl={updateBrowserUrl}
          savedSearchQueries={savedSearchQueries}
          refetchSearch={refetchSearch}
        />
        {HandleErrors(searchSchemaError, searchCompleteError)}
      </PageSection>
    </Fragment>
  )
}

function RenderDropDownAndNewTab(props: {
  selectedSearch: string
  setSelectedSearch: React.Dispatch<React.SetStateAction<string>>
  savedSearchQueries: SavedSearch[]
}) {
  const { selectedSearch, setSelectedSearch, savedSearchQueries } = props
  const classes = useStyles()
  const { t } = useTranslation()
  const history = useHistory()

  const SelectQuery = useCallback(
    (id: string) => {
      if (id === 'savedSearchesID') {
        updateBrowserUrl(history, '')
        setSelectedSearch(t('Saved searches'))
      } else {
        const selectedQuery = savedSearchQueries.filter((query) => query.id === id)
        updateBrowserUrl(history, selectedQuery[0].searchText || '')
        setSelectedSearch(selectedQuery[0].name || '')
      }
    },
    [history, savedSearchQueries, setSelectedSearch, t]
  )

  function SavedSearchDropdown(props: { selectedSearch: string; savedSearchQueries: SavedSearch[] }) {
    const dropdownItems: any[] = useMemo(() => {
      const items: any[] = props.savedSearchQueries.map((query) => {
        return { id: query.id, text: query.name }
      })
      items.unshift({ id: 'savedSearchesID', text: t('Saved searches') })
      return items
    }, [props.savedSearchQueries])

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
        <SavedSearchDropdown selectedSearch={selectedSearch} savedSearchQueries={savedSearchQueries} />
        <AcmButton
          href={NavigationPath.search}
          variant={ButtonVariant.link}
          component="a"
          target="_blank"
          rel="noreferrer"
          id={'newsearchtab'}
          icon={<ExternalLinkAltIcon />}
          iconPosition="right"
        >
          {t('Open new search tab')}
        </AcmButton>
      </AcmActionGroup>
    </div>
  )
}

export default function SearchPage() {
  // Only using setCurrentQuery to trigger a re-render
  // useEffect using window.location to trigger re-render doesn't work cause react hooks can't use window
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const {
    presetSearchQuery = '',
    preSelectedRelatedResources = [], // used to show any related resource on search page navigation
  } = transformBrowserUrlToSearchString(window.location.search || '')
  const { t } = useTranslation()
  const savedSearches = t('Saved searches')
  const { useSearchResultLimit } = useSharedAtoms()
  const searchResultLimit = useSearchResultLimit()
  const [selectedSearch, setSelectedSearch] = useState(savedSearches)
  const [queryErrors, setQueryErrors] = useState(false)
  const [queryMessages, setQueryMessages] = useState<any[]>([])
  const [userPreference, setUserPreference] = useState<UserPreference | undefined>(undefined)

  const { data, loading, error, refetch } = useSearchResultItemsQuery({
    skip: presetSearchQuery === '',
    client: process.env.NODE_ENV === 'test' ? undefined : searchClient,
    variables: { input: [convertStringToQuery(presetSearchQuery, searchResultLimit)] },
  })

  useEffect(() => {
    getUserPreference().then((resp) => setUserPreference(resp))
  }, [])

  const userSavedSearches = useMemo(() => {
    return userPreference?.spec?.savedSearches ?? []
  }, [userPreference])

  useEffect(() => {
    if (presetSearchQuery === '') {
      setSelectedSearch(t('Saved searches'))
    }
  }, [presetSearchQuery, t])

  const query = convertStringToQuery(presetSearchQuery, searchResultLimit)
  const msgQuery = useGetMessagesQuery({
    client: process.env.NODE_ENV === 'test' ? undefined : searchClient,
  })
  useEffect(() => {
    if (msgQuery.data?.messages) {
      setQueryMessages(msgQuery.data?.messages)
    }
  }, [msgQuery.data])

  return (
    <AcmPage
      header={
        <div>
          <HeaderWithNotification messages={queryMessages} />
          <RenderDropDownAndNewTab
            selectedSearch={selectedSearch}
            setSelectedSearch={setSelectedSearch}
            savedSearchQueries={userSavedSearches}
          />
        </div>
      }
    >
      <AcmScrollable>
        <RenderSearchBar
          presetSearchQuery={presetSearchQuery}
          setSelectedSearch={setSelectedSearch}
          queryErrors={queryErrors}
          setQueryErrors={setQueryErrors}
          savedSearchQueries={userSavedSearches}
          userPreference={userPreference}
          setUserPreference={setUserPreference}
          refetchSearch={refetch}
          searchQueryLoading={loading}
        />
        {!queryErrors &&
          (presetSearchQuery !== '' && (query.keywords.length > 0 || query.filters.length > 0) ? (
            <SearchResults
              currentQuery={presetSearchQuery}
              error={error}
              loading={loading}
              data={data}
              preSelectedRelatedResources={preSelectedRelatedResources}
            />
          ) : (
            <SavedSearchQueries
              savedSearches={userSavedSearches}
              setSelectedSearch={setSelectedSearch}
              userPreference={userPreference}
              setUserPreference={setUserPreference}
            />
          ))}
      </AcmScrollable>
    </AcmPage>
  )
}
