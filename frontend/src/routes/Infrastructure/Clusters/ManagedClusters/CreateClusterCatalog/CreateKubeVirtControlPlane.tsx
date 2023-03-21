/* Copyright Contributors to the Open Cluster Management project */
import {
  DataViewStringContext,
  ICatalogBreadcrumb,
  ICatalogCard,
  ItemView,
  PageHeader,
} from '@stolostron/react-data-view'
import { useCallback, useMemo } from 'react'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { useDataViewStrings } from '../../../../../lib/dataViewStrings'
import { NavigationPath, useBackCancelNavigation } from '../../../../../NavigationPath'
import { AcmPage } from '../../../../../ui-components'
import GetHostedCard from './common'

export function CreateKubeVirtControlPlane() {
  const [t] = useTranslation()
  const { nextStep, back, cancel } = useBackCancelNavigation()

  const cards = useMemo(() => {
    const newCards: ICatalogCard[] = [GetHostedCard(nextStep(NavigationPath.createKubeVirtCLI))]
    return newCards
  }, [nextStep])

  const keyFn = useCallback((card: ICatalogCard) => card.id, [])

  const breadcrumbs = useMemo(() => {
    const newBreadcrumbs: ICatalogBreadcrumb[] = [
      { label: t('Clusters'), to: NavigationPath.clusters },
      { label: t('Infrastructure'), to: NavigationPath.createCluster },
      { label: t('Control plane type - {{hcType}}', { hcType: 'Openshift Virtualization' }) },
    ]
    return newBreadcrumbs
  }, [t])

  const dataViewStrings = useDataViewStrings()

  return (
    <AcmPage
      header={
        <PageHeader
          title={t('Control plane type - {{hcType}}', { hcType: 'Openshift Virtualization' })}
          description={t('Choose a control plane type for your cluster.')}
          breadcrumbs={breadcrumbs}
        />
      }
    >
      <DataViewStringContext.Provider value={dataViewStrings}>
        <ItemView
          items={cards}
          itemKeyFn={keyFn}
          itemToCardFn={(card) => card}
          onBack={back(NavigationPath.createCluster)}
          onCancel={cancel(NavigationPath.clusters)}
        />
      </DataViewStringContext.Provider>
    </AcmPage>
  )
}
