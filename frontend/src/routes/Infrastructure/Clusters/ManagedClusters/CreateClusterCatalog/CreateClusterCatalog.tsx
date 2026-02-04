/* Copyright Contributors to the Open Cluster Management project */
import { ClusterImageSetK8sResource, isValidImageSet } from '@openshift-assisted/ui-lib/cim'
import { Divider, ExpandableSection, Stack, StackItem } from '@patternfly/react-core'
import {
  Catalog,
  CatalogCardItemType,
  CatalogColor,
  DataViewStringContext,
  ICatalogCard,
  ItemView,
} from '@stolostron/react-data-view'
import { TFunction } from 'i18next'
import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { useDataViewStrings } from '../../../../../lib/dataViewStrings'
import { DOC_LINKS, ViewDocumentationLink } from '../../../../../lib/doc-util'
import { NavigationPath, useBackCancelNavigation } from '../../../../../NavigationPath'
import { ClusterImageSet } from '../../../../../resources'
import { useRecoilValue, useSharedAtoms } from '../../../../../shared-recoil'
import {
  AcmIcon,
  AcmPage,
  AcmPageHeader,
  Provider,
  ProviderIconMap,
  ProviderLongTextMap,
} from '../../../../../ui-components'
import { ClusterInfrastructureType, getTypedCreateClusterPath } from '../ClusterInfrastructureType'

const hasClusterImageSetWithArch = (clusterImageSets: ClusterImageSet[], architectures: string[]) =>
  clusterImageSets.filter((cis) => isValidImageSet(cis as ClusterImageSetK8sResource, architectures))

const clusterImageSetsRequired = (
  clusterImageSets: ClusterImageSet[],
  t: TFunction,
  children?: React.ReactNode
): {
  alertTitle: ICatalogCard['alertTitle']
  alertVariant: ICatalogCard['alertVariant']
  alertContent: ICatalogCard['alertContent']
} => ({
  alertTitle: clusterImageSets.length ? undefined : t('OpenShift release images unavailable'),
  alertVariant: 'info',
  alertContent: (
    <Stack hasGutter>
      <StackItem>
        <>
          {t(
            'No release image is available. Follow cluster creation prerequisite documentation to learn how to add release images.'
          )}
        </>
        <ViewDocumentationLink doclink={DOC_LINKS.CREATE_CLUSTER_PREREQ} />
      </StackItem>
      {children && <StackItem>{children}</StackItem>}
    </Stack>
  ),
})

type CardProvider = Provider & (ClusterInfrastructureType | Provider.hostinventory | Provider.nutanix)
type CardData = {
  id: string
  provider: CardProvider
  description: string
}

export function CreateClusterCatalog() {
  const [t] = useTranslation()
  const { nextStep, back, cancel } = useBackCancelNavigation()
  const { clusterImageSetsState, secretsState } = useSharedAtoms()
  const secrets = useRecoilValue(secretsState)
  const clusterImageSets = useRecoilValue(clusterImageSetsState)
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
          'A Red Hat OpenShift cluster with its worker nodes running on OpenShift Virtualization virtual machines.'
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
        id: 'vsphere',
        provider: Provider.vmware,
        description: t(
          'A Red Hat OpenShift cluster that is running in a vSphere environment in your on-premise data center.'
        ),
      },
      {
        id: 'nutanix',
        provider: Provider.nutanix,
        description: t('A Red Hat OpenShift cluster that is running in a Nutanix environment.'),
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
      } else if (provider === Provider.nutanix) {
        return hasClusterImageSetWithArch(clusterImageSets, ['x86_64', 'x86-64']).length
          ? nextStep({
              pathname: NavigationPath.createDiscoverHost,
              search: 'nutanix=true',
            })
          : undefined
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

      switch (provider) {
        case Provider.hostinventory:
          card = {
            ...card,
            title: t('Host inventory'),
            ...clusterImageSetsRequired(clusterImageSets, t),
          }
          break
        case Provider.nutanix:
          card = {
            ...card,
            ...clusterImageSetsRequired(
              hasClusterImageSetWithArch(clusterImageSets, ['x86_64', 'x86-64']),
              t,
              <>{t('Nutanix requires x86_64 release image. No other architecture is supported.')}</>
            ),
          }
          break
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
  }, [getCredentialLabels, clusterImageSets, t, cardsData, getOnClickAction])

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
                  isExpanded={isAdditionalProvidersExpanded}
                  onToggle={(_event, isExpanded: boolean) => onAdditionalProvidersToggle(isExpanded)}
                  toggleContent={
                    <span
                      style={{
                        color: 'var(--pf-t--global--text--color--regular)',
                      }}
                    >
                      {t('Additional providers')}
                    </span>
                  }
                >
                  <div
                    style={{
                      color: 'var(--pf-t--global--text--color--regular)',
                      paddingBottom: '24px',
                    }}
                  >
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
