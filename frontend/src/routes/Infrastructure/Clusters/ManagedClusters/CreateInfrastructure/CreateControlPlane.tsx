/* Copyright Contributors to the Open Cluster Management project */
import { CheckIcon } from '@patternfly/react-icons'
import {
    CatalogCardItemType,
    DataView,
    getPatternflyColor,
    ICatalogBreadcrumb,
    ICatalogCard,
    PageHeader,
    PatternFlyColor,
} from '@stolostron/react-data-view'
import { Fragment, useCallback, useMemo } from 'react'
import { useHistory } from 'react-router-dom'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { NavigationPath } from '../../../../../NavigationPath'

export function CreateControlPlane() {
    const [t] = useTranslation()
    const cards = useMemo(() => {
        const cards: ICatalogCard[] = [
            {
                id: 'hosted',
                title: t('Hosted'),
                items: [
                    {
                        type: CatalogCardItemType.Description,
                        description: t(
                            t(
                                'Run OpenShift in a hyperscale manner with many control planes hosted on a central hosting service cluster.'
                            )
                        ),
                    },
                    {
                        type: CatalogCardItemType.List,
                        title: t('Features'),
                        icon: <CheckIcon color={getPatternflyColor(PatternFlyColor.Green)} />,
                        items: [
                            { text: t('Better hardware utilization') },
                            { text: t('Network and trusted segmentation between control plane and workers') },
                            { text: t('Rapid cluster creation') },
                        ],
                    },
                    {
                        type: CatalogCardItemType.List,
                        title: t('Available cluster types'),
                        icon: <CheckIcon color={getPatternflyColor(PatternFlyColor.Green)} />,
                        items: [{ text: t('Hosted cluster') }],
                    },
                ],
                onClick: () => history.push(NavigationPath.createCluster),
            },
            {
                id: 'standalone',
                title: t('Standalone'),
                items: [
                    {
                        type: CatalogCardItemType.Description,
                        description: t('Run an OpenShift cluster with dedicated control planes nodes.'),
                    },
                    {
                        type: CatalogCardItemType.List,
                        title: t('Features'),
                        icon: <CheckIcon color={getPatternflyColor(PatternFlyColor.Green)} />,
                        items: [
                            { text: t('Increased resiliency with multiple masters') },
                            { text: t('Isolation of workload creates secure profile') },
                            { text: t('Dedicated control plane nodes') },
                        ],
                    },
                    {
                        type: CatalogCardItemType.List,
                        title: t('Available cluster types'),
                        icon: <CheckIcon color={getPatternflyColor(PatternFlyColor.Green)} />,
                        items: [{ text: t('ACM Hub') }, { text: t('Hosting service cluster') }],
                    },
                ],
                onClick: () => history.push(NavigationPath.createCluster),
            },
        ]
        return cards
    }, [])

    const keyFn = useCallback((card: ICatalogCard) => card.id, [])

    const breadcrumbs = useMemo(() => {
        const breadcrumbs: ICatalogBreadcrumb[] = [
            { label: t('Clusters'), to: NavigationPath.clusters },
            { label: t('Infrastructure'), to: NavigationPath.createInfrastructure },
            { label: t('Control Plane') },
        ]
        return breadcrumbs
    }, [])

    const history = useHistory()
    const onBack = useCallback(() => history.push(NavigationPath.createInfrastructure), [history])

    return (
        <Fragment>
            <PageHeader
                title={t('Control Plane')}
                description={t('Next, select a control plane type for your on-premise machine.')}
                breadcrumbs={breadcrumbs}
            />
            <DataView items={cards} itemKeyFn={keyFn} itemToCardFn={(card) => card} onBack={onBack} />
        </Fragment>
    )
}
