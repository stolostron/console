/* Copyright Contributors to the Open Cluster Management project */

import {
  EditMode,
  Section,
  useData,
  useItem,
  WizCheckbox,
  WizHidden,
  WizItemSelector,
  WizSingleSelect,
  WizTextInput,
} from '@patternfly-labs/react-form-wizard'
import { Alert, List, ListItem } from '@patternfly/react-core'
import { useEffect, useRef, useState } from 'react'
import { useValidation } from '~/hooks/useValidation'
import { useTranslation } from '~/lib/acm-i18next'
import type { IResource } from '~/resources'
import { GitOpsClusterKind } from '~/resources/gitops-cluster'
import type { ManagedClusterSetBinding } from '~/resources/managed-cluster-set-binding'
import type { Placement as PlacementResource } from '~/resources/placement'
import type { Policy } from '~/resources/policy'
import type { SubscriptionOperator } from '~/resources/subscription-operator'
import {
  AppProjectKind,
  ArgoCDKind,
  buildGitOpsClusterResources,
  collectMissingPermissions,
  findArgoCDInNamespace,
  formatMissingPermissions,
  getGitOpsClusterFromResources,
  getPlacementFromResources,
  isPushModelEnabled,
  preferDraftManagedClusterSetBindings,
  type GitOpsClusterWizardData,
  type MissingPermission,
} from '~/routes/Infrastructure/Clusters/GitOps/gitOpsClusterResources'

export interface GitOpsClusterGeneralStepProps {
  namespaces: string[]
  editMode: EditMode
  argoCDs: IResource[]
  subscriptions: SubscriptionOperator[]
  policies: Policy[]
  existingBindings?: ManagedClusterSetBinding[]
}

export function GitOpsClusterGeneralStep(props: GitOpsClusterGeneralStepProps) {
  const { t } = useTranslation()
  const { validateKubernetesResourceName } = useValidation()

  return (
    <>
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
            disabled={props.editMode === EditMode.Edit}
          />
          <WizSingleSelect
            label={t('Namespace')}
            id="namespace"
            path="metadata.namespace"
            placeholder={t('Select the Argo CD namespace')}
            options={props.namespaces}
            required
            disabled={props.editMode === EditMode.Edit}
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
    </>
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
    // Prefer the wizard/YAML copy so rebuilds (e.g. Push toggle) do not wipe in-progress edits.
    // Fall back to live Recoil resources only when the draft does not include that kind yet.
    const argoCD =
      (resources.find((item) => item.kind === ArgoCDKind && item.metadata?.namespace === namespace) as
        IResource | undefined) ?? findArgoCDInNamespace(props.argoCDs, namespace)
    const existingPolicy =
      (resources.find(
        (item) =>
          item.kind === 'Policy' &&
          item.metadata?.namespace === namespace &&
          item.metadata?.name === `${name}-argocd-policy`
      ) as Policy | undefined) ??
      props.policies.find(
        (policy) => policy.metadata.namespace === namespace && policy.metadata.name === `${name}-argocd-policy`
      )
    const existingSubscription =
      (resources.find((item) => item.kind === 'Subscription') as SubscriptionOperator | undefined) ??
      props.subscriptions.find(
        (subscription) =>
          subscription.spec?.name === 'openshift-gitops-operator' ||
          subscription.metadata?.name === 'openshift-gitops-operator'
      )
    const existingAppProject = resources.find(
      (item) => item.kind === AppProjectKind && item.metadata?.namespace === namespace
    )
    const currentBindings = resources.filter(
      (item) => item.kind === 'ManagedClusterSetBinding' && item.metadata?.namespace === namespace
    ) as ManagedClusterSetBinding[]

    const next = buildGitOpsClusterResources({
      name: name || 'gitopscluster',
      namespace,
      agentEnabled,
      pushModelEnabled,
      clusterSets,
      existingGitOpsCluster: gitOpsCluster,
      existingPlacement: placement as PlacementResource | undefined,
      existingBindings: preferDraftManagedClusterSetBindings({
        namespace,
        clusterSets,
        draftBindings: currentBindings,
        liveBindings: props.existingBindings,
      }),
      existingArgoCD: argoCD,
      existingAppProject,
      existingSubscription,
      existingPolicy,
      includeBindings: true,
    })

    const nextGitOps = getGitOpsClusterFromResources(next)
    if (nextGitOps) {
      nextGitOps.metadata.name = name
      nextGitOps.transformed = { pushModelEnabled: agentEnabled ? pushModelEnabled : false }
      if (agentEnabled) {
        const existingAddon = nextGitOps.spec?.gitopsAddon
        nextGitOps.spec = {
          ...nextGitOps.spec,
          gitopsAddon: {
            ...existingAddon,
            enabled: true,
            argoCDAgent: { ...existingAddon?.argoCDAgent, enabled: true },
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
      style={{ marginBottom: 'var(--pf-t--global--spacer--md)' }}
    >
      <List>
        {formatMissingPermissions(missing).map((item) => (
          <ListItem key={item}>{item}</ListItem>
        ))}
      </List>
    </Alert>
  )
}
