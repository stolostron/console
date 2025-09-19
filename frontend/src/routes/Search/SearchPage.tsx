/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
import { ApolloError } from '@apollo/client'
import { css } from '@emotion/css'
import {
  ButtonVariant,
  EmptyState,
  EmptyStateBody,
  EmptyStateHeader,
  EmptyStateIcon,
  PageSection,
  Stack,
  StackItem,
} from '@patternfly/react-core'
import { ExclamationCircleIcon, ExternalLinkAltIcon, InfoCircleIcon } from '@patternfly/react-icons'
import _ from 'lodash'
import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom-v5-compat'
import { Pages, usePageVisitMetricHandler } from '../../hooks/console-metrics'
import { useTranslation } from '../../lib/acm-i18next'
import { NavigationPath } from '../../NavigationPath'
import { getUserPreference, SavedSearch, UserPreference } from '../../resources/userpreference'
import { useRecoilValue, useSharedAtoms } from '../../shared-recoil'
import { AcmActionGroup, AcmButton, AcmDropdown, AcmPage, AcmScrollable } from '../../ui-components'
import HeaderWithNotification from './components/HeaderWithNotification'
import { SaveAndEditSearchModal } from './components/Modals/SaveAndEditSearchModal'
import { SearchInfoModal } from './components/Modals/SearchInfoModal'
import SavedSearchQueries from './components/SavedSearchQueries'
import { SearchAlertContext, SearchAlertGroup } from './components/SearchAlertGroup'
import { Searchbar } from './components/Searchbar'
import { useSuggestedQueryTemplates } from './components/SuggestedQueryTemplates'
import {
  convertStringToQuery,
  federatedErrorText,
  formatSearchbarSuggestions,
  getSearchCompleteString,
  operators,
  setFederatedErrorAlert,
} from './search-helper'
import { searchClient } from './search-sdk/search-client'
import {
  SearchResultItemsQuery,
  useGetMessagesQuery,
  useSearchCompleteQuery,
  useSearchResultItemsQuery,
  useSearchSchemaQuery,
} from './search-sdk/search-sdk'
import SearchResults from './SearchResults/SearchResults'
import { transformBrowserUrlToSearchString, updateBrowserUrl } from './urlQuery'
import { KubevirtProviderAlert } from '../../components/KubevirtProviderAlert'

const actionGroup = css({
  backgroundColor: 'var(--pf-v5-global--BackgroundColor--100)',
  paddingRight: 'var(--pf-v5-c-page__main-section--PaddingRight)',
  paddingLeft: 'var(--pf-v5-c-page__main-section--PaddingLeft)',
  paddingBottom: 'var(--pf-v5-c-page__header-sidebar-toggle__c-button--PaddingBottom)',
  paddingTop: 'var(--pf-v5-c-page__header-sidebar-toggle__c-button--PaddingTop)',
})
const dropdown = css({
  '& ul': {
    right: 'unset !important',
  },
})

function HandleErrors(
  schemaError: ApolloError | undefined,
  completeError: ApolloError | undefined,
  hasFederatedError: boolean
) {
  const { t } = useTranslation()
  const notEnabled = 'not enabled'
  if (hasFederatedError) {
    // If it is federated error do not block UI from rendering
    return undefined
  }

  if (schemaError?.message.includes(notEnabled) || completeError?.message.includes(notEnabled)) {
    return (
      <EmptyState>
        <EmptyStateHeader
          titleText={<>{t('search.filter.info.title')}</>}
          icon={<EmptyStateIcon icon={InfoCircleIcon} color={'var(--pf-v5-global--info-color--100)'} />}
          headingLevel="h4"
        />
        <EmptyStateBody>{schemaError?.message ?? completeError?.message}</EmptyStateBody>
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
        <EmptyStateHeader
          titleText={<>{t('search.filter.errors.title')}</>}
          icon={<EmptyStateIcon icon={ExclamationCircleIcon} color={'var(--pf-v5-global--danger-color--100)'} />}
          headingLevel="h4"
        />
        <EmptyStateBody>
          <Stack>
            <StackItem>{t('Error occurred while contacting the search service.')}</StackItem>
            <StackItem>{extraErrorInfo}</StackItem>
          </Stack>
        </EmptyStateBody>
      </EmptyState>
    )
  }
  return undefined
}

interface SearchbarProps {
  presetSearchQuery: string
  setSelectedSearch: React.Dispatch<React.SetStateAction<string>>
  queryErrors: boolean
  setQueryErrors: React.Dispatch<React.SetStateAction<boolean>>
  savedSearchQueries: SavedSearch[]
  userPreference?: UserPreference
  setUserPreference: React.Dispatch<React.SetStateAction<UserPreference | undefined>>
  searchResultData: SearchResultItemsQuery | undefined
  refetchSearch: any
}

function RenderSearchBar(props: Readonly<SearchbarProps>) {
  const {
    presetSearchQuery,
    queryErrors,
    savedSearchQueries,
    setQueryErrors,
    setSelectedSearch,
    userPreference,
    setUserPreference,
    searchResultData,
    refetchSearch,
  } = props
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { isGlobalHubState, settingsState } = useSharedAtoms()
  const isGlobalHub = useRecoilValue(isGlobalHubState)
  const settings = useRecoilValue(settingsState)
  const [currentSearch, setCurrentSearch] = useState<string>(presetSearchQuery)
  const [saveSearch, setSaveSearch] = useState<SavedSearch>()
  const [toggleOpen, setToggleOpen] = useState<boolean>(false)
  const { useSavedSearchLimit, useSearchAutocompleteLimit } = useSharedAtoms()
  const savedSearchLimit = useSavedSearchLimit()
  const searchAutocompleteLimit = useSearchAutocompleteLimit()
  const toggle = () => setToggleOpen(!toggleOpen)

  useEffect(() => {
    setCurrentSearch(presetSearchQuery)
  }, [presetSearchQuery])

  const {
    data: searchSchemaData,
    loading: searchSchemaLoading,
    error: searchSchemaError,
  } = useSearchSchemaQuery({
    skip: currentSearch.endsWith(':') || operators.some((operator: string) => currentSearch.endsWith(operator)),
    client: process.env.NODE_ENV === 'test' ? undefined : searchClient,
    fetchPolicy: 'cache-first',
    variables: {
      query: convertStringToQuery(currentSearch, searchAutocompleteLimit),
    },
  })

  const { searchCompleteValue, searchCompleteQuery } = useMemo(() => {
    const value = getSearchCompleteString(currentSearch)
    const query = convertStringToQuery(currentSearch, searchAutocompleteLimit)
    query.filters = query.filters.filter((filter) => {
      return filter.property !== value
    })
    return { searchCompleteValue: value, searchCompleteQuery: query }
  }, [currentSearch, searchAutocompleteLimit])

  const {
    data: searchCompleteData,
    loading: searchCompleteLoading,
    error: searchCompleteError,
  } = useSearchCompleteQuery({
    skip: !currentSearch.endsWith(':') && !operators.some((operator: string) => currentSearch.endsWith(operator)),
    client: process.env.NODE_ENV === 'test' ? undefined : searchClient,
    fetchPolicy: 'cache-and-network',
    variables: {
      property: searchCompleteValue,
      query: searchCompleteQuery,
      limit: searchAutocompleteLimit,
    },
  })

  const hasFederatedError = useMemo(() => {
    if (isGlobalHub && settings.globalSearchFeatureFlag === 'enabled') {
      return (
        (searchSchemaError?.graphQLErrors.findIndex((error: any) => error?.includes(federatedErrorText)) ?? -1) > -1 ||
        (searchCompleteError?.graphQLErrors.findIndex((error: any) => error?.includes(federatedErrorText)) ?? -1) > -1
      )
    }
    return false
  }, [
    isGlobalHub,
    settings.globalSearchFeatureFlag,
    searchCompleteError?.graphQLErrors,
    searchSchemaError?.graphQLErrors,
  ])

  useEffect(() => {
    if ((searchSchemaError || searchCompleteError) && !hasFederatedError) {
      setQueryErrors(true)
    } else {
      setQueryErrors(false)
    }
  }, [searchSchemaError, searchCompleteError, queryErrors, setQueryErrors, hasFederatedError])

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
          ]),
          'filter',
          '', // Dont need to de-dupe filters
          searchAutocompleteLimit,
          searchSchemaLoading,
          t
        )
      : formatSearchbarSuggestions(
          _.get(searchCompleteData || [], 'searchComplete') ?? [],
          'value',
          currentSearch, // pass current search query in order to de-dupe already selected values
          searchAutocompleteLimit,
          searchCompleteLoading,
          t
        )
  }, [
    currentSearch,
    searchSchemaData,
    searchSchemaLoading,
    searchCompleteData,
    searchCompleteLoading,
    searchAutocompleteLimit,
    t,
  ])

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
    <PageSection>
      <SaveAndEditSearchModal
        setSelectedSearch={setSelectedSearch}
        savedSearch={saveSearch}
        onClose={() => setSaveSearch(undefined)}
        savedSearchQueries={savedSearchQueries}
        userPreference={userPreference}
        setUserPreference={setUserPreference}
      />
      <SearchInfoModal isOpen={toggleOpen} onClose={() => setToggleOpen(false)} />
      <Searchbar
        queryString={currentSearch}
        saveSearchTooltip={saveSearchTooltip}
        setSaveSearch={setSaveSearch}
        suggestions={suggestions}
        currentQueryCallback={(newQuery) => {
          setCurrentSearch(newQuery)
          if (newQuery === '') {
            updateBrowserUrl(navigate, newQuery)
          }
          if (newQuery !== currentSearch) {
            setSelectedSearch(t('Saved searches'))
          }
        }}
        toggleInfoModal={toggle}
        updateBrowserUrl={updateBrowserUrl}
        savedSearchQueries={savedSearchQueries}
        searchResultData={searchResultData}
        refetchSearch={refetchSearch}
        exportEnabled={true}
        inputPlaceholder={
          currentSearch === ''
            ? t('Search by keywords or filters, for example "label:environment=production my-cluster"')
            : ''
        }
      />
      {HandleErrors(searchSchemaError, searchCompleteError, hasFederatedError)}
    </PageSection>
  )
}

interface DropDownAndNewTabProps {
  selectedSearch: string
  setSelectedSearch: React.Dispatch<React.SetStateAction<string>>
  savedSearchQueries: SavedSearch[]
}
interface SavedSearchDropdownProps {
  selectedSearch: string
  savedSearchQueries: SavedSearch[]
}

function RenderDropDownAndNewTab(props: Readonly<DropDownAndNewTabProps>) {
  const { selectedSearch, setSelectedSearch, savedSearchQueries } = props
  const { t } = useTranslation()
  const navigate = useNavigate()

  const SelectQuery = useCallback(
    (id: string) => {
      if (id === 'savedSearchesID') {
        updateBrowserUrl(navigate, '')
        setSelectedSearch(t('Saved searches'))
      } else {
        const selectedQuery = savedSearchQueries.filter((query) => query.id === id)
        updateBrowserUrl(navigate, selectedQuery[0].searchText || '')
        setSelectedSearch(selectedQuery[0].name || '')
      }
    },
    [navigate, savedSearchQueries, setSelectedSearch, t]
  )

  function SavedSearchDropdown(props: Readonly<SavedSearchDropdownProps>) {
    const dropdownItems: any[] = useMemo(() => {
      const items: any[] = props.savedSearchQueries.map((query) => {
        return { id: query.id, text: query.name }
      })
      items.unshift({ id: 'savedSearchesID', text: t('Saved searches') })
      return items
    }, [props.savedSearchQueries])

    return (
      <div className={dropdown}>
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
    <div className={actionGroup}>
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
  const { search } = useLocation()
  const {
    presetSearchQuery = '',
    preSelectedRelatedResources = [], // used to show any related resource on search page navigation
  } = transformBrowserUrlToSearchString(search)
  usePageVisitMetricHandler(Pages.search)
  const { t } = useTranslation()
  const savedSearchesText = t('Saved searches')
  const suggestedQueryTemplates = useSuggestedQueryTemplates().templates as SavedSearch[]
  const { alerts, addSearchAlert, removeSearchAlert } = useContext(SearchAlertContext)
  const { useSearchResultLimit, configMapsState, isGlobalHubState, settingsState } = useSharedAtoms()
  const searchResultLimit = useSearchResultLimit()
  const isGlobalHub = useRecoilValue(isGlobalHubState)
  const settings = useRecoilValue(settingsState)
  const configMaps = useRecoilValue(configMapsState)
  const [selectedSearch, setSelectedSearch] = useState(savedSearchesText)
  const [queryErrors, setQueryErrors] = useState(false)
  const [queryMessages, setQueryMessages] = useState<any[]>([])
  const [isUserPreferenceLoading, setIsUserPreferenceLoading] = useState(true)
  const [userPreference, setUserPreference] = useState<UserPreference | undefined>(undefined)

  const { data, loading, error, refetch } = useSearchResultItemsQuery({
    skip: presetSearchQuery === '',
    client: process.env.NODE_ENV === 'test' ? undefined : searchClient,
    variables: { input: [convertStringToQuery(presetSearchQuery, searchResultLimit)] },
  })

  useEffect(() => {
    if (isGlobalHub && settings.globalSearchFeatureFlag === 'enabled') {
      setFederatedErrorAlert(loading, error, data, alerts, addSearchAlert, removeSearchAlert, t)
    }
  }, [
    isGlobalHub,
    settings.globalSearchFeatureFlag,
    addSearchAlert,
    alerts,
    removeSearchAlert,
    loading,
    error,
    data,
    t,
  ])

  useEffect(() => {
    getUserPreference().then((resp) => {
      setUserPreference(resp)
      setIsUserPreferenceLoading(false)
    })
  }, [])

  const suggestedSearches: SavedSearch[] = useMemo(() => {
    const suggestedCM = configMaps.find((cm) => cm.metadata.name === 'console-search-config')
    if (suggestedCM?.data?.suggestedSearches) {
      try {
        const searches = JSON.parse(suggestedCM?.data?.suggestedSearches) as SavedSearch[]
        // only use suggested searches that contain an ID, name & searchText
        return searches.filter((search) => search.id && search.searchText && search.name)
      } catch (err) {
        // If syntax parsing error occurrs return the suggested search templates
        console.error(err)
        return suggestedQueryTemplates
      }
    }
    return suggestedQueryTemplates
  }, [configMaps, suggestedQueryTemplates])

  const userSavedSearches = useMemo(() => {
    return userPreference?.spec?.savedSearches ?? []
  }, [userPreference])

  useEffect(() => {
    if (presetSearchQuery === '') {
      setSelectedSearch(t('Saved searches'))
    } else if (
      presetSearchQuery !== '' &&
      userSavedSearches.find((savedSearch) => savedSearch.searchText === presetSearchQuery)
    ) {
      // If you run a query already saved as a SavedSearch set the SavedSearch dropdown
      setSelectedSearch(
        userSavedSearches.find((savedSearch) => savedSearch.searchText === presetSearchQuery)?.name ??
          t('Saved searches')
      )
    }
  }, [presetSearchQuery, userSavedSearches, t])

  const query = convertStringToQuery(presetSearchQuery, searchResultLimit)
  const msgQuery = useGetMessagesQuery({
    client: process.env.NODE_ENV === 'test' ? undefined : searchClient,
  })
  useEffect(() => {
    if (msgQuery.data?.messages) {
      setQueryMessages(msgQuery.data?.messages)
    }
  }, [msgQuery.data])
  // Helper function to check if search query contains VirtualMachine kinds
  const hasVirtualMachineKinds = (query: string): boolean => {
    const lowerQuery = query.toLowerCase()
    // Check for VirtualMachine or VirtualMachineInstance in kind filters
    return lowerQuery.includes('kind:virtualmachine') || lowerQuery.includes('kind:virtualmachineinstance')
  }

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
        <PageSection style={{ paddingTop: 0, paddingBottom: 0 }}>
          <SearchAlertGroup />
        </PageSection>
        <RenderSearchBar
          presetSearchQuery={presetSearchQuery}
          setSelectedSearch={setSelectedSearch}
          queryErrors={queryErrors}
          setQueryErrors={setQueryErrors}
          savedSearchQueries={userSavedSearches}
          userPreference={userPreference}
          setUserPreference={setUserPreference}
          searchResultData={data}
          refetchSearch={refetch}
        />
        {hasVirtualMachineKinds(presetSearchQuery) && (
          <div style={{ marginBottom: '1em' }}>
            <KubevirtProviderAlert variant="search" component="hint" />
          </div>
        )}
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
              isUserPreferenceLoading={isUserPreferenceLoading}
              savedSearches={userSavedSearches}
              setSelectedSearch={setSelectedSearch}
              userPreference={userPreference}
              setUserPreference={setUserPreference}
              suggestedSearches={suggestedSearches}
            />
          ))}
      </AcmScrollable>
    </AcmPage>
  )
}
