/* Copyright Contributors to the Open Cluster Management project */
import { CatalogCardItemType, ICatalogBreadcrumb, ICatalogCard, PageHeader } from '@stolostron/react-data-view'
import { useMemo } from 'react'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { NavigationPath, useBackCancelNavigation } from '../../../../../NavigationPath'
import { getTypedCreateClusterPath, HostInventoryInfrastructureType } from '../ClusterInfrastructureType'
import { GetControlPlane } from './common/GetControlPlane'
import { useLocation } from 'react-router-dom'

export function CreateDiscoverHost() {
  const [t] = useTranslation()
  const { nextStep, back, cancel } = useBackCancelNavigation()
  const { search } = useLocation()

  const isNutanix = search === '?nutanix=true'

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
        onClick: nextStep(
          getTypedCreateClusterPath(
            isNutanix ? HostInventoryInfrastructureType.NutanixCIM : HostInventoryInfrastructureType.CIM
          )
        ),
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
        onClick: nextStep(
          getTypedCreateClusterPath(
            isNutanix ? HostInventoryInfrastructureType.NutanixAI : HostInventoryInfrastructureType.AI
          )
        ),
      },
    ]
    return newCards
  }, [nextStep, t, isNutanix])

  const breadcrumbs: ICatalogBreadcrumb[] = [
    { label: t('Clusters'), to: NavigationPath.clusters },
    { label: t('Infrastructure'), to: NavigationPath.createCluster },
    ...(isNutanix
      ? []
      : [
          {
            label: t('Control plane type - {{hcType}}', { hcType: 'Host Inventory' }),
            to: NavigationPath.createBMControlPlane,
          },
        ]),
    { label: t('Hosts') },
  ]
  return (
    <GetControlPlane
      pageHeader={
        <PageHeader
          title={t('Hosts')}
          description={t('Choose an option based on your hosts.')}
          breadcrumbs={breadcrumbs}
        />
      }
      cards={cards}
      onBack={back(breadcrumbs[breadcrumbs.length - 2].to || '')}
      onCancel={cancel(NavigationPath.clusters)}
    />
  )
}
