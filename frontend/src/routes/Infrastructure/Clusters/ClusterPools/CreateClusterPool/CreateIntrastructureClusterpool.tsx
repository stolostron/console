/* Copyright Contributors to the Open Cluster Management project */
import { CatalogCardItemType, CatalogColor, ICatalogCard, ItemView, PageHeader } from '@stolostron/react-data-view'
import { Fragment, useCallback, useMemo } from 'react'
import { useHistory } from 'react-router-dom'
import { useRecoilState, useSharedAtoms } from '../../../../../shared-recoil'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { NavigationPath } from '../../../../../NavigationPath'
import { AcmIcon, AcmIconVariant, Provider } from '../../../../../ui-components'

export function CreateInfrastructureClusterpool() {
    const [t] = useTranslation()
    const history = useHistory()
    const { secretsState } = useSharedAtoms()
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
                        description: t('A Red Hat OpenShift clusterpool that is running in your AWS subscription.'),
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
                            'A Red Hat OpenShift clusterpool that is running in your Google Cloud subscription.'
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
                        description: t('A Red Hat OpenShift clusterpool that is running in your Azure subscription.'),
                    },
                ],
                labels: getCredentialLabels(Provider.azure),
                onClick: () =>
                    history.push({
                        pathname: NavigationPath.createClusterPool,
                        search: '?infrastructureType=Azure',
                    }),
            },
        ]
        return newCards
    }, [getCredentialLabels, history, t])

    const keyFn = useCallback((card: ICatalogCard) => card.id, [])

    const breadcrumbs = useMemo(
        () => [{ label: t('Cluster pools'), to: NavigationPath.clusterPools }, { label: t('Infrastructure') }],
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
                onBack={() => history.push(NavigationPath.clusterPools)}
                onCancel={() => history.push(NavigationPath.clusterPools)}
            />
        </Fragment>
    )
}
