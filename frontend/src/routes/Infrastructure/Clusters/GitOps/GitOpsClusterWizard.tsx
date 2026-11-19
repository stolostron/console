/* Copyright Contributors to the Open Cluster Management project */

import {
  EditMode,
  Section,
  Step,
  useItem,
  WizardCancel,
  WizardSubmit,
  WizItemSelector,
} from '@patternfly-labs/react-form-wizard'
import type { IResource } from '~/resources'
import { Alert, Button } from '@patternfly/react-core'
import { ReactNode, useMemo } from 'react'
import { useLocalHubName } from '~/hooks/use-local-hub'
import { useTranslation } from '~/lib/acm-i18next'
import { NavigationPath } from '~/NavigationPath'
import type { ManagedClusterSetBinding } from '~/resources/managed-cluster-set-binding'
import { PlacementKind } from '~/resources/placement'
import type { Policy } from '~/resources/policy'
import type { SubscriptionOperator } from '~/resources/subscription-operator'
import { IClusterSetBinding } from '~/wizards/common/resources/IClusterSetBinding'
import { IPlacement } from '~/wizards/common/resources/IPlacement'
import { Placement as PlacementFields } from '~/wizards/Placement/Placement'
import { WizardPage } from '~/wizards/WizardPage'
import { buildGitOpsClusterResources } from '~/routes/Infrastructure/Clusters/GitOps/gitOpsClusterResources'
import { GitOpsClusterDetailsStep } from '~/routes/Infrastructure/Clusters/GitOps/GitOpsClusterDetailsStep'

export interface GitOpsClusterWizardProps {
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
  argoCDs: IResource[]
  subscriptions: SubscriptionOperator[]
  policies: Policy[]
  existingBindings?: ManagedClusterSetBinding[]
  existingAppProject?: IResource
  loadExistingAppProject?: () => Promise<IResource | undefined>
  isModal?: boolean
}

export function GitOpsClusterWizard(props: Readonly<GitOpsClusterWizardProps>) {
  const { t } = useTranslation()
  const editMode = props.resources && props.resources.length > 0 ? EditMode.Edit : EditMode.Create

  const defaultData = useMemo(() => {
    if (props.resources && props.resources.length > 0) {
      return props.resources
    }
    return buildGitOpsClusterResources(
      {
        name: '',
        namespace: props.namespaces[0] ?? '',
        agentEnabled: false,
        pushModelEnabled: false,
        existingBindings: props.existingBindings,
        existingArgoCD: props.argoCDs[0],
        existingSubscription: props.subscriptions[0],
        includeBindings: false,
      },
      t
    )
  }, [props.resources, props.namespaces, props.existingBindings, props.argoCDs, props.subscriptions, t])

  return (
    <WizardPage
      id="gitopscluster-wizard"
      isModal={props.isModal}
      title={props.title}
      onSubmit={props.onSubmit}
      onCancel={props.onCancel}
      breadcrumb={props.breadcrumb}
      editMode={editMode}
      yamlEditor={props.yamlEditor}
      defaultData={defaultData}
    >
      <Step label={t('Details')} id="details">
        <GitOpsClusterDetailsStep
          namespaces={props.namespaces}
          editMode={editMode}
          argoCDs={props.argoCDs}
          subscriptions={props.subscriptions}
          policies={props.policies}
          existingBindings={props.existingBindings}
          existingAppProject={props.existingAppProject}
          loadExistingAppProject={props.loadExistingAppProject}
        />
      </Step>
      <Step label={t('Target clusters')} id="target-clusters">
        <WizItemSelector selectKey="kind" selectValue={PlacementKind}>
          <Section label={t('Target clusters')}>
            <LocalClusterPlacementAlert />
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

function LocalClusterPlacementAlert() {
  const { t } = useTranslation()
  const localHubName = useLocalHubName()
  return (
    <Alert
      isInline
      variant="info"
      title={t('The hub cluster cannot be included in this Placement.')}
      style={{ marginBottom: 'var(--pf-t--global--spacer--md)' }}
    >
      {t(
        'GitOpsCluster Placement resources must exclude the local-cluster (hub) labeled cluster. The default predicate excludes the local-cluster label. Do not select {{hub}}.',
        { hub: localHubName }
      )}
    </Alert>
  )
}

function PlacementStepContent(
  props: Readonly<{
    clusterSets: IResource[]
    clusterSetBindings: IClusterSetBinding[]
    clusters: IResource[]
  }>
) {
  const { t } = useTranslation()
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
    <PlacementFields
      namespaceClusterSetNames={namespaceClusterSetNames}
      clusters={props.clusters}
      createClusterSetCallback={() => open(NavigationPath.clusterSets, '_blank')}
      alertTitle={t(
        'ClusterSets failed to load. Verify that there is at least one ClusterSet bound to your selected namespace.'
      )}
      hideName
      showPlacementPreview
      alertContent={
        <Button variant="link" onClick={() => window.open(NavigationPath.clusterSets)} style={{ padding: '0' }}>
          {t('Add cluster set')}
        </Button>
      }
    />
  )
}
