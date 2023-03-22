/* Copyright Contributors to the Open Cluster Management project */
import { ICatalogCard, PageHeader } from '@stolostron/react-data-view'
import { useMemo } from 'react'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { NavigationPath, useBackCancelNavigation } from '../../../../../NavigationPath'
import { breadcrumbs } from './common/common'
import { GetControlPlane } from './common/GetControlPlane'
import GetHostedCard from './common/GetHostedCard'

export function CreateKubeVirtControlPlane() {
  const [t] = useTranslation()
  const { nextStep, back, cancel } = useBackCancelNavigation()

  const cards = useMemo(() => {
    const newCards: ICatalogCard[] = [GetHostedCard(nextStep(NavigationPath.createKubeVirtCLI))]
    return newCards
  }, [nextStep])

  return (
    <GetControlPlane
      pageHeader={
        <PageHeader
          title={t('Control plane type - {{hcType}}', { hcType: 'Openshift Virtualization' })}
          description={t('Choose a control plane type for your cluster.')}
          breadcrumbs={breadcrumbs('Openshift Virtualization', t)}
        />
      }
      cards={cards}
      onBack={back(NavigationPath.createCluster)}
      onCancel={cancel(NavigationPath.clusters)}
    />
  )
}
