/* Copyright Contributors to the Open Cluster Management project */
import {
  Catalog,
  CatalogCardItemType,
  CatalogColor,
  ICatalogCard,
  ItemView,
  PageHeader,
} from '@stolostron/react-data-view'
import { useCallback, useMemo } from 'react'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { NavigationPath, useBackCancelNavigation } from '../../../../../NavigationPath'
import {
  AcmIcon,
  AcmIconVariant,
  AcmPage,
  Provider,
  ProviderIconMap,
  ProviderLongTextMap,
} from '../../../../../ui-components'
import { DOC_LINKS } from '../../../../../lib/doc-util'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { useSharedAtoms, useRecoilState } from '../../../../../shared-recoil'
import { ClusterInfrastructureType, getTypedCreateClusterPath } from '../ClusterInfrastructureType'
import { Divider, ExpandableSection } from '@patternfly/react-core'
import { useState } from 'react'

type CardData = {
  id: string
  provider: Provider & ClusterInfrastructureType
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
        provider: Provider.vmware, // placeholder provider
        description: 'Placeholder',
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

  const cards = useMemo(() => {
    const getProviderCard = (
      id: string,
      provider: Provider & ClusterInfrastructureType,
      description: string,
      labels: { label: string; color: CatalogColor }[] | undefined
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
      labels,
      onClick:
        id !== 'aws' ? nextStep(getTypedCreateClusterPath(provider)) : nextStep(NavigationPath.createAWSControlPlane),
    })

    const cardsWithCreds: ICatalogCard[] = []
    const cardsWithOutCreds: ICatalogCard[] = []

    cardsData.forEach((cardData) => {
      const credLabels = getCredentialLabels(
        cardData.id !== 'hostinventory' ? cardData.provider : Provider.hostinventory
      )
      const providerCard =
        cardData.id !== 'hostinventory'
          ? getProviderCard(cardData.id, cardData.provider, cardData.description, credLabels)
          : ({
              id: cardData.id,
              icon: <AcmIcon icon={AcmIconVariant.hybrid} />,
              title: t('Host inventory'),
              items: [
                {
                  type: CatalogCardItemType.Description,
                  description: t(
                    'A Red Hat OpenShift cluster that is running on available hosts from your on-premise inventory; bare metal or virtualized.'
                  ),
                },
              ],
              labels: credLabels,
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
            } as ICatalogCard)

      if (credLabels) {
        cardsWithCreds.push(providerCard)
      } else {
        cardsWithOutCreds.push(providerCard)
      }
    })

    return { cardsWithCreds, cardsWithOutCreds }
  }, [nextStep, getCredentialLabels, clusterImageSets.length, t, cardsData])

  const keyFn = useCallback((card: ICatalogCard) => card.id, [])

  const breadcrumbs = useMemo(
    () => [{ label: t('Clusters'), to: NavigationPath.clusters }, { label: t('Infrastructure') }],
    [t]
  )

  return (
    <AcmPage
      header={
        <PageHeader
          title={t('Infrastructure')}
          description={t('Choose your infrastructure provider.')}
          breadcrumbs={breadcrumbs}
        />
      }
    >
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
                toggleContent={<span style={{ color: 'var(--pf-global--Color--100)' }}>Additional providers</span>}
                isIndented={true}
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
    </AcmPage>
  )
}
