// Copyright Contributors to the Open Cluster Management project
import { ApolloError } from '@apollo/client'
import { css } from '@emotion/css'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionToggle,
  EmptyState,
  EmptyStateBody,
  ExpandableSection,
  PageSection,
  Stack,
  StackItem,
  Tooltip,
} from '@patternfly/react-core'
import { ExclamationCircleIcon, InfoCircleIcon, OutlinedQuestionCircleIcon } from '@patternfly/react-icons'
import _ from 'lodash'
import { Fragment, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom-v5-compat'

import { useTranslation } from '../../../lib/acm-i18next'
import { PluginContext } from '../../../lib/PluginContext'
import { useRecoilValue, useSharedAtoms } from '../../../shared-recoil'
import { AcmLoadingPage, AcmTable, compareStrings } from '../../../ui-components'
import { useAllClusters } from '../../Infrastructure/Clusters/ManagedClusters/components/useAllClusters'
import {
  ClosedVMActionModalProps,
  IVMActionModalProps,
  VMActionModal,
} from '../../Infrastructure/VirtualMachines/modals/VMActionModal'
import {
  ClosedDeleteExternalResourceModalProps,
  DeleteExternalResourceModal,
  IDeleteExternalResourceModalProps,
} from '../components/Modals/DeleteExternalResourceModal'
import {
  ClosedDeleteModalProps,
  DeleteResourceModal,
  IDeleteModalProps,
} from '../components/Modals/DeleteResourceModal'
import { SearchAlertContext } from '../components/SearchAlertGroup'
import { federatedErrorText } from '../search-helper'
import { SearchResultItemsQuery } from '../search-sdk/search-sdk'
import { useSearchDefinitions } from '../searchDefinitions'
import RelatedResults from './RelatedResults'
import { getRowActions, ISearchResult } from './utils'

const resultsWrapper = css({ paddingTop: '0' })
const relatedExpandableWrapper = css({
  display: 'flex',
  alignItems: 'baseline',
})
const accordionItemHeader = css({
  flexDirection: 'row',
})
const accordionItemKind = css({
  display: 'flex',
  alignItems: 'center',
  flex: 1,
})
const accordionItemGroup = css({
  marginLeft: '10px',
  fontSize: 'var(--pf-t--global--font--size--sm)',
  color: 'var(--pf-t--global--text--color--subtle)',
})

function RenderAccordionItem(
  props: Readonly<{
    currentQuery: string
    setDeleteResource: React.Dispatch<React.SetStateAction<IDeleteModalProps>>
    setDeleteExternalResource: React.Dispatch<React.SetStateAction<IDeleteExternalResourceModalProps>>
    setVMAction: React.Dispatch<React.SetStateAction<IVMActionModalProps>>
    kindSearchResultItems: Record<string, ISearchResult[]>
    kind: string
    idx: number
    defaultIsExpanded: boolean
  }>
) {
  const {
    currentQuery,
    setDeleteResource,
    setDeleteExternalResource,
    setVMAction,
    kindSearchResultItems,
    kind,
    idx,
    defaultIsExpanded,
  } = props
  const { t } = useTranslation()
  const navigate = useNavigate()

  const allClusters = useAllClusters(true)
  const { useVirtualMachineActionsEnabled, isFineGrainedRbacEnabledState } = useSharedAtoms()
  const isFineGrainedRbacEnabled = useRecoilValue(isFineGrainedRbacEnabledState)
  const vmActionsEnabled = useVirtualMachineActionsEnabled()
  const { acmExtensions } = useContext(PluginContext)
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultIsExpanded)
  const searchDefinitions = useSearchDefinitions()

  const accordionItemKey = `${kind}-${idx}`
  const items = kindSearchResultItems[kind]
  const apiGroup = items[0].apigroup ? `${items[0].apigroup}/${items[0].apiversion}` : items[0].apiversion
  const kindString = kind.split('.').pop() ?? ''
  const [pluginModal, setPluginModal] = useState<JSX.Element>()
  const rowActions = useCallback(
    (item: any) =>
      getRowActions(
        item,
        kindString,
        currentQuery,
        false,
        allClusters,
        setDeleteResource,
        setDeleteExternalResource,
        isFineGrainedRbacEnabled,
        vmActionsEnabled,
        setVMAction,
        acmExtensions,
        setPluginModal,
        navigate,
        t
      ),
    [
      kindString,
      currentQuery,
      allClusters,
      setDeleteResource,
      setDeleteExternalResource,
      isFineGrainedRbacEnabled,
      vmActionsEnabled,
      setVMAction,
      acmExtensions,
      setPluginModal,
      navigate,
      t,
    ]
  )

  const renderContent = useCallback(
    (kind: string, items: ISearchResult[]) => {
      const kindAndGroup =
        kind.toLowerCase() === 'subscription' ? `subscription.${items[0].apigroup}` : kind.toLowerCase()

      return (
        <AcmTable
          items={items}
          emptyState={undefined} // table only shown for kinds with results
          columns={_.get(
            searchDefinitions,
            `['${kindAndGroup}'].columns`,
            searchDefinitions['genericresource'].columns
          )}
          keyFn={(item: any) => item._uid.toString()}
          rowActionResolver={rowActions}
        />
      )
    },
    [rowActions, searchDefinitions]
  )

  return (
    <Fragment>
      {pluginModal}
      <AccordionItem isExpanded={isExpanded} key={`${kind}-accordion-item`}>
        <AccordionToggle
          onClick={() => {
            setIsExpanded(!isExpanded)
          }}
          id={accordionItemKey}
        >
          <span className={accordionItemHeader}>
            <span className={accordionItemKind}>
              {kindString}
              {/* Cluster is not a real Kube resource and therefore does not have apigroup/apiversion */}
              {kindString.toLowerCase() !== 'cluster' && <span className={accordionItemGroup}>{apiGroup}</span>}
              <div className={accordionItemGroup}>{`(${items.length})`}</div>
            </span>
          </span>
        </AccordionToggle>
        <AccordionContent>{isExpanded && renderContent(kindString, items)}</AccordionContent>
      </AccordionItem>
    </Fragment>
  )
}

function SearchResultAccordion(
  props: Readonly<{
    data: ISearchResult[]
    currentQuery: string
    setDeleteResource: React.Dispatch<React.SetStateAction<IDeleteModalProps>>
    setDeleteExternalResource: React.Dispatch<React.SetStateAction<IDeleteExternalResourceModalProps>>
    setVMAction: React.Dispatch<React.SetStateAction<IVMActionModalProps>>
  }>
) {
  const { data, currentQuery, setDeleteResource, setDeleteExternalResource, setVMAction } = props

  const { kindSearchResultItems, kinds } = useMemo(() => {
    const kindSearchResultItems: Record<string, ISearchResult[]> = {}
    for (const searchResultItem of data) {
      const apiGroup = searchResultItem?.apigroup ? `${searchResultItem?.apigroup}/${searchResultItem?.apiversion}` : ''
      const groupAndKind = `${apiGroup}.${searchResultItem.kind}`
      const existing = kindSearchResultItems[groupAndKind]
      if (!existing) {
        kindSearchResultItems[groupAndKind] = [searchResultItem]
      } else {
        kindSearchResultItems[groupAndKind].push(searchResultItem)
      }
    }
    // Keys are formatted as apigroup.kind - but we sort alphabetically by kind - if kinds are equal sort on apigroup
    const kinds = Object.keys(kindSearchResultItems).sort((a, b) => {
      const strCompareRes = compareStrings(kindSearchResultItems[a][0].kind, kindSearchResultItems[b][0].kind)
      const getApiGroup = (type: string) =>
        kindSearchResultItems[type][0]?.apigroup
          ? `${kindSearchResultItems[type][0]?.apigroup}/${kindSearchResultItems[type][0]?.apiversion}`
          : ''
      return strCompareRes !== 0 ? strCompareRes : compareStrings(getApiGroup(a), getApiGroup(b))
    })
    return { kindSearchResultItems, kinds }
  }, [data])

  return (
    <PageSection hasBodyWrapper={false} isFilled={false}>
      <Accordion isBordered asDefinitionList={true}>
        {kinds.map((kind: string, idx: number) => {
          const accordionItemKey = `${kind}-${idx}`
          return (
            <RenderAccordionItem
              key={accordionItemKey}
              currentQuery={currentQuery}
              setDeleteResource={setDeleteResource}
              setDeleteExternalResource={setDeleteExternalResource}
              setVMAction={setVMAction}
              kindSearchResultItems={kindSearchResultItems}
              kind={kind}
              idx={idx}
              defaultIsExpanded={kinds.length === 1}
            />
          )
        })}
      </Accordion>
    </PageSection>
  )
}

export default function SearchResults(
  props: Readonly<{
    currentQuery: string
    error: ApolloError | undefined
    loading: boolean
    data: SearchResultItemsQuery | undefined
    preSelectedRelatedResources: string[]
  }>
) {
  const { currentQuery, error, loading, data, preSelectedRelatedResources } = props
  const { t } = useTranslation()
  const { alerts, addSearchAlert, removeSearchAlert } = useContext(SearchAlertContext)
  const { useSearchResultLimit, isGlobalHubState, settingsState } = useSharedAtoms()
  const searchResultLimit = useSearchResultLimit()
  const isGlobalHub = useRecoilValue(isGlobalHubState)
  const settings = useRecoilValue(settingsState)
  const [currentQueryState, setCurrentQueryState] = useState<string>(currentQuery)
  const [selectedRelatedKinds, setSelectedRelatedKinds] = useState<string[]>(preSelectedRelatedResources)
  const [deleteResource, setDeleteResource] = useState<IDeleteModalProps>(ClosedDeleteModalProps)
  const [deleteExternalResource, setDeleteExternalResource] = useState<IDeleteExternalResourceModalProps>(
    ClosedDeleteExternalResourceModalProps
  )
  const [VMAction, setVMAction] = useState<IVMActionModalProps>(ClosedVMActionModalProps)
  const [showRelatedResources, setShowRelatedResources] = useState<boolean>(false)

  const hasFederatedError = useMemo(() => {
    if (
      isGlobalHub &&
      settings.globalSearchFeatureFlag === 'enabled' &&
      error?.graphQLErrors.find((error: any) => error?.includes(federatedErrorText))
    ) {
      return true
    }
    return false
  }, [isGlobalHub, settings.globalSearchFeatureFlag, error?.graphQLErrors])

  useEffect(() => {
    // If the current query changes -> reset related resource states
    if (currentQuery !== currentQueryState) {
      setCurrentQueryState(currentQuery)
      setSelectedRelatedKinds([])
      setShowRelatedResources(false)
    }
  }, [currentQuery, currentQueryState])

  // related section should be open if url contains 1+ showrelated params
  const isRelatedSectionOpen = useMemo(
    () => showRelatedResources || preSelectedRelatedResources.length > 0,
    [showRelatedResources, preSelectedRelatedResources]
  )

  const searchResultItems: ISearchResult[] = useMemo(() => data?.searchResult?.[0]?.items || [], [data?.searchResult])

  useEffect(() => {
    const limitWarningKey = 'search-result-limit-warning'
    if (searchResultItems.length >= searchResultLimit && !alerts.find((alert) => alert.key === limitWarningKey)) {
      addSearchAlert({
        key: limitWarningKey,
        variant: 'warning',
        title: t(
          'Search result limit has been reached. Your query results have been truncated. Add more filter conditions to your query to narrow results, or view the RHACM documentation to learn how to increase the search results limit.'
        ),
      })
    } else if (searchResultItems.length < searchResultLimit && alerts.find((alert) => alert.key === limitWarningKey)) {
      removeSearchAlert(limitWarningKey)
    }
    return () => {
      if (alerts.find((alert) => alert.key === limitWarningKey)) {
        removeSearchAlert(limitWarningKey)
      }
    }
  }, [alerts, addSearchAlert, removeSearchAlert, searchResultItems, searchResultLimit, t])

  if (loading) {
    return (
      <PageSection hasBodyWrapper={false}>
        <AcmLoadingPage />
      </PageSection>
    )
  }

  if (error && !hasFederatedError) {
    return (
      <PageSection hasBodyWrapper={false}>
        <EmptyState
          headingLevel="h4"
          icon={ExclamationCircleIcon}
          titleText={<>{t('Error querying search results')}</>}
        >
          <EmptyStateBody>
            <Stack>
              <StackItem>{t('Error occurred while contacting the search service.')}</StackItem>
              <StackItem>{error ? error.message : ''}</StackItem>
            </Stack>
          </EmptyStateBody>
        </EmptyState>
      </PageSection>
    )
  }

  if (searchResultItems.length === 0) {
    return (
      <PageSection hasBodyWrapper={false}>
        <EmptyState
          headingLevel="h4"
          icon={InfoCircleIcon}
          titleText={<>{t('No results found for the current search criteria.')}</>}
        ></EmptyState>
      </PageSection>
    )
  }

  return (
    <Fragment>
      <VMActionModal
        open={VMAction.open}
        close={VMAction.close}
        action={VMAction.action}
        method={VMAction.method}
        item={VMAction.item}
      />
      <DeleteResourceModal
        open={deleteResource.open}
        close={deleteResource.close}
        resource={deleteResource.resource}
        currentQuery={deleteResource.currentQuery}
        relatedResource={deleteResource.relatedResource}
      />
      <DeleteExternalResourceModal
        open={deleteExternalResource.open}
        close={deleteExternalResource.close}
        resource={deleteExternalResource.resource}
        hubCluster={deleteExternalResource.hubCluster}
      />
      <PageSection hasBodyWrapper={false} className={resultsWrapper}>
        <Stack>
          <PageSection hasBodyWrapper={false} isFilled={false}>
            <div className={relatedExpandableWrapper}>
              <ExpandableSection
                onToggle={() => setShowRelatedResources(!showRelatedResources)}
                isExpanded={isRelatedSectionOpen}
                toggleText={!showRelatedResources ? t('Show related resources') : t('Hide related resources')}
              />
              <Tooltip
                content={t(
                  'Related Kubernetes resources can be displayed to help aid in the correlation of data from one object to another.'
                )}
              >
                <OutlinedQuestionCircleIcon color={'var(--pf-t--global--text--color--200)'} />
              </Tooltip>
            </div>
            {isRelatedSectionOpen && (
              <RelatedResults
                currentQuery={currentQuery}
                selectedRelatedKinds={selectedRelatedKinds}
                setSelectedRelatedKinds={setSelectedRelatedKinds}
                setDeleteResource={setDeleteResource}
                setDeleteExternalResource={setDeleteExternalResource}
                setVMAction={setVMAction}
              />
            )}
          </PageSection>
          <SearchResultAccordion
            data={searchResultItems}
            currentQuery={currentQuery}
            setDeleteResource={setDeleteResource}
            setDeleteExternalResource={setDeleteExternalResource}
            setVMAction={setVMAction}
          />
        </Stack>
      </PageSection>
    </Fragment>
  )
}
