/* Copyright Contributors to the Open Cluster Management project */
import { CatalogCardItemType, CatalogColor, ICatalogCard, ItemView, PageHeader } from '@stolostron/react-data-view'
import { Fragment, useCallback, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { useRecoilState, useSharedAtoms } from '../../../../../shared-recoil'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { NavigationPath, useBackCancelNavigation } from '../../../../../NavigationPath'
import { AcmIcon, AcmIconVariant, Provider } from '../../../../../ui-components'
import { CreateClusterPoolInfrastructureType } from './CreateClusterPool'

export function CreateClusterPoolInfrastructure() {
    const [t] = useTranslation()
    const { search } = useLocation()
    const { nextStep, back, cancel } = useBackCancelNavigation()
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
        const getSearchWithInfrastructureType = (infrastructureType: CreateClusterPoolInfrastructureType) => {
            const urlParams = new URLSearchParams(search)
            urlParams.append('infrastructureType', infrastructureType)
            return urlParams.toString()
        }

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
                onClick: nextStep({
                    pathname: NavigationPath.createClusterPool,
                    search: getSearchWithInfrastructureType(CreateClusterPoolInfrastructureType.AWS),
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
                onClick: nextStep({
                    pathname: NavigationPath.createClusterPool,
                    search: getSearchWithInfrastructureType(CreateClusterPoolInfrastructureType.GCP),
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
                onClick: nextStep({
                    pathname: NavigationPath.createClusterPool,
                    search: getSearchWithInfrastructureType(CreateClusterPoolInfrastructureType.Azure),
                }),
            },
        ]
        return newCards
    }, [nextStep, getCredentialLabels, search, t])

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
                onBack={back(NavigationPath.clusterPools)}
                onCancel={cancel(NavigationPath.clusterPools)}
            />
        </Fragment>
    )
}
