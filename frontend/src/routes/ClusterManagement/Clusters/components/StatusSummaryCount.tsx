import React, { useContext, useEffect, useCallback } from 'react'
import { useHistory } from 'react-router-dom'
import { useTranslation, Trans } from 'react-i18next'
import { Card, CardBody, Skeleton } from '@patternfly/react-core'
import { AcmCountCardSection } from '@open-cluster-management/ui-components'
import { ClusterContext } from '../ClusterDetails/ClusterDetails'
import { queryStatusCount } from '../../../../lib/search'
import { useQuery } from '../../../../lib/useQuery'
import { NavigationPath } from '../../../../NavigationPath'

const buildSearchLink = (filters: Record<string, string>, relatedKind?: string)  => {
    let query = ''
    Object.keys(filters).forEach((key) => (query += `${query ? '%20' : ''}${key}:${filters[key]}`))
    return `/search?filters={"textsearch":"${query}"}${relatedKind ? `&showrelated=${relatedKind}` : ''}`
}

export function StatusSummaryCount() {
    const { cluster } = useContext(ClusterContext)
    const { t } = useTranslation(['cluster'])
    const { push } = useHistory()
    const { data, loading, startPolling, error } = useQuery(
        useCallback(() => queryStatusCount(cluster?.name ?? ''), [cluster?.name])
    )

    useEffect(startPolling, [startPolling])

    console.log('loading', loading, 'data', data, 'error', error)

    if (loading) {
        return (
            <Card style={{ height: '231px', marginTop: '24px' }}>
                <CardBody>
                    <Skeleton height="100%" role="progressbar" screenreaderText={t('summary.status.loading')} />
                </CardBody>
            </Card>
        )
    }

    if (data) {
        const applicationQuery = data?.[0].data.searchResult[0]
        const violationQuery = data?.[0].data.searchResult[1]
        const appCount = applicationQuery?.related[0]?.count ?? 0
        const violationCount = violationQuery?.count ?? 0
        return (
            <div style={{ marginTop: '24px' }}>
                <AcmCountCardSection
                    id='summary-status'
                    title={t('summary.status')}
                    cards={[
                        {
                            id: 'nodes',
                            count: cluster?.nodes?.nodeList?.length ?? 0,
                            countClick: () => push(NavigationPath.clusterNodes.replace(':id', cluster?.name ?? '')),
                            title: t('summary.nodes'),
                            description: <Trans i18nKey="cluster:summary.nodes.inactive" values={{ number: cluster?.nodes?.inactive }} />,
                        },
                        {
                            id: 'applications',
                            count: appCount,
                            countClick: () =>
                                window.open(
                                    buildSearchLink({ cluster: cluster?.name ?? '', kind: 'subscription' }, 'application'),
                                    '_self'
                                ),
                            title: t('summary.applications'),
                            linkText: t('summary.applications.launch'),
                            onLinkClick: () => window.open('/multicloud/applications', '_self'),
                        },
                        {
                            id: 'violations',
                            count: violationCount,
                            countClick: () =>
                                window.open(
                                    buildSearchLink({
                                        cluster: 'local-cluster',
                                        kind: 'policy',
                                        namespace: cluster?.namespace ?? '',
                                        compliant: '!Compliant',
                                    }),
                                    '_self'
                                ),
                            title: t('summary.violations'),
                            linkText: t('summary.violations.launch'),
                            onLinkClick: () => window.open('/multicloud/policies', '_self'),
                            isDanger: true,
                        },
                    ]}
                />
            </div>
        )
    }

    return null
}
