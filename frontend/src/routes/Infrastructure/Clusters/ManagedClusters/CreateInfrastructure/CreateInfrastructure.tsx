/* Copyright Contributors to the Open Cluster Management project */
import { CatalogCardItemType, CatalogColor, ICatalogCard, ItemView, PageHeader } from '@stolostron/react-data-view'
import { Fragment, useCallback, useMemo } from 'react'
import { useHistory } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import { secretsState } from '../../../../../atoms'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { NavigationPath } from '../../../../../NavigationPath'
import { AcmIcon, AcmIconVariant, Provider } from '../../../../../ui-components'

export function CreateInfrastructure() {
    const [t] = useTranslation()
    const history = useHistory()
    const [secrets] = useRecoilState(secretsState)
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
                        description: t('An OpenShift cluster in your AWS account that uses the ACM multicloud API.'),
                    },
                ],
                labels: getCredentialLabels(Provider.aws),
                onClick: () => history.push(NavigationPath.createCluster),
            },
            {
                id: 'baremetal',
                icon: <AcmIcon icon={AcmIconVariant.baremetal} />,
                title: t('Bare Metal'),
                items: [
                    {
                        type: CatalogCardItemType.Description,
                        description: t(
                            'An OpenShift cluster running in a bare metal environment in your on-premises data center.'
                        ),
                    },
                ],
                badge: t('Tech preview'),
                badgeColor: CatalogColor.orange,
                onClick: () => history.push(NavigationPath.createControlPlane),
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
                            'An OpenShift cluster running in your Google Cloud subscription that uses the ACM multicloud API.'
                        ),
                    },
                ],
                labels: getCredentialLabels(Provider.gcp),
                onClick: () => history.push(NavigationPath.createCluster),
            },
            {
                id: 'azure',
                icon: <AcmIcon icon={AcmIconVariant.azure} />,
                title: t('Microsoft Azure'),
                items: [
                    {
                        type: CatalogCardItemType.Description,
                        description: t(
                            'An OpenShift cluster running in your Azure subscription that uses the ACM multicloud API.'
                        ),
                    },
                ],
                labels: getCredentialLabels(Provider.azure),
                onClick: () => history.push(NavigationPath.createCluster),
            },
            {
                id: 'openstack',
                icon: <AcmIcon icon={AcmIconVariant.redhat} />,
                title: t('Red Hat OpenStack Platform'),
                items: [
                    {
                        type: CatalogCardItemType.Description,
                        description: t('Create and manage your clusters hosted on virtual machines.'),
                    },
                ],
                labels: getCredentialLabels(Provider.openstack),
                onClick: () => history.push(NavigationPath.createCluster),
            },
            {
                id: 'rhv',
                icon: <AcmIcon icon={AcmIconVariant.redhat} />,
                title: t('Red Hat Virtualization'),
                items: [
                    {
                        type: CatalogCardItemType.Description,
                        description: t('Create and manage your clusters hosted on virtual machines.'),
                    },
                ],
                labels: getCredentialLabels(Provider.redhatvirtualization),
                onClick: () => history.push(NavigationPath.createCluster),
            },
            {
                id: 'vsphere',
                icon: <AcmIcon icon={AcmIconVariant.vmware} />,
                title: t('VMWare VSphere'),
                items: [
                    {
                        type: CatalogCardItemType.Description,
                        description: t(
                            'An OpenShift cluster running in a vSphere environment in your on-premises data center.'
                        ),
                    },
                ],
                labels: getCredentialLabels(Provider.vmware),
                onClick: () => history.push(NavigationPath.createCluster),
            },
        ]
        return newCards
    }, [getCredentialLabels, history, t])

    const keyFn = useCallback((card: ICatalogCard) => card.id, [])

    const breadcrumbs = useMemo(
        () => [{ label: t('Clusters'), to: NavigationPath.clusters }, { label: t('Infrastructure') }],
        [t]
    )

    const onBack = useCallback(() => history.push(NavigationPath.clusters), [history])

    return (
        <Fragment>
            <PageHeader
                title={t('Infrastructure')}
                description={t('First, choose your infrastructure provider.')}
                breadcrumbs={breadcrumbs}
            />
            <ItemView items={cards} itemKeyFn={keyFn} itemToCardFn={(card) => card} onBack={onBack} />
        </Fragment>
    )
}
