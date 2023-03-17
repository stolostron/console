// Copyright Contributors to the Open Cluster Management project
import {
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
import { convertStringToQuery } from '../search-helper'
import { searchClient } from '../search-sdk/search-client'
import { useSearchResultItemsLazyQuery } from '../search-sdk/search-sdk'
import { useSearchDefinitions } from '../searchDefinitions'
import RelatedResultsTables from './RelatedResultsTables'
import RelatedResultsTiles from './RelatedResultsTiles'
import { GetRowActions, ISearchResult, SearchResultExpandableCard } from './utils'

function SearchResultTables(props: {
    data: ISearchResult[]
    currentQuery: string
    setDeleteResource: React.Dispatch<React.SetStateAction<IDeleteModalProps>>
}) {
    const { data, currentQuery, setDeleteResource } = props
    const { t } = useTranslation()
    const { useSearchQueryLimit } = useSharedAtoms()
    const searchQueryLimit = useSearchQueryLimit()

    const searchDefinitions = useSearchDefinitions()

    const renderContent = useCallback(
        (kind: string, items: ISearchResult[]) => {
            return (
                <AcmTable
                    plural=""
                    items={items}
                    columns={_.get(
                        searchDefinitions,
                        `[${kind.toLowerCase()}].columns`,
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
        [currentQuery, setDeleteResource, searchDefinitions, t]
    )

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

    return (
        <Fragment>
            {data.length >= searchQueryLimit ? (
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
        </Fragment>
    )
}

export default function SearchResults(props: { currentQuery: string; preSelectedRelatedResources: string[] }) {
    const { currentQuery, preSelectedRelatedResources } = props
    const { t } = useTranslation()
    const { useSearchQueryLimit } = useSharedAtoms()
    const searchQueryLimit = useSearchQueryLimit()
    const [selectedKinds, setSelectedKinds] = useState<string[]>(preSelectedRelatedResources)
    const [deleteResource, setDeleteResource] = useState<IDeleteModalProps>(ClosedDeleteModalProps)
    const [showRelatedResources, setShowRelatedResources] = useState<boolean>(
        // If the url has a preselected related resource -> automatically show the selected related resource tables - otherwise hide the section
        preSelectedRelatedResources.length > 0 ? true : false
    )

    const [fireSearchQuery, { called, data, loading, error, refetch }] = useSearchResultItemsLazyQuery({
        client: process.env.NODE_ENV === 'test' ? undefined : searchClient,
    })

    useEffect(() => {
        // If the current search query changes -> hide related resources
        if (preSelectedRelatedResources.length === 0) {
            setShowRelatedResources(false)
            setSelectedKinds([])
        }
    }, [preSelectedRelatedResources])

    useEffect(() => {
        if (!called) {
            fireSearchQuery({
                variables: { input: [convertStringToQuery(currentQuery, searchQueryLimit)] },
            })
        } else {
            refetch &&
                refetch({
                    input: [convertStringToQuery(currentQuery, searchQueryLimit)],
                })
        }
    }, [fireSearchQuery, currentQuery, called, refetch, searchQueryLimit])

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
            <PageSection>
                <Stack hasGutter>
                    <div style={{ display: 'flex', alignItems: 'baseline' }}>
                        <ExpandableSection
                            onToggle={() => setShowRelatedResources(!showRelatedResources)}
                            isExpanded={showRelatedResources}
                            toggleText={
                                !showRelatedResources ? t('Show related resources') : t('Hide related resources')
                            }
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
                        <RelatedResultsTiles
                            currentQuery={currentQuery}
                            selectedKinds={selectedKinds}
                            setSelectedKinds={setSelectedKinds}
                        />
                    )}
                    {showRelatedResources && selectedKinds.length > 0 && (
                        <RelatedResultsTables
                            currentQuery={currentQuery}
                            selectedKinds={selectedKinds}
                            setDeleteResource={setDeleteResource}
                        />
                    )}
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
