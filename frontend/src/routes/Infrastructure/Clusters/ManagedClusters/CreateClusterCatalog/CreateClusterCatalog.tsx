/* Copyright Contributors to the Open Cluster Management project */
import {
  Catalog,
  CatalogCardItemType,
  CatalogColor,
  DataViewStringContext,
  ICatalogCard,
  ItemView,
} from '@stolostron/react-data-view'
import { useCallback, useMemo, useState } from 'react'
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
import { DOC_LINKS } from '../../../../../lib/doc-util'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { useSharedAtoms, useRecoilState } from '../../../../../shared-recoil'
import { ClusterInfrastructureType, getTypedCreateClusterPath } from '../ClusterInfrastructureType'
import { Divider, ExpandableSection } from '@patternfly/react-core'
import { useDataViewStrings } from '../../../../../lib/dataViewStrings'

type CardProvider = Provider & (ClusterInfrastructureType | Provider.hostinventory)
type CardData = {
  id: string
  provider: CardProvider
  description: string
}

export function CreateClusterCatalog() {
  const [t] = useTranslation()
  const { nextStep, back, cancel } = useBackCancelNavigation()
  const { clusterImageSetsState, secretsState } = useSharedAtoms()
  const [secrets] = useRecoilState(secretsState)
  const [clusterImageSets] = useRecoilState(clusterImageSetsState)
  const [isAdditionalProvidersExpanded, setIsAdditionalProvidersExpanded] = useState(true)

  const onAdditionalProvidersToggle = (isExpanded: boolean) => {
    setIsAdditionalProvidersExpanded(isExpanded)
  }

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

  const cardsData: CardData[] = useMemo(() => {
    return [
      {
        id: 'aws',
        provider: Provider.aws,
        description: t('A Red Hat OpenShift cluster that is running in your AWS subscription.'),
      },
      {
        id: 'google',
        provider: Provider.gcp,
        description: t('A Red Hat OpenShift cluster that is running in your Google Cloud subscription.'),
      },
      {
        id: 'hostinventory',
        provider: Provider.hostinventory,
        description: t(
          'A Red Hat OpenShift cluster that is running on available hosts from your on-premise inventory; bare metal or virtualized.'
        ),
      },
      {
        id: 'kubevirt',
        provider: Provider.kubevirt,
        description: t(
          'A Red Hat OpenShift cluster that can run and manage virtual machines and container workloads side by side.'
        ),
      },
      {
        id: 'azure',
        provider: Provider.azure,
        description: t('A Red Hat OpenShift cluster that is running in your Azure subscription.'),
      },
      {
        id: 'openstack',
        provider: Provider.openstack,
        description: t(
          'A Red Hat OpenShift cluster that is hosted on the Red Hat OpenStack Platform in your on-premise data center.'
        ),
      },
      {
        id: 'rhv',
        provider: Provider.redhatvirtualization,
        description: t(
          'A Red Hat OpenShift cluster that is running in a Red Hat Virtualization environment in your on-premise data center.'
        ),
      },
      {
        id: 'vsphere',
        provider: Provider.vmware,
        description: t(
          'A Red Hat OpenShift cluster that is running in a vSphere environment in your on-premise data center.'
        ),
      },
    ]
  }, [t])

  const getOnClickAction = useCallback(
    (provider: CardProvider) => {
      if (provider === Provider.aws) {
        return nextStep(NavigationPath.createAWSControlPlane)
      } else if (provider === Provider.kubevirt) {
        return nextStep(NavigationPath.createKubeVirtControlPlane)
      } else if (provider === Provider.hostinventory) {
        return clusterImageSets.length ? nextStep(NavigationPath.createBMControlPlane) : undefined
      } else {
        return nextStep(getTypedCreateClusterPath(provider))
      }
    },
    [clusterImageSets, nextStep]
  )

  const cards = useMemo(() => {
    const getProviderCard = (
      id: string,
      provider: CardProvider,
      description: string,
      labels: { label: string; color: CatalogColor }[] | undefined
    ): ICatalogCard => {
      let card: ICatalogCard = {
        id,
        icon: <AcmIcon icon={ProviderIconMap[provider]} />,
        title: ProviderLongTextMap[provider],
        items: [
          {
            type: CatalogCardItemType.Description as const,
            description,
          },
        ],
        labels,
        onClick: getOnClickAction(provider),
      }
      if (provider === Provider.hostinventory) {
        card = {
          ...card,
          title: t('Host inventory'),
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
        }
      }
      return card
    }

    const cardsWithCreds: ICatalogCard[] = []
    const cardsWithOutCreds: ICatalogCard[] = []

    cardsData.forEach((cardData) => {
      const credLabels = getCredentialLabels(cardData.provider)
      const providerCard = getProviderCard(cardData.id, cardData.provider, cardData.description, credLabels)
      if (credLabels) {
        cardsWithCreds.push(providerCard)
      } else {
        cardsWithOutCreds.push(providerCard)
      }
    })

    return { cardsWithCreds, cardsWithOutCreds }
  }, [getCredentialLabels, clusterImageSets.length, t, cardsData, getOnClickAction])

  const keyFn = useCallback((card: ICatalogCard) => card.id, [])

  const breadcrumbs = useMemo(
    () => [{ text: t('Clusters'), to: NavigationPath.clusters }, { text: t('Infrastructure') }],
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
          items={cards.cardsWithCreds.length > 0 ? cards.cardsWithCreds : cards.cardsWithOutCreds}
          itemKeyFn={keyFn}
          itemToCardFn={(card) => card}
          onBack={back(NavigationPath.clusters)}
          onCancel={cancel(NavigationPath.clusters)}
          customCatalogSection={
            cards.cardsWithOutCreds.length > 0 &&
            cards.cardsWithCreds.length > 0 && (
              <>
                <Divider style={{ paddingTop: '24px', paddingBottom: '12px' }} />
                <ExpandableSection
                  style={{ backgroundColor: 'var(--pf-global--BackgroundColor--light-300)' }}
                  isExpanded={isAdditionalProvidersExpanded}
                  onToggle={onAdditionalProvidersToggle}
                  toggleContent={
                    <span style={{ color: 'var(--pf-global--Color--100)' }}>{t('Additional providers')}</span>
                  }
                >
                  <div style={{ color: 'var(--pf-global--Color--100)', paddingBottom: '24px' }}>
                    {t('Add credentials in order to get started with a new infrastructure provider.')}
                  </div>
                  <Catalog
                    keyFn={keyFn}
                    items={cards.cardsWithOutCreds}
                    itemToCardFn={(card) => card}
                    selectItem={() => {}}
                    unselectItem={() => {}}
                    isSelected={() => false}
                    showSelect={false}
                  />
                </ExpandableSection>
              </>
            )
          }
        />
      </DataViewStringContext.Provider>
    </AcmPage>
  )
}
