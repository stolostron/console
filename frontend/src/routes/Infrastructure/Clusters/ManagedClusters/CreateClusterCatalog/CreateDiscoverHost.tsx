/* Copyright Contributors to the Open Cluster Management project */
import {
  CatalogCardItemType,
  ItemView,
  ICatalogCard,
  PageHeader,
  DataViewStringContext,
  defaultStrings,
} from '@stolostron/react-data-view'
import { useCallback, useMemo } from 'react'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { useDataViewStrings } from '../../../../../lib/dataViewStrings'
import { NavigationPath, useBackCancelNavigation } from '../../../../../NavigationPath'
import { AcmPage } from '../../../../../ui-components'
import { getTypedCreateClusterPath, HostInventoryInfrastructureType } from '../ClusterInfrastructureType'

export function CreateDiscoverHost() {
  const [t] = useTranslation()
  const { nextStep, back, cancel } = useBackCancelNavigation()

  const cards = useMemo(() => {
    const newCards: ICatalogCard[] = [
      {
        id: 'existinghost',
        title: t('Use existing hosts'),
        items: [
          {
            type: CatalogCardItemType.Description,
            description: t(
              'Create a cluster from hosts that have been discovered and made available in your host inventory.'
            ),
          },
        ],
        onClick: nextStep(getTypedCreateClusterPath(HostInventoryInfrastructureType.CIM)),
      },
      {
        id: 'discover',
        title: t('Discover new hosts'),
        items: [
          {
            type: CatalogCardItemType.Description,
            description: t('Discover new hosts while creating the cluster without an existing host inventory.'),
          },
        ],
        onClick: nextStep(getTypedCreateClusterPath(HostInventoryInfrastructureType.AI)),
      },
    ]
    return newCards
  }, [nextStep, t])

  const keyFn = useCallback((card: ICatalogCard) => card.id, [])

  const breadcrumbs = [
    { label: t('Clusters'), to: NavigationPath.clusters },
    { label: t('Infrastructure'), to: NavigationPath.createCluster },
    {
      label: t('Control plane type - {{hcType}}', { hcType: 'Host Inventory' }),
      to: NavigationPath.createBMControlPlane,
    },
    { label: t('Hosts') },
  ]

  const dataViewStrings = useDataViewStrings()

  return (
    <AcmPage
      header={
        <PageHeader
          title={t('Hosts')}
          description={t('Choose an option based on your hosts.')}
          breadcrumbs={breadcrumbs}
        />
      }
    >
      <DataViewStringContext.Provider value={dataViewStrings || defaultStrings}>
        <ItemView
          items={cards}
          itemKeyFn={keyFn}
          itemToCardFn={(card) => card}
          onBack={back(NavigationPath.createBMControlPlane)}
          onCancel={cancel(NavigationPath.clusters)}
        />
      </DataViewStringContext.Provider>
    </AcmPage>
  )
}
