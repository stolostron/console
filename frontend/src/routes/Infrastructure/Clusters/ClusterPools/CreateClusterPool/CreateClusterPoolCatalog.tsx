/* Copyright Contributors to the Open Cluster Management project */
import {
  CatalogCardItemType,
  CatalogColor,
  DataViewStringContext,
  ICatalogCard,
  ItemView,
} from '@stolostron/react-data-view'
import { useCallback, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { useRecoilState, useSharedAtoms } from '../../../../../shared-recoil'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { NavigationPath, useBackCancelNavigation } from '../../../../../NavigationPath'
import {
  AcmIcon,
  AcmPage,
  AcmPageHeader,
  Provider,
  ProviderIconMap,
  ProviderLongTextMap,
} from '../../../../../ui-components'
import { ClusterPoolInfrastructureType, CLUSTER_POOL_INFRA_TYPE_PARAM } from '../ClusterPoolInfrastructureType'
import { useDataViewStrings } from '../../../../../lib/dataViewStrings'

export function CreateClusterPoolCatalog() {
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
    const getTypedCreateClusterPoolPath = (infrastructureType: ClusterPoolInfrastructureType) => {
      const urlParams = new URLSearchParams(search)
      urlParams.append(CLUSTER_POOL_INFRA_TYPE_PARAM, infrastructureType)
      return {
        pathname: NavigationPath.createClusterPool,
        search: urlParams.toString(),
      }
    }

    const getProviderCard = (
      id: string,
      provider: Provider & ClusterPoolInfrastructureType,
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
      onClick: nextStep(getTypedCreateClusterPoolPath(provider)),
    })

    const newCards: ICatalogCard[] = [
      getProviderCard(
        'aws',
        Provider.aws,
        t('A Red Hat OpenShift clusterpool that is running in your AWS subscription.')
      ),
      getProviderCard(
        'google',
        Provider.gcp,
        t('A Red Hat OpenShift clusterpool that is running in your Google Cloud subscription.')
      ),
      getProviderCard(
        'azure',
        Provider.azure,
        t('A Red Hat OpenShift clusterpool that is running in your Azure subscription.')
      ),
    ]
    return newCards
  }, [nextStep, getCredentialLabels, search, t])

  const keyFn = useCallback((card: ICatalogCard) => card.id, [])

  const breadcrumbs = useMemo(
    () => [{ text: t('Cluster pools'), to: NavigationPath.clusterPools }, { text: t('Infrastructure') }],
    [t]
  )

  const dataViewStrings = useDataViewStrings()

  return (
    <AcmPage
      header={
        <AcmPageHeader
          title={t('Infrastructure')}
          description={t('Choose your infrastructure provider.')}
          breadcrumb={breadcrumbs}
        />
      }
    >
      <DataViewStringContext.Provider value={dataViewStrings}>
        <ItemView
          items={cards}
          itemKeyFn={keyFn}
          itemToCardFn={(card) => card}
          onBack={back(NavigationPath.clusterPools)}
          onCancel={cancel(NavigationPath.clusterPools)}
        />
      </DataViewStringContext.Provider>
    </AcmPage>
  )
}
