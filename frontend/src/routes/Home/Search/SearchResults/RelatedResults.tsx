// Copyright Contributors to the Open Cluster Management project
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionToggle,
  Alert,
  Skeleton,
  Stack,
  StackItem,
} from '@patternfly/react-core'
import _ from 'lodash'
import { useMemo } from 'react'
import { useTranslation } from '../../../../lib/acm-i18next'
import { useSharedAtoms } from '../../../../shared-recoil'
import { AcmLoadingPage, AcmTable } from '../../../../ui-components'
import { IDeleteModalProps } from '../components/Modals/DeleteResourceModal'
import { convertStringToQuery } from '../search-helper'
import { searchClient } from '../search-sdk/search-client'
import { useSearchResultRelatedCountQuery, useSearchResultRelatedItemsQuery } from '../search-sdk/search-sdk'
import { useSearchDefinitions } from '../searchDefinitions'
import { GetRowActions } from './utils'

export function RenderItemContent(props: {
  currentQuery: string
  relatedKind: string
  setDeleteResource: React.Dispatch<React.SetStateAction<IDeleteModalProps>>
}) {
  const { currentQuery, relatedKind, setDeleteResource } = props
  const { t } = useTranslation()
  const { useSearchResultLimit } = useSharedAtoms()
  const searchResultLimit = useSearchResultLimit()
  const { data, loading, error } = useSearchResultRelatedItemsQuery({
    client: process.env.NODE_ENV === 'test' ? undefined : searchClient,
    variables: {
      input: [{ ...convertStringToQuery(currentQuery, searchResultLimit), relatedKinds: [relatedKind] }],
    },
  })

  const searchDefinitions = useSearchDefinitions()
  const colDefs = _.get(
    searchDefinitions,
    `[${relatedKind.toLowerCase()}].columns`,
    searchDefinitions['genericresource'].columns
  )
  const relatedResultItems = useMemo(() => data?.searchResult?.[0]?.related?.[0]?.items || [], [data])

  if (error) {
    return (
      <Alert variant={'danger'} isInline title={t('Query error related to the search results.')}>
        <Stack>
          <StackItem>{error ? error.message : ''}</StackItem>
        </Stack>
      </Alert>
    )
  }

  if (loading) {
    return <AcmLoadingPage />
  }

  return (
    <AcmTable
      items={relatedResultItems}
      emptyState={undefined} // table only shown for kinds with related resources
      columns={colDefs}
      keyFn={(item: any) => item?._uid.toString() ?? `${item.name}-${item.namespace}-${item.cluster}`}
      rowActions={GetRowActions(relatedKind, currentQuery, true, setDeleteResource, t)}
    />
  )
}

export default function RelatedResults(props: {
  currentQuery: string
  selectedRelatedKinds: string[]
  setSelectedRelatedKinds: React.Dispatch<React.SetStateAction<string[]>>
  setDeleteResource: React.Dispatch<React.SetStateAction<IDeleteModalProps>>
}) {
  const { currentQuery, selectedRelatedKinds, setSelectedRelatedKinds, setDeleteResource } = props
  const { t } = useTranslation()
  const { useSearchResultLimit } = useSharedAtoms()
  const searchResultLimit = useSearchResultLimit()
  const queryFilters = convertStringToQuery(currentQuery, searchResultLimit)
  const { data, error, loading } = useSearchResultRelatedCountQuery({
    client: process.env.NODE_ENV === 'test' ? undefined : searchClient,
    variables: {
      input: [queryFilters],
    },
  })

  if (loading) {
    return (
      <Accordion isBordered asDefinitionList={true}>
        <AccordionItem>
          <AccordionToggle id={'loading-acc-item-1'}>
            <Skeleton width={'250px'} />
          </AccordionToggle>
        </AccordionItem>
        <AccordionItem>
          <AccordionToggle id={'loading-acc-item-2'}>
            <Skeleton width={'250px'} />
          </AccordionToggle>
        </AccordionItem>
        <AccordionItem>
          <AccordionToggle id={'loading-acc-item-3'}>
            <Skeleton width={'250px'} />
          </AccordionToggle>
        </AccordionItem>
      </Accordion>
    )
  } else if (error || !data || !data.searchResult) {
    return (
      <Alert variant={'danger'} isInline title={t('Query error related to the search results.')}>
        <Stack>
          <StackItem>{t('Error occurred while contacting the search service.')}</StackItem>
          <StackItem>{error ? error.message : ''}</StackItem>
        </Stack>
      </Alert>
    )
  }

  const relatedCounts = data.searchResult[0]?.related || []
  if (relatedCounts.length === 0) {
    return <Alert variant={'info'} isInline title={t('There are no resources related to your search results.')} />
  }

  return (
    <Accordion isBordered asDefinitionList={true}>
      {relatedCounts.map((count: any, idx: number) => {
        const currentKind = count!.kind
        const accordionItemKey = `${currentKind}-${idx}`
        const isExpanded = selectedRelatedKinds.indexOf(currentKind.toLowerCase()) > -1
        return (
          <AccordionItem key={`${currentKind}-accordion-item`}>
            <AccordionToggle
              onClick={() => {
                const updatedKinds = isExpanded
                  ? selectedRelatedKinds.filter((kind) => kind !== currentKind.toLowerCase())
                  : [currentKind.toLowerCase(), ...selectedRelatedKinds]
                setSelectedRelatedKinds(updatedKinds)
              }}
              isExpanded={isExpanded}
              id={accordionItemKey}
            >
              <span style={{ flexDirection: 'row' }}>
                <span style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  {currentKind}
                  <div
                    style={{
                      marginLeft: '10px',
                      fontSize: 'var(--pf-global--FontSize--sm)',
                      color: 'var(--pf-global--Color--200)',
                    }}
                  >
                    {`(${count!.count})`}
                  </div>
                </span>
              </span>
            </AccordionToggle>
            <AccordionContent isHidden={!isExpanded}>
              {isExpanded && (
                <RenderItemContent
                  currentQuery={currentQuery}
                  relatedKind={currentKind}
                  setDeleteResource={setDeleteResource}
                />
              )}
            </AccordionContent>
          </AccordionItem>
        )
      })}
    </Accordion>
  )
}
