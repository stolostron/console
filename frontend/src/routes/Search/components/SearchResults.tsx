/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
import '@patternfly/react-core/dist/styles/base.css'
import _ from 'lodash'
import { Fragment, useState } from 'react'
import {
    AcmAlert,
    AcmExpandableSection,
    AcmTable,
    AcmPageCard,
    AcmTile,
    AcmExpandableWrapper,
    AcmLoadingPage,
} from '@open-cluster-management/ui-components'
import { useTranslation } from 'react-i18next'
import { searchClient } from '../../../search-sdk/search-client'
import {
    useSearchResultItemsQuery,
    useSearchResultRelatedCountQuery,
    useSearchResultRelatedItemsQuery,
} from '../../../search-sdk/search-sdk'
import { convertStringToQuery } from '../search-helper'
import {
    DeleteResourceModal,
    IDeleteModalProps,
    ClosedDeleteModalProps,
} from '../components/Modals/DeleteResourceModal'
import { PageSection } from '@patternfly/react-core'
import searchDefinitions from '../searchDefinitions'

function GetRowActions(
    kind: string,
    rowTitle: string,
    currentQuery: string,
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
                          relatedResource: false,
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
    const { t } = useTranslation(['search'])
    const queryFilters = convertStringToQuery(currentQuery)
    const { data, loading, error } = useSearchResultRelatedItemsQuery({
        skip: selectedKinds.length === 0 || queryFilters.keywords.length > 0,
        client: process.env.NODE_ENV === 'test' ? undefined : searchClient,
        variables: {
            input: [{ ...convertStringToQuery(currentQuery), relatedKinds: selectedKinds }],
        },
    })

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
                    title={t('search.results.related.resources.error')}
                    subtitle={error ? error.message : ''}
                />
            </PageSection>
        )
    }
    const relatedResultItems = data.searchResult[0]?.related || []
    return selectedKinds.map((kind) => {
        const items = relatedResultItems.filter((item) => item?.kind === kind)
        if (items && items[0]?.items && items.length > 0) {
            return (
                <AcmPageCard key={`related-table-${kind}`}>
                    <AcmExpandableSection
                        label={`Related ${kind.charAt(0).toUpperCase()}${kind.slice(1)} (${items[0]?.items.length})`}
                        expanded={true}
                    >
                        <AcmTable
                            plural=""
                            items={items[0]?.items}
                            columns={_.get(
                                searchDefinitions,
                                `[${kind}].columns`,
                                searchDefinitions['genericresource'].columns
                            )}
                            keyFn={(item: any) => item._uid.toString()}
                            rowActions={GetRowActions(
                                kind,
                                t('search.results.delete.resource', { resourceKind: kind }),
                                currentQuery,
                                setDeleteResource
                            )}
                        />
                    </AcmExpandableSection>
                </AcmPageCard>
            )
        }
        return null
    })
}

function RenderRelatedTiles(
    currentQuery: string,
    selectedKinds: string[],
    setSelected: React.Dispatch<React.SetStateAction<string[]>>
) {
    const { t } = useTranslation(['search'])
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
                    title={t('search.results.related.error')}
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

function RenderSearchTables(
    currentQuery: string,
    setDeleteResource: React.Dispatch<React.SetStateAction<IDeleteModalProps>>,
    selectedRelatedKinds: string[]
) {
    const { t } = useTranslation(['search'])
    const { data, error, loading } = useSearchResultItemsQuery({
        client: process.env.NODE_ENV === 'test' ? undefined : searchClient,
        variables: {
            input: [convertStringToQuery(currentQuery)],
        },
    })

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
                    title={t('search.results.error')}
                    subtitle={error ? error.message : ''}
                />
            </PageSection>
        )
    }
    const searchResultItems = data.searchResult[0]?.items || []
    const uniqueKinds: string[] = _.uniq(searchResultItems.map((item: { kind: string }) => item.kind))

    if (searchResultItems.length === 0) {
        return (
            <PageSection>
                <AcmAlert noClose={true} variant={'info'} isInline={true} title={t('search.results.no.results')} />
            </PageSection>
        )
    }

    return (
        <div>
            {searchResultItems.length >= 10000 ? (
                <PageSection>
                    <AcmAlert
                        noClose={true}
                        variant={'warning'}
                        isInline={true}
                        title={t('search.results.limited.results')}
                    />
                </PageSection>
            ) : null}
            {uniqueKinds.map((kind: string) => {
                const items = searchResultItems.filter(
                    (item: { kind: string; __type: string }) => item.kind === kind || item.__type === kind
                )
                return (
                    <AcmPageCard key={`results-table-${kind}`}>
                        <AcmExpandableSection
                            label={`${kind.charAt(0).toUpperCase()}${kind.slice(1)} (${items.length})`}
                            expanded={selectedRelatedKinds.length === 0}
                        >
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
                                    t('search.results.delete.resource', { resourceKind: kind }),
                                    currentQuery,
                                    setDeleteResource
                                )}
                            />
                        </AcmExpandableSection>
                    </AcmPageCard>
                )
            })}
        </div>
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
            {RenderSearchTables(currentQuery, setDeleteResource, selected)}
        </Fragment>
    )
}
