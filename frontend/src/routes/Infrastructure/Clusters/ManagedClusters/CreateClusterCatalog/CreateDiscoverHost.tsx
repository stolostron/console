/* Copyright Contributors to the Open Cluster Management project */
import { CatalogCardItemType, ICatalogBreadcrumb, ICatalogCard, PageHeader } from '@stolostron/react-data-view'
import { useMemo } from 'react'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { NavigationPath, useBackCancelNavigation } from '../../../../../NavigationPath'
import { getTypedCreateClusterPath, HostInventoryInfrastructureType } from '../ClusterInfrastructureType'
import { GetControlPlane } from './common/GetControlPlane'
import useNoAvailableHostsAlert from '../../../../../hooks/use-available-hosts-alert'

export function CreateDiscoverHost() {
  const [t] = useTranslation()
  const { nextStep, back, cancel } = useBackCancelNavigation()

  const noAvailableHostsAlert = useNoAvailableHostsAlert('standalone')

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
        onClick: !noAvailableHostsAlert
          ? nextStep(getTypedCreateClusterPath(HostInventoryInfrastructureType.CIM))
          : undefined,
        alertTitle: noAvailableHostsAlert?.title,
        alertVariant: 'info',
        alertContent: noAvailableHostsAlert?.content,
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
  }, [nextStep, t, noAvailableHostsAlert])

  const breadcrumbs: ICatalogBreadcrumb[] = [
    { label: t('Clusters'), to: NavigationPath.clusters },
    { label: t('Infrastructure'), to: NavigationPath.createCluster },
    {
      label: t('Control plane type - {{hcType}}', { hcType: 'Host Inventory' }),
      to: NavigationPath.createBMControlPlane,
    },
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
      onBack={back(NavigationPath.createBMControlPlane)}
      onCancel={cancel(NavigationPath.clusters)}
    />
  )
}
