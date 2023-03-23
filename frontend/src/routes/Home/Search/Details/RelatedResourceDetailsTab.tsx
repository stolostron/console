/* Copyright Contributors to the Open Cluster Management project */
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionToggle,
  Alert,
  PageSection,
  Stack,
} from '@patternfly/react-core'
import _ from 'lodash'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from '../../../../lib/acm-i18next'
import { getGroupFromApiVersion, IResource } from '../../../../resources'
import { useSharedAtoms } from '../../../../shared-recoil'
import { AcmLoadingPage, AcmTable } from '../../../../ui-components'
import { searchClient } from '../search-sdk/search-client'
import { SearchRelatedResult, useSearchResultRelatedItemsQuery } from '../search-sdk/search-sdk'
import { useSearchDefinitions } from '../searchDefinitions'

export default function RelatedResourceDetailsTab(props: { cluster: string; resource: IResource }) {
  const { cluster, resource } = props
  const { t } = useTranslation()
  const { useSearchResultLimit } = useSharedAtoms()
  const searchResultLimit = useSearchResultLimit()
  const [accordionKeys, setAccordionKeys] = useState<string[]>([])

  const { kind, name, namespace, apiGroup } = useMemo(() => {
    return {
      kind: resource?.kind,
      name: resource?.metadata?.name ?? '',
      namespace: resource?.metadata?.namespace ?? '',
      apiGroup: getGroupFromApiVersion(resource?.apiVersion ?? '').apiGroup,
    }
  }, [resource])

  const relatedResQueryFilters = useMemo(() => {
    const filters = [
      { property: 'kind', values: [kind] },
      {
        property: 'cluster',
        values: [cluster],
      },
      {
        property: 'name',
        values: [name],
      },
    ]
    if (namespace && namespace !== '') {
      filters.push({
        property: 'namespace',
        values: [namespace],
      })
    }
    if (apiGroup && apiGroup !== '') {
      filters.push({
        property: 'apigroup',
        values: [apiGroup],
      })
    }
    return filters
  }, [kind, name, namespace, cluster, apiGroup])

  const { data, loading, error } = useSearchResultRelatedItemsQuery({
    skip: !resource,
    client: process.env.NODE_ENV === 'test' ? undefined : searchClient,
    variables: {
      input: [
        {
          keywords: [],
          filters: relatedResQueryFilters,
          limit: searchResultLimit,
        },
      ],
    },
  })

  const relatedResultItems = useMemo(() => data?.searchResult?.[0]?.related || [], [data?.searchResult])
  const searchDefinitions = useSearchDefinitions()

  const renderContent = useCallback(
    (kind: string, items: SearchRelatedResult[]) => {
      return (
        <AcmTable
          items={items}
          emptyState={undefined} // table only shown for kinds with related resources
          columns={_.get(
            searchDefinitions,
            `[${kind.toLowerCase()}].columns`,
            searchDefinitions['genericresource'].columns
          )}
          keyFn={(item: any) => item._uid.toString()}
        />
      )
    },
    [searchDefinitions]
  )

  const {
    kindSearchResultItems,
    kinds,
  }: { kindSearchResultItems: Record<string, SearchRelatedResult[]>; kinds: string[] } = useMemo(() => {
    const kindSearchResultItems: Record<string, SearchRelatedResult[]> = {}
    if (relatedResultItems) {
      for (const relatedResultItem of relatedResultItems) {
        if (relatedResultItem) {
          const existing = kindSearchResultItems[relatedResultItem.kind]
          if (!existing) {
            kindSearchResultItems[relatedResultItem?.kind] = [relatedResultItem]
          } else {
            kindSearchResultItems[relatedResultItem?.kind].push(relatedResultItem)
          }
        }
      }
    }
    const kinds = Object.keys(kindSearchResultItems)

    return { kindSearchResultItems, kinds }
  }, [relatedResultItems])

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
        <Alert variant={'danger'} isInline={true} title={t('An unexpected error occurred.')}>
          {error}
        </Alert>
      </PageSection>
    )
  }

  if (relatedResultItems.length === 0) {
    return (
      <PageSection>
        <Alert variant={'info'} isInline={true} title={t('There are no resources related to your search results.')}>
          {error}
        </Alert>
      </PageSection>
    )
  }

  return (
    <PageSection>
      <Stack hasGutter>
        {relatedResultItems.length >= searchResultLimit ? (
          <Alert
            variant={'warning'}
            isInline={true}
            title={t('Search result limit reached. Your query results are truncated.')}
          />
        ) : null}
        <PageSection isFilled={false} variant={'light'}>
          <Accordion isBordered asDefinitionList={true}>
            {kinds.sort().map((kind: string, idx: number) => {
              const accordionItemKey = `${kind}-${idx}`
              const items = kindSearchResultItems[kind][0].items
              const kindString = kind.split('.')[0]
              const apiVersionString = kind.split('.')[1]
              return (
                <AccordionItem key={`${kind}-accordion-item`}>
                  <AccordionToggle
                    onClick={() => {
                      const index = accordionKeys.indexOf(accordionItemKey)
                      const newExpanded: string[] =
                        index >= 0
                          ? [...accordionKeys.slice(0, index), ...accordionKeys.slice(index + 1, accordionKeys.length)]
                          : [...accordionKeys, accordionItemKey]
                      setAccordionKeys(newExpanded)
                    }}
                    isExpanded={accordionKeys.includes(accordionItemKey)}
                    id={accordionItemKey}
                  >
                    <span style={{ flexDirection: 'row' }}>
                      <span style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                        {kindString}
                        <div
                          style={{
                            marginLeft: '10px',
                            fontSize: 'var(--pf-global--FontSize--sm)',
                            color: 'var(--pf-global--Color--200)',
                          }}
                        >
                          {apiVersionString} {`(${items.length})`}
                        </div>
                      </span>
                    </span>
                  </AccordionToggle>
                  <AccordionContent isHidden={!accordionKeys.includes(accordionItemKey)}>
                    {accordionKeys.includes(accordionItemKey) && renderContent(kind, items)}
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        </PageSection>
      </Stack>
    </PageSection>
  )
}
