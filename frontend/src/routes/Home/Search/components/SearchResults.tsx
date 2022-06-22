/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
import { Card, CardHeader, CardTitle, PageSection, Stack } from '@patternfly/react-core'
import { AcmAlert, AcmExpandableWrapper, AcmLoadingPage, AcmTable, AcmTile } from '../../../../ui-components'
import _ from 'lodash'
import { Fragment, ReactNode, useCallback, useState } from 'react'
import { useTranslation } from '../../../../lib/acm-i18next'
import { convertStringToQuery } from '../search-helper'
import { searchClient } from '../search-sdk/search-client'
import {
    useSearchResultItemsQuery,
    useSearchResultRelatedCountQuery,
    useSearchResultRelatedItemsQuery,
} from '../search-sdk/search-sdk'
import searchDefinitions from '../searchDefinitions'
import { ClosedDeleteModalProps, DeleteResourceModal, IDeleteModalProps } from './Modals/DeleteResourceModal'

function GetRowActions(
    kind: string,
    rowTitle: string,
    currentQuery: string,
    relatedResource: boolean,
    setDeleteResource: React.Dispatch<React.SetStateAction<IDeleteModalProps>>
) {
    return kind !== 'cluster' && kind !== 'release' && kind !== 'policyreport'
        ? [
              {
                  id: 'delete',
                  title: rowTitle,
                  click: (item: any) => {
                      setDeleteResource({
                          open: true,
                          close: () => setDeleteResource(ClosedDeleteModalProps),
                          resource: item,
                          currentQuery,
                          relatedResource,
                      })
                  },
              },
          ]
        : []
}

function RenderRelatedTables(
    currentQuery: string,
    selectedKinds: string[],
    setDeleteResource: React.Dispatch<React.SetStateAction<IDeleteModalProps>>
) {
    const { t } = useTranslation()
    const queryFilters = convertStringToQuery(currentQuery)
    const { data, loading, error } = useSearchResultRelatedItemsQuery({
        skip: selectedKinds.length === 0 || queryFilters.keywords.length > 0,
        client: process.env.NODE_ENV === 'test' ? undefined : searchClient,
        variables: {
            input: [{ ...convertStringToQuery(currentQuery), relatedKinds: selectedKinds }],
        },
    })

    const renderContent = useCallback(
        (kind: string, items: ISearchResult[]) => (
            <AcmTable
                plural=""
                items={items}
                columns={_.get(searchDefinitions, `[${kind}].columns`, searchDefinitions['genericresource'].columns)}
                keyFn={(item: any) => item._uid.toString()}
                rowActions={GetRowActions(
                    kind,
                    // TODO - Handle interpolation
                    t('Delete {{resourceKind}}', { resourceKind: kind }),
                    currentQuery,
                    true,
                    setDeleteResource
                )}
            />
        ),
        [currentQuery, setDeleteResource, t]
    )

    if (loading === false && !error && !data) {
        // Query was skipped because no related resources have been selected
        return null
    }
    if (loading) {
        return (
            <PageSection>
                <AcmLoadingPage />
            </PageSection>
        )
    } else if (error || !data || !data.searchResult) {
        return (
            <PageSection>
                <AcmAlert
                    noClose={true}
                    variant={'danger'}
                    isInline={true}
                    title={t('Error querying related resources')}
                    subtitle={error ? error.message : ''}
                />
            </PageSection>
        )
    }
    const relatedResultItems = data.searchResult[0]?.related || []

    return (
        <PageSection>
            <Stack hasGutter>
                {selectedKinds.map((kind) => {
                    const items = relatedResultItems.filter((item) => item?.kind === kind)
                    if (items && items[0]?.items && items.length > 0) {
                        return (
                            <SearchResultExpandableCard
                                key={`related-table-${kind}`}
                                title={`Related ${kind.charAt(0).toUpperCase()}${kind.slice(1)} (${
                                    items[0]?.items.length
                                })`}
                                renderContent={() => renderContent(kind, items[0]?.items)}
                                defaultExpanded
                            />
                        )
                    }
                    return null
                })}
            </Stack>
        </PageSection>
    )
}

function RenderRelatedTiles(
    currentQuery: string,
    selectedKinds: string[],
    setSelected: React.Dispatch<React.SetStateAction<string[]>>
) {
    const { t } = useTranslation()
    const queryFilters = convertStringToQuery(currentQuery)
    const { data, error, loading } = useSearchResultRelatedCountQuery({
        skip: queryFilters.keywords.length > 0,
        client: process.env.NODE_ENV === 'test' ? undefined : searchClient,
        variables: {
            input: [queryFilters],
        },
    })
    if (loading) {
        return (
            <PageSection>
                <AcmExpandableWrapper withCount={false} expandable={false}>
                    <AcmTile loading={true} title={'loading'} />
                    <AcmTile loading={true} title={'loading'} />
                    <AcmTile loading={true} title={'loading'} />
                    <AcmTile loading={true} title={'loading'} />
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
                    title={t('Query error related to the search results.')}
                    subtitle={error ? error.message : ''}
                />
            </PageSection>
        )
    } else if (data && data.searchResult) {
        const relatedCounts = data.searchResult[0]!.related || []
        return (
            <PageSection>
                <AcmExpandableWrapper maxHeight={'10rem'} withCount={true} expandable={relatedCounts.length > 2}>
                    {relatedCounts.map((count) => {
                        return (
                            <AcmTile
                                key={`related-tile-${count!.kind}`}
                                isSelected={selectedKinds.indexOf(count!.kind) > -1}
                                title={''}
                                onClick={() => {
                                    const updatedKinds =
                                        selectedKinds.indexOf(count!.kind) > -1
                                            ? selectedKinds.filter((kind) => kind !== count!.kind)
                                            : [count!.kind, ...selectedKinds]
                                    setSelected(updatedKinds)
                                }}
                                relatedResourceData={{ count: count!.count || 0, kind: count!.kind }}
                            />
                        )
                    })}
                </AcmExpandableWrapper>
            </PageSection>
        )
    }
    return null
}

interface ISearchResult {
    kind: string
    __type: string
}

function RenderSearchTables(
    currentQuery: string,
    setDeleteResource: React.Dispatch<React.SetStateAction<IDeleteModalProps>>
    // selectedRelatedKinds: string[]
) {
    const { t } = useTranslation()
    const { data, error, loading } = useSearchResultItemsQuery({
        client: process.env.NODE_ENV === 'test' ? undefined : searchClient,
        variables: { input: [convertStringToQuery(currentQuery)] },
    })

    const renderContent = useCallback(
        (kind: string, items: ISearchResult[]) => {
            return (
                <AcmTable
                    plural=""
                    items={items}
                    columns={_.get(
                        searchDefinitions,
                        `[${kind}].columns`,
                        searchDefinitions['genericresource'].columns
                    )}
                    keyFn={(item: any) => item._uid.toString()}
                    rowActions={GetRowActions(
                        kind,
                        // TODO - Handle interpolation
                        t('Delete {{resourceKind}}', { resourceKind: kind }),
                        currentQuery,
                        false,
                        setDeleteResource
                    )}
                />
            )
        },
        [currentQuery, setDeleteResource, t]
    )

    if (loading) {
        return (
            <PageSection>
                <AcmLoadingPage />
            </PageSection>
        )
    }

    if (error || !data || !data.searchResult) {
        return (
            <PageSection>
                <AcmAlert
                    noClose={true}
                    variant={'danger'}
                    isInline={true}
                    title={t('Error querying search results')}
                    subtitle={error ? error.message : ''}
                />
            </PageSection>
        )
    }

    const searchResultItems: ISearchResult[] = data.searchResult[0]?.items || []
    if (searchResultItems.length === 0) {
        return (
            <PageSection>
                <AcmAlert
                    noClose={true}
                    variant={'info'}
                    isInline={true}
                    title={t('No results found for the current search criteria.')}
                />
            </PageSection>
        )
    }

    const kindSearchResultItems: Record<string, ISearchResult[]> = {}
    for (const searchResultItem of searchResultItems) {
        const existing = kindSearchResultItems[searchResultItem.kind]
        if (!existing) {
            kindSearchResultItems[searchResultItem.kind] = [searchResultItem]
        } else {
            kindSearchResultItems[searchResultItem.kind].push(searchResultItem)
        }
    }

    const kinds = Object.keys(kindSearchResultItems)

    return (
        <Fragment>
            {searchResultItems.length >= 10000 ? (
                <PageSection>
                    <AcmAlert
                        noClose={true}
                        variant={'warning'}
                        isInline={true}
                        title={t(
                            'The search criteria matched too many resources, the results are truncated. Add more conditions to your search.'
                        )}
                    />
                </PageSection>
            ) : null}
            <PageSection>
                <Stack hasGutter>
                    {kinds.sort().map((kind: string) => {
                        const items = kindSearchResultItems[kind]
                        return (
                            <SearchResultExpandableCard
                                key={`results-table-${kind}`}
                                title={`${kind.charAt(0).toUpperCase()}${kind.slice(1)} (${items.length})`}
                                renderContent={() => renderContent(kind, items)}
                                defaultExpanded={kinds.length === 1}
                            />
                        )
                    })}
                </Stack>
            </PageSection>
        </Fragment>
    )
}

export default function SearchResults(props: { currentQuery: string; preSelectedRelatedResources: string[] }) {
    const { currentQuery, preSelectedRelatedResources } = props
    const [selected, setSelected] = useState<string[]>(preSelectedRelatedResources)
    const [deleteResource, setDeleteResource] = useState<IDeleteModalProps>(ClosedDeleteModalProps)

    return (
        <Fragment>
            <DeleteResourceModal
                open={deleteResource.open}
                close={deleteResource.close}
                resource={deleteResource.resource}
                currentQuery={deleteResource.currentQuery}
                relatedResource={deleteResource.relatedResource}
            />
            {RenderRelatedTiles(currentQuery, selected, setSelected)}
            {RenderRelatedTables(currentQuery, selected, setDeleteResource)}
            {RenderSearchTables(currentQuery, setDeleteResource)}
        </Fragment>
    )
}

export function SearchResultExpandableCard(props: {
    title: string
    renderContent: () => ReactNode
    defaultExpanded?: boolean
}) {
    const [open, setOpen] = useState(props.defaultExpanded !== undefined ? props.defaultExpanded : false)
    return (
        <Card isRounded isExpanded={open}>
            <CardHeader onExpand={() => setOpen(!open)} onClick={() => setOpen(!open)}>
                <CardTitle>{props.title}</CardTitle>
            </CardHeader>
            {open && props.renderContent()}
        </Card>
    )
}
