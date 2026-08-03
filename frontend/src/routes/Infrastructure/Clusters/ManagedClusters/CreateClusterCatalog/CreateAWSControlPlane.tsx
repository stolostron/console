/* Copyright Contributors to the Open Cluster Management project */
import { CheckIcon } from '@patternfly/react-icons'
import {
  CatalogCardItemType,
  CatalogColor,
  DataViewStringContext,
  ICatalogCard,
  ICatalogCardDescription,
  ItemView,
} from '@stolostron/react-data-view'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { useDataViewStrings } from '../../../../../lib/dataViewStrings'
import { DOC_LINKS, ViewDocumentationLink } from '../../../../../lib/doc-util'
import { NavigationPath, useBackCancelNavigation } from '../../../../../NavigationPath'
import { AcmPage, AcmPageHeader, Provider } from '../../../../../ui-components'
import { getTypedCreateClusterPath } from '../ClusterInfrastructureType'
import { useIsHypershiftEnabled } from '../../../../../hooks/use-hypershift-enabled'
import { HypershiftDiagramExpand } from './common/HypershiftDiagramExpand'
import { Icon } from '@patternfly/react-core'
import { useCheckClusterAPI } from '../components/rosahcp/hooks/useCheckClusterAPI'
import { HostedCard } from '../components/rosahcp/HostedCard/HostedCard'
import { RosaHCPModal } from '../components/rosahcp/RosaHCPModal/RosaHCPModal'
import { Secret } from '~/resources'
import React from 'react'
import { useRecoilValue, useSharedAtoms } from '~/shared-recoil'

export function CreateAWSControlPlane() {
  const [t] = useTranslation()
  const { nextStep, back, cancel } = useBackCancelNavigation()
  const [isDiagramExpanded, setIsDiagramExpanded] = useState(true)
  const [isMouseOverControlPlaneLink, setIsMouseOverControlPlaneLink] = useState(false)
  const [isHypershiftEnabled, loaded] = useIsHypershiftEnabled()

  const [modalIsOpen, setModalIsOpen] = useState(false)

  const withCliClick = nextStep(NavigationPath.createAWSCLI)

  const { isCapaEnabled, isCapiEnabled } = useCheckClusterAPI()
  const { settingsState } = useSharedAtoms()
  const settings = useRecoilValue(settingsState)
  const rosaHcpWizardFeatureFlag = settings.rosaHcpWizard === 'enabled'

  const areCapiCapaEnabled = isCapaEnabled && isCapiEnabled
  const [selectedSecret, setSelectedSecret] = React.useState<Secret[] | undefined>(undefined)

  const onDiagramToggle = (isExpanded: boolean) => {
    if (!isMouseOverControlPlaneLink) {
      setIsDiagramExpanded(isExpanded)
    }
  }

  const close = () => {
    setSelectedSecret(undefined)
    setModalIsOpen(false)
  }

  const rosaHcpCard = useMemo(() => {
    return rosaHcpWizardFeatureFlag
      ? {
          type: CatalogCardItemType.Description,
          description: (
            <HostedCard
              isHypershiftEnabled={isHypershiftEnabled}
              areCapiCapaEnabled={areCapiCapaEnabled}
              withCliClick={isHypershiftEnabled ? withCliClick : undefined}
              setIsModalOpen={setModalIsOpen}
            />
          ) as unknown as string,
        }
      : null
  }, [areCapiCapaEnabled, isHypershiftEnabled, withCliClick, rosaHcpWizardFeatureFlag])

  const cards = useMemo(() => {
    const newCards: ICatalogCard[] = [
      {
        id: 'hosted',
        title: t('Hosted'),
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
            icon: (
              <Icon status="success">
                <CheckIcon />
              </Icon>
            ),
            items: [
              {
                text: t('Reduces costs by efficiently reusing an OpenShift cluster to host multiple control planes.'),
              },
              { text: t('Quickly provisions clusters.') },
            ],
          },
          ...(rosaHcpCard ? [rosaHcpCard as unknown as ICatalogCardDescription] : []),
        ],
        onClick: rosaHcpWizardFeatureFlag
          ? () => {}
          : isHypershiftEnabled && loaded
            ? nextStep(NavigationPath.createAWSCLI)
            : undefined,
        alertTitle: (() => {
          if (rosaHcpWizardFeatureFlag && loaded && !isHypershiftEnabled && !areCapiCapaEnabled) {
            return t(
              'You must enable either Cluster API and Cluster API for AWS or Hosted control planes in order to continue'
            )
          }
          if (!rosaHcpWizardFeatureFlag && loaded && !isHypershiftEnabled) {
            return t('Hosted control plane operator must be enabled in order to continue')
          }
          return undefined
        })(),
        alertVariant: 'info',
        alertContent: (() => {
          if (!rosaHcpWizardFeatureFlag && loaded && !isHypershiftEnabled)
            return <ViewDocumentationLink doclink={DOC_LINKS.HOSTED_ENABLE_FEATURE_AWS} topPadding={false} />
          return undefined
        })(),
        badgeList: !rosaHcpWizardFeatureFlag
          ? [
              {
                badge: t('CLI-based'),
                badgeColor: CatalogColor.purple,
              },
            ]
          : undefined,
      },
      {
        id: 'standalone',
        title: t('Standalone'),
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
            icon: (
              <Icon status="success">
                <CheckIcon />
              </Icon>
            ),
            items: [
              {
                text: t('Increases resiliency with closely interconnected control plane and worker nodes.'),
              },
              {
                text: t('Provide customized control plane cluster configuration.'),
                subTitles: [t('Standard'), t('Single node OpenShift'), t('Three-node cluster')],
              },
            ],
          },
        ],
        onClick: nextStep(getTypedCreateClusterPath(Provider.aws)),
      },
    ]
    return newCards
  }, [nextStep, t, isHypershiftEnabled, loaded, areCapiCapaEnabled, rosaHcpCard, rosaHcpWizardFeatureFlag])

  const keyFn = useCallback((card: ICatalogCard) => card.id, [])

  const breadcrumbs = useMemo(() => {
    const newBreadcrumbs = [
      { text: t('Clusters'), to: NavigationPath.clusters },
      { text: t('Infrastructure'), to: NavigationPath.createCluster },
      { text: t('Control plane type - {{hcType}}', { hcType: 'AWS' }) },
    ]
    return newBreadcrumbs
  }, [t])

  const dataViewStrings = useDataViewStrings()

  return (
    <AcmPage
      header={
        <AcmPageHeader
          title={t('Control plane type - {{hcType}}', { hcType: 'AWS' })}
          description={t('Choose a control plane type for your cluster.')}
          breadcrumb={breadcrumbs}
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
          customCatalogSection={
            <HypershiftDiagramExpand
              isDiagramExpanded={isDiagramExpanded}
              onDiagramToggle={onDiagramToggle}
              setIsMouseOverControlPlaneLink={setIsMouseOverControlPlaneLink}
              t={t}
            />
          }
        />
      </DataViewStringContext.Provider>
      <RosaHCPModal
        isModalOpen={modalIsOpen}
        close={close}
        selectedSecret={selectedSecret}
        setSelectedSecret={setSelectedSecret}
      />
    </AcmPage>
  )
}
