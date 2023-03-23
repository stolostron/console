// Copyright Contributors to the Open Cluster Management project
import { Alert, Grid, GridItem, Stack, StackItem } from '@patternfly/react-core'
import { useTranslation } from '../../../../lib/acm-i18next'
import { useSharedAtoms } from '../../../../shared-recoil'
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
            <Grid hasGutter>
                <GridItem key={'loading-tile-0'} id={'acmtile-loading'} span={3}>
                    <AcmTile loading={true} title={t('Loading')} />
                </GridItem>
                <GridItem key={'loading-tile-1'} id={'acmtile-loading'} span={3}>
                    <AcmTile loading={true} title={t('Loading')} />
                </GridItem>
                <GridItem key={'loading-tile-2'} id={'acmtile-loading'} span={3}>
                    <AcmTile loading={true} title={t('Loading')} />
                </GridItem>
                <GridItem key={'loading-tile-3'} id={'acmtile-loading'} span={3}>
                    <AcmTile loading={true} title={t('Loading')} />
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
    if (relatedCounts.length === 0) {
        return <Alert variant={'info'} isInline title={t('There are no resources related to your search results.')} />
    }

    return (
        <Grid hasGutter>
            {relatedCounts.map((count) => {
                const currentKind = count!.kind.toLowerCase()
                return (
                    <GridItem key={`grid-item-${currentKind}`} span={3}>
                        <AcmTile
                            key={`related-tile-${currentKind}`}
                            id={`related-tile-${currentKind}`}
                            isSelected={selectedKinds.indexOf(currentKind) > -1}
                            title={''}
                            onClick={() => {
                                const updatedKinds =
                                    selectedKinds.indexOf(currentKind) > -1
                                        ? selectedKinds.filter((kind) => kind !== currentKind)
                                        : [currentKind, ...selectedKinds]
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
