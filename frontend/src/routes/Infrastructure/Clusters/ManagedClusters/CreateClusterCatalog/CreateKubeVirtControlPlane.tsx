/* Copyright Contributors to the Open Cluster Management project */
import { ICatalogCard, PageHeader } from '@stolostron/react-data-view'
import { useMemo } from 'react'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { NavigationPath, useBackCancelNavigation } from '../../../../../NavigationPath'
import { breadcrumbs } from './common/common'
import { GetControlPlane } from './common/GetControlPlane'
import GetHostedCard from './common/GetHostedCard'
import { useIsHypershiftEnabled } from '../../../../../hooks/use-hypershift-enabled'

export function CreateKubeVirtControlPlane() {
  const [t] = useTranslation()
  const { nextStep, back, cancel } = useBackCancelNavigation()
  const isHypershiftEnabled = useIsHypershiftEnabled()

  const cards = useMemo(() => {
    const newCards: ICatalogCard[] = [GetHostedCard(nextStep(NavigationPath.createKubeVirtCLI), t, isHypershiftEnabled)]
    return newCards
  }, [nextStep, t, isHypershiftEnabled])

  return (
    <GetControlPlane
      pageHeader={
        <PageHeader
          title={t('Control plane type - {{hcType}}', { hcType: 'OpenShift Virtualization' })}
          description={t('Choose a control plane type for your cluster.')}
          breadcrumbs={breadcrumbs('OpenShift Virtualization', t)}
        />
      }
      cards={cards}
      onBack={back(NavigationPath.createCluster)}
      onCancel={cancel(NavigationPath.clusters)}
    />
  )
}
