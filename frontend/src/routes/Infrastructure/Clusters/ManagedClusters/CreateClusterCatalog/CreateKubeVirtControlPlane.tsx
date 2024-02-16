/* Copyright Contributors to the Open Cluster Management project */
import { PageHeader } from '@stolostron/react-data-view'
import { useMemo } from 'react'
import { useIsHypershiftEnabled } from '../../../../../hooks/use-hypershift-enabled'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { NavigationPath, useBackCancelNavigation } from '../../../../../NavigationPath'
import { Provider } from '../../../../../ui-components'
import { getTypedCreateClusterPath } from '../ClusterInfrastructureType'
import { breadcrumbs } from './common/common'
import { GetControlPlane } from './common/GetControlPlane'
import GetHostedCard from './common/GetHostedCard'

export function CreateKubeVirtControlPlane() {
  const [t] = useTranslation()
  const { nextStep, back, cancel } = useBackCancelNavigation()
  const isHypershiftEnabled = useIsHypershiftEnabled()

  const cards = useMemo(
    () => [GetHostedCard(nextStep(getTypedCreateClusterPath(Provider.kubevirt)), t, isHypershiftEnabled)],
    [nextStep, t, isHypershiftEnabled]
  )

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
