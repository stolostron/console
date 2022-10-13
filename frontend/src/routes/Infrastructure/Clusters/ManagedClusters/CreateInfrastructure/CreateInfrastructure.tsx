/* Copyright Contributors to the Open Cluster Management project */
import { CatalogCardItemType, CatalogColor, ICatalogCard, ItemView, PageHeader } from '@stolostron/react-data-view'
import { Fragment, useCallback, useMemo } from 'react'
import { useHistory } from 'react-router-dom'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { NavigationPath } from '../../../../../NavigationPath'
import { AcmIcon, AcmIconVariant, Provider } from '../../../../../ui-components'
import { DOC_LINKS } from '../../../../../lib/doc-util'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { useSharedAtoms, useRecoilState } from '../../../../../shared-recoil'

export function CreateInfrastructure() {
    const [t] = useTranslation()
    const history = useHistory()
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
                onClick: () =>
                    history.push({
                        pathname: NavigationPath.createCluster,
                        search: '?infrastructureType=AWS',
                    }),
            },
            // {
            //     id: 'alibaba',
            //     icon: <AcmIcon icon={AcmIconVariant.alibaba} />,
            //     title: t('Alibaba'),
            //     items: [
            //         {
            //             type: CatalogCardItemType.Description,
            //             description: t(
            //                 'An OpenShift cluster running in your ALIBABA subscription that uses the ACM multicloud API.'
            //             ),
            //         },
            //     ],
            //     labels: getCredentialLabels(Provider.alibaba),
            //     // onClick: () => history.push(NavigationPath.clusters),
            // },
            {
                id: 'google',
                icon: <AcmIcon icon={AcmIconVariant.gcp} />,
                title: t('Google Cloud'),
                items: [
                    {
                        type: CatalogCardItemType.Description,
                        description: t(
                            'A Red Hat OpenShift cluster that is running in your Google Cloud subscription.'
                        ),
                    },
                ],
                labels: getCredentialLabels(Provider.gcp),
                onClick: () =>
                    history.push({
                        pathname: NavigationPath.createCluster,
                        search: '?infrastructureType=GCP',
                    }),
            },
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
                onClick: clusterImageSets.length ? () => history.push(NavigationPath.createControlPlane) : undefined,
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
            {
                id: 'azure',
                icon: <AcmIcon icon={AcmIconVariant.azure} />,
                title: t('Microsoft Azure'),
                items: [
                    {
                        type: CatalogCardItemType.Description,
                        description: t('A Red Hat OpenShift cluster that is running in your Azure subscription.'),
                    },
                ],
                labels: getCredentialLabels(Provider.azure),
                onClick: () =>
                    history.push({
                        pathname: NavigationPath.createCluster,
                        search: '?infrastructureType=Azure',
                    }),
            },
            {
                id: 'openstack',
                icon: <AcmIcon icon={AcmIconVariant.redhat} />,
                title: t('Red Hat OpenStack Platform'),
                items: [
                    {
                        type: CatalogCardItemType.Description,
                        description: t(
                            'A Red Hat OpenShift cluster that is hosted on the Red Hat OpenStack Platform in your on-premise data center.'
                        ),
                    },
                ],
                labels: getCredentialLabels(Provider.openstack),
                onClick: () =>
                    history.push({
                        pathname: NavigationPath.createCluster,
                        search: '?infrastructureType=OpenStack',
                    }),
            },
            {
                id: 'rhv',
                icon: <AcmIcon icon={AcmIconVariant.redhat} />,
                title: t('Red Hat Virtualization'),
                items: [
                    {
                        type: CatalogCardItemType.Description,
                        description: t(
                            'A Red Hat OpenShift cluster that is running in a Red Hat Virtualization environment in your on-premise data center.'
                        ),
                    },
                ],
                labels: getCredentialLabels(Provider.redhatvirtualization),
                onClick: () =>
                    history.push({
                        pathname: NavigationPath.createCluster,
                        search: '?infrastructureType=RHV',
                    }),
            },
            {
                id: 'vsphere',
                icon: <AcmIcon icon={AcmIconVariant.vmware} />,
                title: t('VMware vSphere'),
                items: [
                    {
                        type: CatalogCardItemType.Description,
                        description: t(
                            'A Red Hat OpenShift cluster that is running in a vSphere environment in your on-premise data center.'
                        ),
                    },
                ],
                labels: getCredentialLabels(Provider.vmware),
                onClick: () =>
                    history.push({
                        pathname: NavigationPath.createCluster,
                        search: '?infrastructureType=vSphere',
                    }),
            },
        ]
        return newCards
    }, [getCredentialLabels, clusterImageSets.length, history, t])

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
                onBack={() => history.push(NavigationPath.clusters)}
                onCancel={() => history.push(NavigationPath.clusters)}
            />
        </Fragment>
    )
}
