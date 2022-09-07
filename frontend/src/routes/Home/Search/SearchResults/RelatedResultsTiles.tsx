// Copyright Contributors to the Open Cluster Management project
import { Alert, Grid, GridItem, Stack, StackItem } from '@patternfly/react-core'
import { useTranslation } from '../../../../lib/acm-i18next'
import { AcmTile } from '../../../../ui-components'
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
            <Grid hasGutter>
                <GridItem span={3}>
                    <AcmTile loading={true} title={'loading'} />
                </GridItem>
                <GridItem span={3}>
                    <AcmTile loading={true} title={'loading'} />
                </GridItem>
                <GridItem span={3}>
                    <AcmTile loading={true} title={'loading'} />
                </GridItem>
                <GridItem span={3}>
                    <AcmTile loading={true} title={'loading'} />
                </GridItem>
            </Grid>
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
    return (
        <Grid hasGutter>
            {relatedCounts.map((count) => {
                return (
                    <GridItem span={3}>
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
                    </GridItem>
                )
            })}
        </Grid>
    )
}
