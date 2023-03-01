/* Copyright Contributors to the Open Cluster Management project */
import { CheckIcon, ExternalLinkAltIcon } from '@patternfly/react-icons'
import {
  CatalogCardItemType,
  getPatternflyColor,
  ICatalogBreadcrumb,
  ICatalogCard,
  ItemView,
  PageHeader,
  PatternFlyColor,
} from '@stolostron/react-data-view'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { DOC_LINKS } from '../../../../../lib/doc-util'
import { NavigationPath, useBackCancelNavigation } from '../../../../../NavigationPath'
import { listMultiClusterEngines } from '../../../../../resources'
import { AcmPage } from '../../../../../ui-components'
import { getTypedCreateClusterPath, HostInventoryInfrastructureType } from '../ClusterInfrastructureType'

export function CreateControlPlane() {
  const [t] = useTranslation()
  const { nextStep, back, cancel } = useBackCancelNavigation()

  const [isHypershiftEnabled, setIsHypershiftEnabled] = useState<boolean>(false)
  useEffect(() => {
    const getHypershiftStatus = async () => {
      try {
        const [multiClusterEngine] = await listMultiClusterEngines().promise
        const components = multiClusterEngine.spec?.overrides.components
        const hypershiftLocalHosting = components?.find((component) => component.name === 'hypershift-local-hosting')
        const hypershiftPreview = components?.find((component) => component.name === 'hypershift-preview')
        setIsHypershiftEnabled((hypershiftLocalHosting?.enabled && hypershiftPreview?.enabled) as boolean)
      } catch {
        // nothing to do
      }
    }
    getHypershiftStatus()
  }, [])

  const cards = useMemo(() => {
    const newCards: ICatalogCard[] = [
      {
        id: 'hosted',
        title: t('Hosted control plane'),
        items: [
          {
            type: CatalogCardItemType.Description,
            description: t(
              'Run an OpenShift cluster where the control plane is decoupled from the data plane, and is treated like a multi-tenant workload on a hosting service cluster. The data plane is on a separate network domain that allows segmentation between management and workload traffic.'
            ),
          },
          {
            type: CatalogCardItemType.List,
            title: t(''),
            icon: <CheckIcon color={getPatternflyColor(PatternFlyColor.Green)} />,
            items: [
              {
                text: t('Reduces costs by efficiently reusing an OpenShift cluster to host multiple control planes.'),
              },
              { text: t('Quickly provisions clusters.') },
            ],
          },
        ],
        onClick: isHypershiftEnabled
          ? nextStep(getTypedCreateClusterPath(HostInventoryInfrastructureType.CIMHypershift))
          : undefined,
        alertTitle: isHypershiftEnabled
          ? undefined
          : t('Hosted control plane operator must be enabled in order to continue'),
        alertVariant: 'info',
        alertContent: (
          <a href={DOC_LINKS.HYPERSHIFT_INTRO} target="_blank" rel="noopener noreferrer">
            {t('View documentation')} <ExternalLinkAltIcon />
          </a>
        ),
      },
      {
        id: 'standalone',
        title: t('Standalone control plane'),
        items: [
          {
            type: CatalogCardItemType.Description,
            description: t(
              'Run an OpenShift cluster where the control plane and data plane are coupled. The control plane is hosted by a dedicated group of physical or virtual nodes and the network stack is shared.'
            ),
          },
          {
            type: CatalogCardItemType.List,
            title: t(''),
            icon: <CheckIcon color={getPatternflyColor(PatternFlyColor.Green)} />,
            items: [
              {
                text: t('Increased resiliency with closely interconnected control plane and worker nodes.'),
              },
              {
                text: t('Provide customized control plane cluster configuration.'),
                subTitles: [t('Standard'), t('Single node OpenShift'), t('Three-node cluster')],
              },
            ],
          },
        ],
        onClick: nextStep(NavigationPath.createDiscoverHost),
      },
    ]
    return newCards
  }, [nextStep, t, isHypershiftEnabled])

  const keyFn = useCallback((card: ICatalogCard) => card.id, [])

  const breadcrumbs = useMemo(() => {
    const newBreadcrumbs: ICatalogBreadcrumb[] = [
      { label: t('Clusters'), to: NavigationPath.clusters },
      { label: t('Infrastructure'), to: NavigationPath.createCluster },
      { label: t('Control plane type - {{hcType}}', { hcType: 'Host Inventory' }) },
    ]
    return newBreadcrumbs
  }, [t])

  return (
    <AcmPage
      header={
        <PageHeader
          title={t('Control plane type - {{hcType}}', { hcType: 'Host Inventory' })}
          description={t('Choose a control plane type for your self-managed OpenShift cluster.')}
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
