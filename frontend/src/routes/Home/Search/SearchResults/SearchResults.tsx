// Copyright Contributors to the Open Cluster Management project
import { ExpandableSection, PageSection, Stack, Tooltip } from '@patternfly/react-core'
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons'
import { AcmAlert, AcmLoadingPage, AcmTable } from '@stolostron/ui-components'
import _ from 'lodash'
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from '../../../../lib/acm-i18next'
import {
    ClosedDeleteModalProps,
    DeleteResourceModal,
    IDeleteModalProps,
} from '../components/Modals/DeleteResourceModal'
import { convertStringToQuery } from '../search-helper'
import { searchClient } from '../search-sdk/search-client'
import { useSearchResultItemsLazyQuery } from '../search-sdk/search-sdk'
import searchDefinitions from '../searchDefinitions'
import RelatedResultsTables from './RelatedResultsTables'
import RelatedResultsTiles from './RelatedResultsTiles'
import { GetRowActions, ISearchResult, SearchResultExpandableCard } from './utils'

function SearchResultTables(props: {
    currentQuery: string
    setDeleteResource: React.Dispatch<React.SetStateAction<IDeleteModalProps>>
}) {
    const { currentQuery, setDeleteResource } = props
    const { t } = useTranslation()
    const [fireSearchQuery, { called, data, loading, error, refetch }] = useSearchResultItemsLazyQuery({
        client: process.env.NODE_ENV === 'test' ? undefined : searchClient,
    })

    useEffect(() => {
        if (!called) {
            fireSearchQuery({
                variables: { input: [convertStringToQuery(currentQuery)] },
            })
        } else {
            refetch &&
                refetch({
                    input: [convertStringToQuery(currentQuery)],
                })
        }
    }, [fireSearchQuery, currentQuery, called, refetch])

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
    const { t } = useTranslation()
    const [selectedKinds, setSelectedKinds] = useState<string[]>(preSelectedRelatedResources)
    const [deleteResource, setDeleteResource] = useState<IDeleteModalProps>(ClosedDeleteModalProps)
    const [showRelatedResources, setShowRelatedResources] = useState<boolean>(
        // If the url has a preselected related resource -> automatically show the selected related resource tables - otherwise hide the section
        preSelectedRelatedResources.length > 0 ? true : false
    )
    const isKeywordSearch = useMemo(() => {
        const queryFilters = convertStringToQuery(currentQuery)
        return queryFilters.keywords.length > 0
    }, [currentQuery])

    return (
        <Fragment>
            <DeleteResourceModal
                open={deleteResource.open}
                close={deleteResource.close}
                resource={deleteResource.resource}
                currentQuery={deleteResource.currentQuery}
                relatedResource={deleteResource.relatedResource}
            />
            <PageSection>
                {!isKeywordSearch && (
                    <ExpandableSection
                        onToggle={() => setShowRelatedResources(!showRelatedResources)}
                        isExpanded={showRelatedResources}
                        toggleContent={
                            <div>
                                <span>
                                    {!showRelatedResources ? 'Show related resources' : 'Hide related resources'}{' '}
                                </span>
                                <Tooltip
                                    content={t(
                                        'Related Kubernetes resources can be displayed to help aid in the correlation of data from one object to another.'
                                    )}
                                >
                                    <OutlinedQuestionCircleIcon color={'var(--pf-global--Color--200)'} />
                                </Tooltip>
                            </div>
                        }
                    >
                        {showRelatedResources && (
                            <RelatedResultsTiles
                                currentQuery={currentQuery}
                                selectedKinds={selectedKinds}
                                setSelectedKinds={setSelectedKinds}
                            />
                        )}
                        {showRelatedResources && (
                            <RelatedResultsTables
                                currentQuery={currentQuery}
                                selectedKinds={selectedKinds}
                                setDeleteResource={setDeleteResource}
                            />
                        )}
                    </ExpandableSection>
                )}
            </PageSection>
            <SearchResultTables currentQuery={currentQuery} setDeleteResource={setDeleteResource} />
        </Fragment>
    )
}
