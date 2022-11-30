/* Copyright Contributors to the Open Cluster Management project */
import { CatalogCardItemType, CatalogColor, ICatalogCard, ItemView, PageHeader } from '@stolostron/react-data-view'
import { Fragment, useCallback, useMemo } from 'react'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { NavigationPath, useBackCancelNavigation } from '../../../../../NavigationPath'
import { AcmIcon, AcmIconVariant, Provider, ProviderIconMap, ProviderLongTextMap } from '../../../../../ui-components'
import { DOC_LINKS } from '../../../../../lib/doc-util'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { useSharedAtoms, useRecoilState } from '../../../../../shared-recoil'
import { ClusterInfrastructureType, getTypedCreateClusterPath } from '../ClusterInfrastructureType'

export function CreateClusterCatalog() {
    const [t] = useTranslation()
    const { nextStep, back, cancel } = useBackCancelNavigation()
    const { clusterImageSetsState, secretsState } = useSharedAtoms()
    const [secrets] = useRecoilState(secretsState)
    const [clusterImageSets] = useRecoilState(clusterImageSetsState)
    const credentials = useMemo(
        () =>
            secrets.filter(
                (secret) => secret?.metadata?.labels?.['cluster.open-cluster-management.io/credentials'] !== undefined
            ),
        [secrets]
    )

    const getCredentialLabels = useCallback(
        (provider: Provider) => {
            return credentials.filter(
                (secret) => secret?.metadata?.labels?.['cluster.open-cluster-management.io/type'] === provider
            ).length > 0
                ? [{ label: t('Saved credentials'), color: CatalogColor.green }]
                : undefined
        },
        [credentials, t]
    )

    const cards = useMemo(() => {
        const getProviderCard = (
            id: string,
            provider: Provider & ClusterInfrastructureType,
            description: string
        ): ICatalogCard => ({
            id,
            icon: <AcmIcon icon={ProviderIconMap[provider]} />,
            title: ProviderLongTextMap[provider],
            items: [
                {
                    type: CatalogCardItemType.Description,
                    description,
                },
            ],
            labels: getCredentialLabels(provider),
            onClick: nextStep(getTypedCreateClusterPath(provider)),
        })
        const newCards: ICatalogCard[] = [
            {
                id: 'aws',
                icon: <AcmIcon icon={AcmIconVariant.aws} />,
                title: t('Amazon Web Services'),
                items: [
                    {
                        type: CatalogCardItemType.Description,
                        description: t('A Red Hat OpenShift cluster that is running in your AWS subscription.'),
                    },
                ],
                labels: getCredentialLabels(Provider.aws),
                onClick: nextStep(NavigationPath.createAWSControlPlane),
            },
            // getProviderCard(
            //     'alibaba',
            //     Provider.alibaba,
            //     /*t*/('An OpenShift cluster running in your ALIBABA subscription that uses the ACM multicloud API.')
            // ),
            getProviderCard(
                'google',
                Provider.gcp,
                t('A Red Hat OpenShift cluster that is running in your Google Cloud subscription.')
            ),
            {
                id: 'hostinventory',
                icon: <AcmIcon icon={AcmIconVariant.hybrid} />,
                title: t('Host inventory'),
                items: [
                    {
                        type: CatalogCardItemType.Description,
                        description: t(
                            'A Red Hat OpenShift cluster that is running on available hosts from your inventory.'
                        ),
                    },
                ],
                labels: getCredentialLabels(Provider.hostinventory),
                onClick: clusterImageSets.length ? nextStep(NavigationPath.createBMControlPlane) : undefined,
                alertTitle: clusterImageSets.length ? undefined : t('OpenShift release images unavailable'),
                alertVariant: 'info',
                alertContent: (
                    <>
                        {t(
                            'No release image is available. Follow cluster creation prerequisite documentation to learn how to add release images.'
                        )}
                        <br />
                        <br />
                        <a href={DOC_LINKS.CREATE_CLUSTER_PREREQ} target="_blank" rel="noopener noreferrer">
                            {t('View documentation')} <ExternalLinkAltIcon />
                        </a>
                    </>
                ),
            },
            getProviderCard(
                'azure',
                Provider.azure,
                t('A Red Hat OpenShift cluster that is running in your Azure subscription.')
            ),
            getProviderCard(
                'openstack',
                Provider.openstack,
                t(
                    'A Red Hat OpenShift cluster that is hosted on the Red Hat OpenStack Platform in your on-premise data center.'
                )
            ),
            getProviderCard(
                'rhv',
                Provider.redhatvirtualization,
                t(
                    'A Red Hat OpenShift cluster that is running in a Red Hat Virtualization environment in your on-premise data center.'
                )
            ),
            getProviderCard(
                'vsphere',
                Provider.vmware,
                t(
                    'A Red Hat OpenShift cluster that is running in a vSphere environment in your on-premise data center.'
                )
            ),
        ]
        return newCards
    }, [nextStep, getCredentialLabels, clusterImageSets.length, t])

    const keyFn = useCallback((card: ICatalogCard) => card.id, [])

    const breadcrumbs = useMemo(
        () => [{ label: t('Clusters'), to: NavigationPath.clusters }, { label: t('Infrastructure') }],
        [t]
    )

    return (
        <Fragment>
            <PageHeader
                title={t('Infrastructure')}
                description={t('Choose your infrastructure provider.')}
                breadcrumbs={breadcrumbs}
            />
            <ItemView
                items={cards}
                itemKeyFn={keyFn}
                itemToCardFn={(card) => card}
                onBack={back(NavigationPath.clusters)}
                onCancel={cancel(NavigationPath.clusters)}
            />
        </Fragment>
    )
}
