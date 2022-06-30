// Copyright Contributors to the Open Cluster Management project
import { AcmAlert, AcmExpandableWrapper, AcmTile } from '@stolostron/ui-components'
import { useTranslation } from '../../../../lib/acm-i18next'
import { convertStringToQuery } from '../search-helper'
import { searchClient } from '../search-sdk/search-client'
import { useSearchResultRelatedCountQuery } from '../search-sdk/search-sdk'

export default function RelatedResultsTiles(props: {
    currentQuery: string
    selectedKinds: string[]
    setSelectedKinds: React.Dispatch<React.SetStateAction<string[]>>
}) {
    const { currentQuery, selectedKinds, setSelectedKinds } = props
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
            <AcmExpandableWrapper withCount={false} expandable={false}>
                <AcmTile loading={true} title={'loading'} />
                <AcmTile loading={true} title={'loading'} />
                <AcmTile loading={true} title={'loading'} />
                <AcmTile loading={true} title={'loading'} />
            </AcmExpandableWrapper>
        )
    } else if (error || !data || !data.searchResult) {
        return (
            <AcmAlert
                noClose={true}
                variant={'danger'}
                isInline={true}
                title={t('Query error related to the search results.')}
                subtitle={error ? error.message : ''}
            />
        )
    }

    const relatedCounts = data.searchResult[0]?.related || []
    return (
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
                            setSelectedKinds(updatedKinds)
                        }}
                        relatedResourceData={{ count: count!.count || 0, kind: count!.kind }}
                    />
                )
            })}
        </AcmExpandableWrapper>
    )
}
