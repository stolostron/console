/* Copyright Contributors to the Open Cluster Management project */
import { CheckIcon, ExternalLinkAltIcon } from '@patternfly/react-icons'
import {
  CatalogCardItemType,
  getPatternflyColor,
  ICatalogCard,
  PageHeader,
  PatternFlyColor,
} from '@stolostron/react-data-view'
import { useMemo } from 'react'
import { useIsHypershiftEnabled } from '../../../../../hooks/use-hypershift-enabled'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { NavigationPath, useBackCancelNavigation } from '../../../../../NavigationPath'
import { getTypedCreateClusterPath, HostInventoryInfrastructureType } from '../ClusterInfrastructureType'
import { breadcrumbs } from './common/common'
import { GetControlPlane } from './common/GetControlPlane'
import useNoAvailableHostsAlert from '../../../../../hooks/use-available-hosts-alert'
import { DOC_LINKS } from '../../../../../lib/doc-util'

export function CreateControlPlane() {
  const { t } = useTranslation()
  const { nextStep, back, cancel } = useBackCancelNavigation()

  const isHypershiftEnabled = useIsHypershiftEnabled()
  const noAvailableHostsAlert = useNoAvailableHostsAlert('hosted')

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
            title: '',
            icon: <CheckIcon color={getPatternflyColor(PatternFlyColor.Green)} />,
            items: [
              {
                text: t('Reduces costs by efficiently reusing an OpenShift cluster to host multiple control planes.'),
              },
              { text: t('Quickly provisions clusters.') },
            ],
          },
        ],
        onClick:
          isHypershiftEnabled && !noAvailableHostsAlert
            ? nextStep(getTypedCreateClusterPath(HostInventoryInfrastructureType.CIMHypershift))
            : undefined,
        alertTitle: !isHypershiftEnabled
          ? t('Hosted control plane operator must be enabled in order to continue')
          : noAvailableHostsAlert?.title,
        alertContent: !isHypershiftEnabled ? (
          <a href={DOC_LINKS.HOSTED_ENABLE_FEATURE_AWS} target="_blank" rel="noopener noreferrer">
            {t('View documentation')} <ExternalLinkAltIcon />
          </a>
        ) : (
          noAvailableHostsAlert?.content
        ),
        alertVariant: 'info',
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
            title: '',
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
  }, [nextStep, t, isHypershiftEnabled, noAvailableHostsAlert])

  return (
    <GetControlPlane
      pageHeader={
        <PageHeader
          title={t('Control plane type - {{hcType}}', { hcType: 'Host Inventory' })}
          description={t('Choose a control plane type for your self-managed OpenShift cluster.')}
          breadcrumbs={breadcrumbs('Host Inventory', t)}
        />
      }
      cards={cards}
      onBack={back(NavigationPath.createCluster)}
      onCancel={cancel(NavigationPath.clusters)}
    />
  )
}
