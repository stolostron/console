/* Copyright Contributors to the Open Cluster Management project */

import {
  EditMode,
  Section,
  Step,
  useData,
  useItem,
  WizardCancel,
  WizardSubmit,
  WizCheckbox,
  WizHidden,
  WizItemSelector,
  WizSingleSelect,
  WizTextInput,
} from '@patternfly-labs/react-form-wizard'
import type { IResource } from '~/resources'
import { Alert, Button, List, ListItem } from '@patternfly/react-core'
import { ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { useLocalHubName } from '~/hooks/use-local-hub'
import { useValidation } from '~/hooks/useValidation'
import { useTranslation } from '~/lib/acm-i18next'
import { NavigationPath } from '~/NavigationPath'
import type { ManagedClusterSetBinding } from '~/resources/managed-cluster-set-binding'
import { GitOpsClusterKind } from '~/resources/gitops-cluster'
import type { Policy } from '~/resources/policy'
import type { Placement as PlacementResource } from '~/resources/placement'
import { PlacementKind } from '~/resources/placement'
import type { SubscriptionOperator } from '~/resources/subscription-operator'
import { IClusterSetBinding } from '~/wizards/common/resources/IClusterSetBinding'
import { IPlacement } from '~/wizards/common/resources/IPlacement'
import { Placement as PlacementFields } from '~/wizards/Placement/Placement'
import { WizardPage } from '~/wizards/WizardPage'
import {
  AppProjectKind,
  ArgoCDKind,
  buildGitOpsClusterResources,
  collectMissingPermissions,
  formatMissingPermissions,
  getGitOpsClusterFromResources,
  getPlacementFromResources,
  isPushModelEnabled,
  type GitOpsClusterWizardData,
  type MissingPermission,
} from '~/routes/Infrastructure/Clusters/GitOps/gitOpsClusterResources'

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
}

export function GitOpsClusterWizard(props: GitOpsClusterWizardProps) {
  const { t } = useTranslation()
  const { validateKubernetesResourceName } = useValidation()
  const editMode = props.resources && props.resources.length > 0 ? EditMode.Edit : EditMode.Create

  const defaultData = useMemo(() => {
    if (props.resources && props.resources.length > 0) {
      return props.resources
    }
    return buildGitOpsClusterResources({
      name: '',
      namespace: props.namespaces[0] ?? '',
      agentEnabled: false,
      pushModelEnabled: false,
      existingBindings: props.existingBindings,
      existingArgoCD: props.argoCDs[0],
      existingSubscription: props.subscriptions[0],
      includeBindings: false,
    })
  }, [props.resources, props.namespaces, props.existingBindings, props.argoCDs, props.subscriptions])

  return (
    <WizardPage
      id="gitopscluster-wizard"
      title={props.title}
      onSubmit={props.onSubmit}
      onCancel={props.onCancel}
      breadcrumb={props.breadcrumb}
      editMode={editMode}
      yamlEditor={props.yamlEditor}
      defaultData={defaultData}
    >
      <Step label={t('General')} id="general">
        <GitOpsPermissionAlert />
        <WizItemSelector selectKey="kind" selectValue={GitOpsClusterKind}>
          <Section label={t('General')}>
            <WizTextInput
              label={t('Name')}
              id="name"
              path="metadata.name"
              required
              placeholder={t('Enter the name')}
              validation={validateKubernetesResourceName}
              readonly={editMode === EditMode.Edit}
            />
            <WizSingleSelect
              label={t('Namespace')}
              id="namespace"
              path="metadata.namespace"
              placeholder={t('Select the Argo CD namespace')}
              options={props.namespaces}
              required
              readonly={editMode === EditMode.Edit}
              helperText={t('Select the namespace of the hub Argo CD instance.')}
            />
            <WizCheckbox
              id="enable-argo-agent"
              path="spec.gitopsAddon.enabled"
              label={t('Enable Argo CD Agent')}
              helperText={t(
                'Enables Argo CD Agent managed mode and includes hub Argo CD, AppProject, operator Subscription, and Policy resources in the YAML editor.'
              )}
            />
            <WizHidden hidden={(item: GitOpsClusterWizardData) => item?.spec?.gitopsAddon?.enabled !== true}>
              <WizCheckbox
                id="enable-push-model"
                path="transformed.pushModelEnabled"
                label={t('Enable Push model with Argo CD Agent')}
                helperText={t(
                  'Keeps the hub Argo CD controller enabled for hybrid Push and Agent deployments. When unchecked, the hub controller is disabled.'
                )}
              />
            </WizHidden>
          </Section>
        </WizItemSelector>
        {/* Keep agent flags in sync on the nested argoCDAgent path */}
        <AgentFlagSync />
        <AgentResourcesSync
          argoCDs={props.argoCDs}
          subscriptions={props.subscriptions}
          policies={props.policies}
          existingBindings={props.existingBindings ?? []}
        />
      </Step>
      <Step label={t('Placement')} id="placement">
        <WizItemSelector selectKey="kind" selectValue={PlacementKind}>
          <Section label={t('Placement')}>
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

function AgentFlagSync() {
  const resources = useItem() as IResource[]
  const { update } = useData()
  const gitOpsCluster = getGitOpsClusterFromResources(resources)
  const addonEnabled = gitOpsCluster?.spec?.gitopsAddon?.enabled === true
  const agentFlag = gitOpsCluster?.spec?.gitopsAddon?.argoCDAgent?.enabled === true

  useEffect(() => {
    if (!gitOpsCluster) return
    if (addonEnabled === agentFlag) return

    const next = resources.map((resource) => {
      if (resource.kind !== GitOpsClusterKind) return resource
      const current = resource as GitOpsClusterWizardData
      if (!addonEnabled) {
        const clone: GitOpsClusterWizardData = {
          ...current,
          spec: { ...current.spec },
          transformed: { ...current.transformed, pushModelEnabled: false },
        }
        if (clone.spec) {
          delete clone.spec.gitopsAddon
        }
        return clone
      }
      return {
        ...current,
        spec: {
          ...current.spec,
          gitopsAddon: {
            ...current.spec?.gitopsAddon,
            enabled: true,
            argoCDAgent: {
              ...current.spec?.gitopsAddon?.argoCDAgent,
              enabled: true,
            },
          },
        },
      }
    })
    update(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync only when agent checkbox flags diverge
  }, [addonEnabled, agentFlag, update])

  return null
}

function AgentResourcesSync(props: {
  argoCDs: IResource[]
  subscriptions: SubscriptionOperator[]
  policies: Policy[]
  existingBindings: ManagedClusterSetBinding[]
}) {
  const resources = useItem() as IResource[]
  const { update } = useData()
  const gitOpsCluster = getGitOpsClusterFromResources(resources)
  const placement = getPlacementFromResources(resources)
  const lastKey = useRef('')

  const name = gitOpsCluster?.metadata?.name ?? ''
  const namespace = gitOpsCluster?.metadata?.namespace ?? ''
  // Checkbox path is the source of truth; argoCDAgent.enabled is synced by AgentFlagSync
  const agentEnabled = gitOpsCluster?.spec?.gitopsAddon?.enabled === true
  const pushModelEnabled = isPushModelEnabled(gitOpsCluster)
  const clusterSetsKey = (placement?.spec?.clusterSets ?? []).join(',')

  useEffect(() => {
    if (!namespace || !gitOpsCluster) return

    const syncKey = `${name}|${namespace}|${agentEnabled}|${pushModelEnabled}|${clusterSetsKey}|${resources
      .map((r) => r.kind)
      .join(',')}`
    const expectsAgentKinds = agentEnabled
    const hasAgentKinds = resources.some((r) => r.kind === ArgoCDKind)
    const needsRebuild = syncKey !== lastKey.current || expectsAgentKinds !== hasAgentKinds
    if (!needsRebuild) return

    const clusterSets = clusterSetsKey ? clusterSetsKey.split(',') : []
    const argoCD =
      props.argoCDs.find((item) => item.metadata?.namespace === namespace) ??
      resources.find((item) => item.kind === ArgoCDKind) ??
      props.argoCDs[0]
    const existingPolicy =
      props.policies.find(
        (policy) => policy.metadata.namespace === namespace && policy.metadata.name === `${name}-argocd-policy`
      ) ?? (resources.find((item) => item.kind === 'Policy') as Policy | undefined)
    const existingSubscription =
      props.subscriptions.find(
        (subscription) =>
          subscription.spec?.name === 'openshift-gitops-operator' ||
          subscription.metadata?.name === 'openshift-gitops-operator'
      ) ?? (resources.find((item) => item.kind === 'Subscription') as SubscriptionOperator | undefined)
    const existingAppProject = resources.find((item) => item.kind === AppProjectKind)

    const next = buildGitOpsClusterResources({
      name: name || 'gitopscluster',
      namespace,
      agentEnabled,
      pushModelEnabled,
      clusterSets,
      existingGitOpsCluster: gitOpsCluster,
      existingPlacement: placement as PlacementResource | undefined,
      existingBindings: props.existingBindings,
      existingArgoCD: argoCD,
      existingAppProject,
      existingSubscription,
      existingPolicy,
      includeBindings: clusterSets.length > 0,
    })

    const nextGitOps = getGitOpsClusterFromResources(next)
    if (nextGitOps) {
      nextGitOps.metadata.name = name
      nextGitOps.transformed = { pushModelEnabled: agentEnabled ? pushModelEnabled : false }
      if (agentEnabled) {
        nextGitOps.spec = {
          ...nextGitOps.spec,
          gitopsAddon: {
            enabled: true,
            argoCDAgent: { enabled: true },
          },
        }
      } else if (nextGitOps.spec) {
        delete nextGitOps.spec.gitopsAddon
      }
    }

    // Preserve Placement user edits (predicates/tolerations/clusterSets) from current placement
    if (placement) {
      const nextPlacement = getPlacementFromResources(next)
      if (nextPlacement) {
        nextPlacement.spec = { ...placement.spec, ...nextPlacement.spec }
        if (placement.spec?.predicates) {
          nextPlacement.spec.predicates = placement.spec.predicates
        }
        if (placement.spec?.tolerations) {
          nextPlacement.spec.tolerations = placement.spec.tolerations
        }
        if (placement.spec?.clusterSets) {
          nextPlacement.spec.clusterSets = placement.spec.clusterSets
        }
      }
    }

    lastKey.current = `${name}|${namespace}|${agentEnabled}|${pushModelEnabled}|${clusterSetsKey}|${next
      .map((r) => r.kind)
      .join(',')}`
    update(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- rebuild when agent/push/name/namespace/clusterSets change
  }, [agentEnabled, pushModelEnabled, name, namespace, clusterSetsKey, update])

  return null
}

function GitOpsPermissionAlert() {
  const { t } = useTranslation()
  const resources = useItem() as IResource[]
  const [missing, setMissing] = useState<MissingPermission[]>([])

  useEffect(() => {
    let cancelled = false
    void collectMissingPermissions(resources)
      .then((result) => {
        if (!cancelled) setMissing(result)
      })
      .catch(() => {
        if (!cancelled) setMissing([])
      })
    return () => {
      cancelled = true
    }
  }, [resources])

  if (missing.length === 0) return null

  return (
    <Alert
      isInline
      variant="danger"
      title={t('You do not have permission to create or update all required resources.')}
      style={{ marginBottom: '1rem' }}
    >
      <List>
        {formatMissingPermissions(missing).map((item) => (
          <ListItem key={item}>{item}</ListItem>
        ))}
      </List>
    </Alert>
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
      style={{ marginBottom: '1rem' }}
    >
      {t(
        'GitOpsCluster Placement resources must exclude the local-cluster (hub) labeled cluster. The default predicate excludes the local-cluster label. Do not select {{hub}}.',
        { hub: localHubName }
      )}
    </Alert>
  )
}

function PlacementStepContent(props: {
  clusterSets: IResource[]
  clusterSetBindings: IClusterSetBinding[]
  clusters: IResource[]
}) {
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
