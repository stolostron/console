// Copyright Contributors to the Open Cluster Management project
import { ApolloError } from '@apollo/client'
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
import { AcmAlert, AcmLoadingPage, AcmTable } from '../../../../ui-components'
import {
  ClosedDeleteModalProps,
  DeleteResourceModal,
  IDeleteModalProps,
} from '../components/Modals/DeleteResourceModal'
import { SearchResultItemsQuery } from '../search-sdk/search-sdk'
import { useSearchDefinitions } from '../searchDefinitions'
import RelatedResults from './RelatedResults'
import { GetRowActions, ISearchResult } from './utils'

function RenderAccordionItem(props: {
  currentQuery: string
  setDeleteResource: React.Dispatch<React.SetStateAction<IDeleteModalProps>>
  kindSearchResultItems: Record<string, ISearchResult[]>
  kind: string
  idx: number
  defaultIsExpanded: boolean
}) {
  const { currentQuery, setDeleteResource, kindSearchResultItems, kind, idx, defaultIsExpanded } = props
  const { t } = useTranslation()
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultIsExpanded)
  const searchDefinitions = useSearchDefinitions()

  const accordionItemKey = `${kind}-${idx}`
  const items = kindSearchResultItems[kind]

  const renderContent = useCallback(
    (kind: string, items: ISearchResult[]) => {
      return (
        <AcmTable
          items={items}
          emptyState={undefined} // table only shown for kinds with results
          columns={_.get(
            searchDefinitions,
            `[${kind.toLowerCase()}].columns`,
            searchDefinitions['genericresource'].columns
          )}
          keyFn={(item: any) => item._uid.toString()}
          rowActions={GetRowActions(kind, currentQuery, false, setDeleteResource, t)}
        />
      )
    },
    [currentQuery, setDeleteResource, searchDefinitions, t]
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
        <span style={{ flexDirection: 'row' }}>
          <span style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            {kind}
            <div
              style={{
                marginLeft: '10px',
                fontSize: 'var(--pf-global--FontSize--sm)',
                color: 'var(--pf-global--Color--200)',
              }}
            >
              {`(${items.length})`}
            </div>
          </span>
        </span>
      </AccordionToggle>
      <AccordionContent isHidden={!isExpanded}>{isExpanded && renderContent(kind, items)}</AccordionContent>
    </AccordionItem>
  )
}

function SearchResultTables(props: {
  data: ISearchResult[]
  currentQuery: string
  setDeleteResource: React.Dispatch<React.SetStateAction<IDeleteModalProps>>
}) {
  const { data, currentQuery, setDeleteResource } = props

  const { kindSearchResultItems, kinds } = useMemo(() => {
    const kindSearchResultItems: Record<string, ISearchResult[]> = {}
    for (const searchResultItem of data) {
      const existing = kindSearchResultItems[searchResultItem.kind]
      if (!existing) {
        kindSearchResultItems[searchResultItem.kind] = [searchResultItem]
      } else {
        kindSearchResultItems[searchResultItem.kind].push(searchResultItem)
      }
    }
    const kinds = Object.keys(kindSearchResultItems)
    return { kindSearchResultItems, kinds }
  }, [data])

  return (
    <PageSection isFilled={false} variant={'light'}>
      <Accordion isBordered asDefinitionList={true}>
        {kinds.sort().map((kind: string, idx: number) => {
          const accordionItemKey = `${kind}-${idx}`
          return (
            <RenderAccordionItem
              key={accordionItemKey}
              currentQuery={currentQuery}
              setDeleteResource={setDeleteResource}
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
  const [showRelatedResources, setShowRelatedResources] = useState<boolean>(
    // If the url has a preselected related resource -> automatically show the selected related resource tables - otherwise hide the section
    preSelectedRelatedResources.length > 0 ? true : false
  )

  useEffect(() => {
    // If the current search query changes -> hide related resources
    if (preSelectedRelatedResources.length === 0) {
      setShowRelatedResources(false)
      setSelectedRelatedKinds([])
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
      <PageSection style={{ paddingTop: '0' }}>
        <Stack hasGutter>
          {searchResultItems.length >= searchResultLimit ? (
            <AcmAlert
              noClose={true}
              variant={'warning'}
              isInline={true}
              title={t(
                'Search result limit reached. Your query results are truncated, add more filter conditions to your query.'
              )}
            />
          ) : null}

          <PageSection isFilled={false} variant={'light'}>
            <div style={{ display: 'flex', alignItems: 'baseline' }}>
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
              />
            )}
          </PageSection>
          <SearchResultTables
            data={searchResultItems}
            currentQuery={currentQuery}
            setDeleteResource={setDeleteResource}
          />
        </Stack>
      </PageSection>
    </Fragment>
  )
}
