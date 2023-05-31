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
import { AcmLoadingPage, AcmTable, compareStrings } from '../../../../ui-components'
import { searchClient } from '../search-sdk/search-client'
import { SearchRelatedResult, useSearchResultRelatedItemsQuery } from '../search-sdk/search-sdk'
import { useSearchDefinitions } from '../searchDefinitions'
import { ISearchResult } from '../SearchResults/utils'

export default function RelatedResourceDetailsTab(props: {
  cluster: string
  resource: IResource
  resourceLoading: boolean
}) {
  const { cluster, resource, resourceLoading } = props
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

  const { kindSearchResultItems, kinds }: { kindSearchResultItems: Record<string, ISearchResult[]>; kinds: string[] } =
    useMemo(() => {
      const kindSearchResultItems: Record<string, ISearchResult[]> = {}
      if (relatedResultItems) {
        for (const relatedResultItem of relatedResultItems) {
          console.log(relatedResultItem)
          for (const item of relatedResultItem?.items ?? []) {
            const apiGroup = item?.apigroup ? `${item?.apigroup}/${item?.apiversion}` : ''
            const groupAndKind = `${apiGroup}.${item.kind}`
            const existing = kindSearchResultItems[groupAndKind]
            if (!existing) {
              kindSearchResultItems[groupAndKind] = [item]
            } else {
              kindSearchResultItems[groupAndKind].push(item)
            }
          }
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
    }, [relatedResultItems])

  if (resourceLoading || loading) {
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

  if (data?.searchResult && relatedResultItems.length === 0) {
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
            title={t(
              'Search result limit has been reached. Your query results have been truncated. View the RHACM documentation to learn how to increase the search results limit.'
            )}
          />
        ) : null}
        <PageSection isFilled={false} variant={'light'}>
          <Accordion isBordered asDefinitionList={true}>
            {kinds.map((kind: string, idx: number) => {
              const accordionItemKey = `${kind}-${idx}`
              const items = kindSearchResultItems[kind]
              const apiGroup = items[0].apigroup ? `${items[0].apigroup}/${items[0].apiversion}` : items[0].apiversion

              const kindString = kind.split('.').pop() ?? ''
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
                        {/* Cluster is not a real Kube resource and therefore does not have apigroup/apiversion */}
                        {kindString.toLowerCase() !== 'cluster' && (
                          <span
                            style={{
                              marginLeft: '10px',
                              fontSize: 'var(--pf-global--FontSize--sm)',
                              color: 'var(--pf-global--Color--200)',
                            }}
                          >
                            {apiGroup}
                          </span>
                        )}
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
