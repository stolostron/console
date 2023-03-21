/* Copyright Contributors to the Open Cluster Management project */
import { ExpandableSection } from '@patternfly/react-core'
import { CheckIcon, ExternalLinkAltIcon } from '@patternfly/react-icons'
import {
  CatalogCardItemType,
  DataViewStringContext,
  getPatternflyColor,
  ICatalogBreadcrumb,
  ICatalogCard,
  ItemView,
  PageHeader,
  PatternFlyColor,
} from '@stolostron/react-data-view'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { useDataViewStrings } from '../../../../../lib/dataViewStrings'
import { DOC_LINKS } from '../../../../../lib/doc-util'
import { NavigationPath, useBackCancelNavigation } from '../../../../../NavigationPath'
import { AcmButton, AcmPage, Provider } from '../../../../../ui-components'
import { getTypedCreateClusterPath } from '../ClusterInfrastructureType'
import { getHostedCard } from './common'
import HypershiftDiagram from './HypershiftDiagram.svg'

export function CreateAWSControlPlane() {
  const [t] = useTranslation()
  const { nextStep, back, cancel } = useBackCancelNavigation()
  const [isDiagramExpanded, setIsDiagramExpanded] = useState(true)
  const [isMouseOverControlPlaneLink, setIsMouseOverControlPlaneLink] = useState(false)

  const onDiagramToggle = (isExpanded: boolean) => {
    if (!isMouseOverControlPlaneLink) {
      setIsDiagramExpanded(isExpanded)
    }
  }
  const cards = useMemo(() => {
    const newCards: ICatalogCard[] = [
      getHostedCard(nextStep(NavigationPath.createAWSCLI)),
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
            icon: <CheckIcon color={getPatternflyColor(PatternFlyColor.Green)} />,
            items: [
              {
                text: t('Increases resiliency with closely interconnected control plane and worker nodes.'),
              },
            ],
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
      { label: t('Clusters'), to: NavigationPath.clusters },
      { label: t('Infrastructure'), to: NavigationPath.createCluster },
      { label: t('Control plane type - {{hcType}}', { hcType: 'AWS' }) },
    ]
    return newBreadcrumbs
  }, [t])

  const dataViewStrings = useDataViewStrings()

  return (
    <AcmPage
      header={
        <PageHeader
          title={t('Control plane type - {{hcType}}', { hcType: 'AWS' })}
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
          customCatalogSection={
            <ExpandableSection
              style={{ paddingTop: '24px', backgroundColor: 'var(--pf-global--BackgroundColor--light-300)' }}
              isExpanded={isDiagramExpanded}
              onToggle={onDiagramToggle}
              toggleContent={
                <>
                  <span style={{ color: 'var(--pf-global--Color--100)' }}>{t('Compare control plane types')} </span>
                  <AcmButton
                    variant="link"
                    icon={<ExternalLinkAltIcon style={{ fontSize: '14px' }} />}
                    iconPosition="right"
                    isInline
                    onClick={() => window.open(DOC_LINKS.HYPERSHIFT_INTRO, '_blank')}
                    onMouseEnter={() => setIsMouseOverControlPlaneLink(true)}
                    onMouseLeave={() => setIsMouseOverControlPlaneLink(false)}
                  >
                    {t('Learn more about control plane types')}
                  </AcmButton>
                </>
              }
              isIndented={true}
            >
              <HypershiftDiagram />
            </ExpandableSection>
          }
        />
      </DataViewStringContext.Provider>
    </AcmPage>
  )
}
