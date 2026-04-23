/* Copyright Contributors to the Open Cluster Management project */

import { ReactNode, useMemo } from 'react'
import { WizardPage } from '~/wizards/WizardPage'
import { useTranslation } from '~/lib/acm-i18next'
import {
  Section,
  Step,
  WizTextInput,
  EditMode,
  WizardCancel,
  WizardSubmit,
  WizSingleSelect,
  WizItemSelector,
  IResource,
  useItem,
} from '@patternfly-labs/react-form-wizard'
import { useValidation } from '~/hooks/useValidation'
import { useRecoilValue, useSharedAtoms } from '~/shared-recoil'
import { IClusterSetBinding } from '~/wizards/common/resources/IClusterSetBinding'
import { IPlacement, PlacementKind, PlacementType } from '~/wizards/common/resources/IPlacement'
import { NavigationPath } from '~/NavigationPath'
import { Placement } from '~/wizards/Placement/Placement'
import { Button } from '@patternfly/react-core'

export interface PlacementWizardProps {
  breadcrumb?: { text: string; to?: string }[]
  title: string
  onSubmit: WizardSubmit
  onCancel: WizardCancel
  yamlEditor?: () => ReactNode
  namespaces: string[]
  clusterSets: IResource[]
  clusterSetBindings: IClusterSetBinding[]
  clusters: IResource[]
  resources?: IResource[]
}

export function PlacementWizard(props: PlacementWizardProps) {
  const { t } = useTranslation()
  const { validatePlacementName } = useValidation()

  let defaultData

  if (props.resources && props.resources.length > 0) {
    defaultData = props.resources
  } else {
    defaultData = [
      {
        ...PlacementType,
        metadata: { name: '', namespace: '' },
        spec: {
          tolerations: [
            {
              key: 'cluster.open-cluster-management.io/unreachable',
              operator: 'Exists',
            },
            {
              key: 'cluster.open-cluster-management.io/unavailable',
              operator: 'Exists',
            },
          ],
          numberOfClusters: 1,
        },
      },
    ]
  }

  const editMode = props.resources && props.resources.length > 0 ? EditMode.Edit : EditMode.Create

  return (
    <WizardPage
      id="placement-wizard"
      title={props.title}
      onSubmit={props.onSubmit}
      onCancel={props.onCancel}
      breadcrumb={props.breadcrumb}
      editMode={editMode}
      yamlEditor={props.yamlEditor}
      defaultData={defaultData}
    >
      <Step label={t('General')} id="general">
        <WizItemSelector selectKey="kind" selectValue={PlacementKind}>
          <Section label={t('General')}>
            <WizTextInput
              label={t('Name')}
              id="name"
              path="metadata.name"
              required
              placeholder={t('Enter the placement name')}
              validation={validatePlacementName}
              readonly={editMode === EditMode.Edit}
            />
            <WizSingleSelect
              label={t('Namespace')}
              id="namespace"
              path="metadata.namespace"
              placeholder={t('Select namespace')}
              options={props.namespaces}
              required
              readonly={editMode === EditMode.Edit}
            />
          </Section>
        </WizItemSelector>
      </Step>
      <Step label={t('Placement')} id="placement">
        <WizItemSelector selectKey="kind" selectValue={PlacementKind}>
          <Section label={t('Placement')}>
            <PlacementStepContent
              clusterSets={props.clusterSets}
              clusterSetBindings={props.clusterSetBindings}
              clusters={props.clusters}
            />
          </Section>
        </WizItemSelector>
      </Step>
    </WizardPage>
  )
}

function PlacementStepContent(props: {
  clusterSets: IResource[]
  clusterSetBindings: IClusterSetBinding[]
  clusters: IResource[]
}) {
  const { t } = useTranslation()
  const { settingsState } = useSharedAtoms()
  const settings = useRecoilValue(settingsState)
  const placement = useItem() as IPlacement
  const namespace = placement?.metadata?.namespace

  const namespaceClusterSetNames = useMemo(() => {
    if (!namespace) return []
    return props.clusterSetBindings
      .filter((csb) => csb.metadata?.namespace === namespace)
      .filter((csb) => props.clusterSets?.find((cs) => cs.metadata?.name === csb.spec?.clusterSet))
      .map((csb) => csb.spec?.clusterSet ?? '')
  }, [namespace, props.clusterSetBindings, props.clusterSets])

  return (
    <Placement
      namespaceClusterSetNames={namespaceClusterSetNames}
      clusters={props.clusters}
      createClusterSetCallback={() => open(NavigationPath.clusterSets, '_blank')}
      alertTitle={t(
        'ClusterSets failed to load. Verify that there is at least one ClusterSet bound to your selected namespace.'
      )}
      hideName
      showPlacementPreview={settings.enhancedPlacement === 'enabled'}
      alertContent={
        <Button variant="link" onClick={() => window.open(NavigationPath.clusterSets)} style={{ padding: '0' }}>
          {t('Add cluster set')}
        </Button>
      }
    />
  )
}
