/* Copyright Contributors to the Open Cluster Management project */
import { CheckIcon, ExternalLinkAltIcon } from '@patternfly/react-icons'
import {
    CatalogCardItemType,
    CatalogColor,
    getPatternflyColor,
    ICatalogBreadcrumb,
    ICatalogCard,
    ItemView,
    PageHeader,
    PatternFlyColor,
} from '@stolostron/react-data-view'
import { Fragment, useCallback, useMemo } from 'react'
import { useHistory } from 'react-router-dom'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { DOC_LINKS } from '../../../../../lib/doc-util'
import { NavigationPath } from '../../../../../NavigationPath'
import { useSharedAtoms, useRecoilState } from '../../../../../shared-recoil'

const clusterTypeTooltips = 'Required operator: Red Hat Advanced Cluster Management or multicluster engine'

export function CreateControlPlane() {
    const [t] = useTranslation()
    const history = useHistory()
    const { customResourceDefinitionsState } = useSharedAtoms()
    const [crds] = useRecoilState(customResourceDefinitionsState)

    const isHypershiftEnabled = crds.some(({ metadata }) => metadata.name === 'hostedclusters.hypershift.openshift.io')

    const cards = useMemo(() => {
        const newCards: ICatalogCard[] = [
            {
                id: 'hosted',
                title: t('Hosted'),
                items: [
                    {
                        type: CatalogCardItemType.Description,
                        description: t(
                            'A fully capable cluster with a smaller resource requirement and quicker cluster creation.'
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
                onClick: isHypershiftEnabled
                    ? () =>
                          history.push({
                              pathname: NavigationPath.createCluster,
                              search: '?infrastructureType=CIMHypershift',
                          })
                    : undefined,
                alertTitle: isHypershiftEnabled
                    ? undefined
                    : t('Hosted control plane operator must be enabled in order to continue'),
                alertVariant: 'info',
                alertContent: (
                    <a href={DOC_LINKS.HYPERSHIFT_INTRO} target="_blank" rel="noopener noreferrer">
                        {t('View documentation')} <ExternalLinkAltIcon />
                    </a>
                ),
                badge: t('Technology preview'),
                badgeColor: CatalogColor.orange,
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
                        items: [
                            {
                                text: t('Multicluster Hub'),
                                help: t(clusterTypeTooltips),
                            },
                            {
                                text: t('Hosting service cluster'),
                                help: t(clusterTypeTooltips),
                            },
                            { text: t('Dedicated control plane') },
                        ],
                    },
                ],
                onClick: () => history.push(NavigationPath.createDicoverHost),
                badge: t('Classic'),
                badgeColor: CatalogColor.purple,
            },
        ]
        return newCards
    }, [history, t, isHypershiftEnabled])

    const keyFn = useCallback((card: ICatalogCard) => card.id, [])

    const breadcrumbs = useMemo(() => {
        const newBreadcrumbs: ICatalogBreadcrumb[] = [
            { label: t('Clusters'), to: NavigationPath.clusters },
            { label: t('Infrastructure'), to: NavigationPath.createInfrastructure },
            { label: t('Control plane type') },
        ]
        return newBreadcrumbs
    }, [t])

    return (
        <Fragment>
            <PageHeader
                title={t('Control plane type')}
                description={t('Choose a control plane type for your cluster.')}
                breadcrumbs={breadcrumbs}
            />
            <ItemView
                items={cards}
                itemKeyFn={keyFn}
                itemToCardFn={(card) => card}
                onBack={() => history.push(NavigationPath.createInfrastructure)}
                onCancel={() => history.push(NavigationPath.clusters)}
            />
        </Fragment>
    )
}
