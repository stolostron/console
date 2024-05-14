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
  EmptyStateIcon,
  ExpandableSection,
  PageSection,
  Stack,
  StackItem,
  Title,
  Tooltip,
} from '@patternfly/react-core'
import { ExclamationCircleIcon, InfoCircleIcon, OutlinedQuestionCircleIcon } from '@patternfly/react-icons'
import _ from 'lodash'
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from '../../../../lib/acm-i18next'
import { useSharedAtoms } from '../../../../shared-recoil'
import { AcmAlert, AcmLoadingPage, AcmTable, compareStrings } from '../../../../ui-components'
import { useAllClusters } from '../../../Infrastructure/Clusters/ManagedClusters/components/useAllClusters'
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
import { SearchResultItemsQuery } from '../search-sdk/search-sdk'
import { useSearchDefinitions } from '../searchDefinitions'
import RelatedResults from './RelatedResults'
import { GetRowActions, ISearchResult } from './utils'

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
  fontSize: 'var(--pf-global--FontSize--sm)',
  color: 'var(--pf-global--Color--200)',
})

function RenderAccordionItem(props: {
  currentQuery: string
  setDeleteResource: React.Dispatch<React.SetStateAction<IDeleteModalProps>>
  setDeleteExternalResource: React.Dispatch<React.SetStateAction<IDeleteExternalResourceModalProps>>
  kindSearchResultItems: Record<string, ISearchResult[]>
  kind: string
  idx: number
  defaultIsExpanded: boolean
}) {
  const {
    currentQuery,
    setDeleteResource,
    setDeleteExternalResource,
    kindSearchResultItems,
    kind,
    idx,
    defaultIsExpanded,
  } = props
  const { t } = useTranslation()
  const clusters = useAllClusters(true)
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultIsExpanded)
  const searchDefinitions = useSearchDefinitions()

  const accordionItemKey = `${kind}-${idx}`
  const items = kindSearchResultItems[kind]
  const apiGroup = items[0].apigroup ? `${items[0].apigroup}/${items[0].apiversion}` : items[0].apiversion
  const kindString = kind.split('.').pop() ?? ''

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
          rowActions={GetRowActions(
            kind,
            currentQuery,
            false,
            setDeleteResource,
            setDeleteExternalResource,
            clusters,
            t
          )}
        />
      )
    },
    [currentQuery, setDeleteResource, searchDefinitions, clusters, setDeleteExternalResource, t]
  )

  return (
    <AccordionItem key={`${kind}-accordion-item`}>
      <AccordionToggle
        onClick={() => {
          setIsExpanded(!isExpanded)
        }}
        isExpanded={isExpanded}
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
      <AccordionContent isHidden={!isExpanded}>{isExpanded && renderContent(kindString, items)}</AccordionContent>
    </AccordionItem>
  )
}

function SearchResultAccordion(props: {
  data: ISearchResult[]
  currentQuery: string
  setDeleteResource: React.Dispatch<React.SetStateAction<IDeleteModalProps>>
  setDeleteExternalResource: React.Dispatch<React.SetStateAction<IDeleteExternalResourceModalProps>>
}) {
  const { data, currentQuery, setDeleteResource, setDeleteExternalResource } = props

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
    <PageSection isFilled={false} variant={'light'}>
      <Accordion isBordered asDefinitionList={true}>
        {kinds.map((kind: string, idx: number) => {
          const accordionItemKey = `${kind}-${idx}`
          return (
            <RenderAccordionItem
              key={accordionItemKey}
              currentQuery={currentQuery}
              setDeleteResource={setDeleteResource}
              setDeleteExternalResource={setDeleteExternalResource}
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

export default function SearchResults(props: {
  currentQuery: string
  error: ApolloError | undefined
  loading: boolean
  data: SearchResultItemsQuery | undefined
  preSelectedRelatedResources: string[]
}) {
  const { currentQuery, error, loading, data, preSelectedRelatedResources } = props
  const { t } = useTranslation()
  const { useSearchResultLimit } = useSharedAtoms()
  const searchResultLimit = useSearchResultLimit()
  const [selectedRelatedKinds, setSelectedRelatedKinds] = useState<string[]>(preSelectedRelatedResources)
  const [deleteResource, setDeleteResource] = useState<IDeleteModalProps>(ClosedDeleteModalProps)
  const [deleteExternalResource, setDeleteExternalResource] = useState<IDeleteExternalResourceModalProps>(
    ClosedDeleteExternalResourceModalProps
  )
  const [showRelatedResources, setShowRelatedResources] = useState<boolean>(false)

  useEffect(() => {
    // If the current search query changes -> hide related resources
    if (preSelectedRelatedResources.length === 0) {
      setShowRelatedResources(false)
      setSelectedRelatedKinds([])
    } else {
      setShowRelatedResources(true)
      setSelectedRelatedKinds(preSelectedRelatedResources)
    }
  }, [preSelectedRelatedResources])

  const searchResultItems: ISearchResult[] = useMemo(() => data?.searchResult?.[0]?.items || [], [data?.searchResult])

  if (loading) {
    return (
      <PageSection>
        <AcmLoadingPage />
      </PageSection>
    )
  }

  if (error) {
    return (
      <PageSection>
        <EmptyState>
          <EmptyStateIcon icon={ExclamationCircleIcon} color={'var(--pf-global--danger-color--100)'} />
          <Title size="lg" headingLevel="h4">
            {t('Error querying search results')}
          </Title>
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
      <PageSection>
        <EmptyState>
          <EmptyStateIcon icon={InfoCircleIcon} color={'var(--pf-global--info-color--100)'} />
          <Title size="lg" headingLevel="h4">
            {t('No results found for the current search criteria.')}
          </Title>
        </EmptyState>
      </PageSection>
    )
  }

  return (
    <Fragment>
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
      <PageSection className={resultsWrapper}>
        <Stack hasGutter>
          {searchResultItems.length >= searchResultLimit ? (
            <AcmAlert
              noClose={true}
              variant={'warning'}
              isInline={true}
              title={t(
                'Search result limit has been reached. Your query results have been truncated. Add more filter conditions to your query to narrow results, or view the RHACM documentation to learn how to increase the search results limit.'
              )}
            />
          ) : null}

          <PageSection isFilled={false} variant={'light'}>
            <div className={relatedExpandableWrapper}>
              <ExpandableSection
                onToggle={() => setShowRelatedResources(!showRelatedResources)}
                isExpanded={showRelatedResources}
                toggleText={!showRelatedResources ? t('Show related resources') : t('Hide related resources')}
              />
              <Tooltip
                content={t(
                  'Related Kubernetes resources can be displayed to help aid in the correlation of data from one object to another.'
                )}
              >
                <OutlinedQuestionCircleIcon color={'var(--pf-global--Color--200)'} />
              </Tooltip>
            </div>
            {showRelatedResources && (
              <RelatedResults
                currentQuery={currentQuery}
                selectedRelatedKinds={selectedRelatedKinds}
                setSelectedRelatedKinds={setSelectedRelatedKinds}
                setDeleteResource={setDeleteResource}
                setDeleteExternalResource={setDeleteExternalResource}
              />
            )}
          </PageSection>
          <SearchResultAccordion
            data={searchResultItems}
            currentQuery={currentQuery}
            setDeleteResource={setDeleteResource}
            setDeleteExternalResource={setDeleteExternalResource}
          />
        </Stack>
      </PageSection>
    </Fragment>
  )
}
