/* Copyright Contributors to the Open Cluster Management project */
import { CatalogCardItemType, ItemView, ICatalogCard, PageHeader } from '@stolostron/react-data-view'
import { Fragment, useCallback, useMemo } from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { CancelBackState, cancelNavigation, NavigationPath } from '../../../../../NavigationPath'

export function CreateDiscoverHost() {
    const [t] = useTranslation()
    const location = useLocation<CancelBackState>()
    const history = useHistory()

    const cards = useMemo(() => {
        const newCards: ICatalogCard[] = [
            {
                id: 'existinghost',
                title: t('Use existing hosts'),
                items: [
                    {
                        type: CatalogCardItemType.Description,
                        description: t(
                            t(
                                'Create a cluster from hosts that have been discovered and made available in your host inventory.'
                            )
                        ),
                    },
                ],
                onClick: () =>
                    history.push({
                        pathname: NavigationPath.createCluster,
                        search: '?infrastructureType=CIM',
                    }),
            },
            {
                id: 'discover',
                title: t('Discover new hosts'),
                items: [
                    {
                        type: CatalogCardItemType.Description,
                        description: t(
                            'Discover new hosts while creating the cluster without an existing host inventory.'
                        ),
                    },
                ],
                onClick: () =>
                    history.push({
                        pathname: NavigationPath.createCluster,
                        search: '?infrastructureType=AI',
                    }),
            },
        ]
        return newCards
    }, [history, t])

    const keyFn = useCallback((card: ICatalogCard) => card.id, [])

    const breadcrumbs = [
        { label: t('Clusters'), to: NavigationPath.clusters },
        { label: t('Infrastructure'), to: NavigationPath.createCluster },
        { label: t('Control plane type'), to: NavigationPath.createControlPlane },
        { label: t('Hosts') },
    ]

    const onBack = useCallback(() => history.push(NavigationPath.createControlPlane), [history])

    return (
        <Fragment>
            <PageHeader
                title={t('Hosts')}
                description={t('Choose an option based on your hosts.')}
                breadcrumbs={breadcrumbs}
            />
            <ItemView
                items={cards}
                itemKeyFn={keyFn}
                itemToCardFn={(card) => card}
                onBack={onBack}
                onCancel={() => cancelNavigation(location, history, NavigationPath.clusters)}
            />
        </Fragment>
    )
}
