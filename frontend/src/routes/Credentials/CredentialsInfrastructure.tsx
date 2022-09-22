/* Copyright Contributors to the Open Cluster Management project */

import { CatalogCardItemType, CatalogColor, ICatalogCard, ItemView, PageHeader } from '@stolostron/react-data-view'
import { Fragment, useCallback, useMemo } from 'react'
import { useHistory } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import { secretsState } from '../../atoms'
import { useTranslation } from '../../lib/acm-i18next'
import { NavigationPath } from '../../NavigationPath'
import { AcmIcon, AcmIconVariant, Provider } from '../../ui-components'

export function CreateInfrastructureCredentials() {
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
                        description: t('A Red Hat OpenShift cluster that is running in your AWS subscription.'),
                    },
                ],
                labels: getCredentialLabels(Provider.aws),
                onClick: () =>
                    history.push({
                        pathname: NavigationPath.createClusterPool,
                        search: '?infrastructureType=AWS',
                    }),
            },
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
                        pathname: NavigationPath.createClusterPool,
                        search: '?infrastructureType=GCP',
                    }),
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
                        pathname: NavigationPath.createClusterPool,
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
                title: t('VMWare VSphere'),
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
                onClick: () =>
                    history.push({
                        pathname: NavigationPath.createCluster,
                        search: '?infrastructureType=hostInventory',
                    }),
            },
            {
                id: 'ansible',
                icon: <AcmIcon icon={AcmIconVariant.ansible} />,
                title: t('Red Hat Ansible Automation Platform'),
                items: [
                    {
                        type: CatalogCardItemType.Description,
                        description: t(
                            'A Red Hat OpenShift cluster that is running on available hosts from your inventory.'
                        ),
                    },
                ],
                labels: getCredentialLabels(Provider.hostinventory),
                onClick: () =>
                    history.push({
                        pathname: NavigationPath.createCluster,
                        search: '?infrastructureType=Ansible',
                    }),
            },
            {
                id: 'redhatcloud',
                icon: <AcmIcon icon={AcmIconVariant.redhat} />,
                title: t('Red Hat Openshift Cluster Manager'),
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
        ]
        return newCards
    }, [getCredentialLabels, history, t])

    const keyFn = useCallback((card: ICatalogCard) => card.id, [])

    const breadcrumbs = useMemo(
        () => [{ label: t('Credentials'), to: NavigationPath.credentials }, { label: t('Infrastructure') }],
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
                onBack={() => history.push(NavigationPath.credentials)}
                onCancel={() => history.push(NavigationPath.credentials)}
            />
        </Fragment>
    )
}
