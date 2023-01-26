/* Copyright Contributors to the Open Cluster Management project */
import { CheckIcon } from '@patternfly/react-icons'
import {
  CatalogCardItemType,
  getPatternflyColor,
  ICatalogBreadcrumb,
  ICatalogCard,
  ItemView,
  PageHeader,
  PatternFlyColor,
} from '@stolostron/react-data-view'
import { useCallback, useMemo } from 'react'
import { useTranslation } from '../../../lib/acm-i18next'
import { NavigationPath, useBackCancelNavigation } from '../../../NavigationPath'
import { AcmPage, Provider } from '../../../ui-components'
import { getTypedCreateClusterPath } from '../../Infrastructure/Clusters/ManagedClusters/ClusterInfrastructureType'

export function CreateCredentialsAWS() {
  const [t] = useTranslation()
  const { nextStep, back, cancel } = useBackCancelNavigation()
  const cards = useMemo(() => {
    const newCards: ICatalogCard[] = [
      {
        id: 'hosted',
        title: t('Standard'),
        items: [
          {
            type: CatalogCardItemType.Description,
            description: t('TBD'),
          },
          {
            type: CatalogCardItemType.List,
            title: t(''),
            icon: <CheckIcon color={getPatternflyColor(PatternFlyColor.Green)} />,
            items: [],
          },
        ],
        onClick: nextStep(NavigationPath.createAWSCLI),
        badgeList: [],
      },
      {
        id: 'bucket',
        title: t('S3 Bucket'),
        items: [
          {
            type: CatalogCardItemType.Description,
            description: t('TBD'),
          },
        ],
        onClick: nextStep(getTypedCreateClusterPath(Provider.aws)),
      },
    ]
    return newCards
  }, [nextStep, t])

  const keyFn = useCallback((card: ICatalogCard) => card.id, [])

  const breadcrumbs = useMemo(() => {
    const newBreadcrumbs: ICatalogBreadcrumb[] = [
      { label: t('Credentials'), to: NavigationPath.credentials },
      { label: t('Credential type'), to: NavigationPath.addCredentials },
      { label: t('Control plane type - {{hcType}}', { hcType: 'AWS' }) },
    ]
    return newBreadcrumbs
  }, [t])

  return (
    <AcmPage
      header={
        <PageHeader
          title={t('Control plane type - {{hcType}}', { hcType: 'AWS' })}
          description={t('Choose a control plane type for your credential.')}
          breadcrumbs={breadcrumbs}
        />
      }
    >
      <ItemView
        items={cards}
        itemKeyFn={keyFn}
        itemToCardFn={(card) => card}
        onBack={back(NavigationPath.createCluster)}
        onCancel={cancel(NavigationPath.clusters)}
      />
    </AcmPage>
  )
}
