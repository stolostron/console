// Copyright Contributors to the Open Cluster Management project
import { Alert, Stack, StackItem } from '@patternfly/react-core'
import _ from 'lodash'
import { useCallback } from 'react'
import { useTranslation } from '../../../../lib/acm-i18next'
import { AcmLoadingPage, AcmTable } from '../../../../ui-components'
import { IDeleteModalProps } from '../components/Modals/DeleteResourceModal'
import { convertStringToQuery } from '../search-helper'
import { searchClient } from '../search-sdk/search-client'
import { useSearchResultRelatedItemsQuery } from '../search-sdk/search-sdk'
import searchDefinitions from '../searchDefinitions'
import { GetRowActions, ISearchResult, SearchResultExpandableCard } from './utils'

export default function RelatedResultsTables(props: {
    currentQuery: string
    selectedKinds: string[]
    setDeleteResource: React.Dispatch<React.SetStateAction<IDeleteModalProps>>
}) {
    const { currentQuery, selectedKinds, setDeleteResource } = props
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
        return <AcmLoadingPage />
    } else if (error || !data || !data.searchResult) {
        return (
            <Alert variant={'danger'} isInline title={t('Error querying related resources')}>
                <Stack>
                    <StackItem>{t('An error occurred while contacting the search service.')}</StackItem>
                    <StackItem>{error ? error.message : ''}</StackItem>
                </Stack>
            </Alert>
        )
    }

    const relatedResultItems = data.searchResult[0]?.related || []
    return (
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
                /* istanbul ignore next */
                return null
            })}
        </Stack>
    )
}
