/* Copyright Contributors to the Open Cluster Management project */

import {
  EditorValidationStatus,
  useData,
  useDefaultItem,
  useEditorValidationStatus,
  useHighlightEditorPath,
  useItem,
} from '@patternfly-labs/react-form-wizard'
import { useContext, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { LoadingPage } from '~/components/LoadingPage'
import { LostChangesContext } from '~/components/LostChanges'
import { SyncEditor, ValidationStatus } from '~/components/SyncEditor/SyncEditor'
import { useTranslation } from '~/lib/acm-i18next'
import { isType } from '~/lib/is-type'
import { NavigationPath } from '~/NavigationPath'
import type { IResource } from '~/resources'
import { GitOpsClusterKind } from '~/resources/gitops-cluster'
import { ManagedClusterSetBindingKind } from '~/resources/managed-cluster-set-binding'
import { PlacementKind } from '~/resources/placement'
import { PolicyKind } from '~/resources/policy'
import { useSharedAtoms, useSharedValue } from '~/shared-atoms'
import { AcmToastContext } from '~/ui-components'
import {
  buildGitOpsClusterResources,
  collectMissingPermissions,
  ensureGitOpsClusterPlacement,
  findGitOpsOperatorSubscription,
  formatMissingPermissions,
  isAgentEnabled,
  isPushModelEnabled,
  policyNameFor,
  reconcileGitOpsWizardResources,
  stripTransformedFields,
  type GitOpsClusterWizardData,
} from '~/routes/Infrastructure/Clusters/GitOps/gitOpsClusterResources'
import { GitOpsClusterWizard } from '~/routes/Infrastructure/Clusters/GitOps/GitOpsClusterWizard'
import schema from '~/routes/Infrastructure/Clusters/GitOps/schema.json'

export function WizardSyncEditor() {
  const resources = useItem()
  const defaultItem = useDefaultItem()
  const { update } = useData()
  const { setEditorValidationStatus } = useEditorValidationStatus()
  const { highlightEditorPath } = useHighlightEditorPath()
  const { t } = useTranslation()

  return (
    <SyncEditor
      editorTitle={t('GitOpsCluster YAML')}
      variant="toolbar"
      resources={resources}
      defaultResources={defaultItem}
      schema={schema}
      onEditorChange={(changes, resetDefaultSnapshot): void => {
        update(changes?.resources, resetDefaultSnapshot)
      }}
      onStatusChange={(editorStatus: ValidationStatus): void => {
        setEditorValidationStatus(editorStatus as unknown as EditorValidationStatus)
      }}
      editableUidSiblings={true}
      filters={['*.metadata.managedFields', '*.transformed']}
      immutables={['GitOpsCluster[0].metadata.name', 'GitOpsCluster[0].metadata.namespace']}
      highlightEditorPath={highlightEditorPath}
    />
  )
}

function getWizardSyncEditor() {
  return <WizardSyncEditor />
}

export function EditGitOpsCluster() {
  const { t } = useTranslation()
  const toast = useContext(AcmToastContext)
  const params = useParams()
  const { name = '', namespace = '' } = params
  const navigate = useNavigate()
  const {
    argoCDsState,
    namespacesState,
    gitOpsClustersState,
    placementsState,
    managedClusterSetsState,
    managedClusterSetBindingsState,
    managedClustersState,
    subscriptionOperatorsState,
    policiesState,
  } = useSharedAtoms()
  const argoCDs = useSharedValue(argoCDsState)
  const namespaces = useSharedValue(namespacesState)
  const gitOpsClusters = useSharedValue(gitOpsClustersState)
  const placements = useSharedValue(placementsState)
  const clusterSets = useSharedValue(managedClusterSetsState)
  const clusterSetBindings = useSharedValue(managedClusterSetBindingsState)
  const clusters = useSharedValue(managedClustersState)
  const subscriptions = useSharedValue(subscriptionOperatorsState)
  const policies = useSharedValue(policiesState)
  const [existingResources, setExistingResources] = useState<IResource[] | undefined>()

  const availableNamespaces =
    argoCDs.length > 0
      ? argoCDs.map((argo) => argo.metadata?.namespace).filter(isType)
      : namespaces.map((ns) => ns.metadata.name).filter(isType)

  useEffect(() => {
    const gitOpsCluster = gitOpsClusters.find(
      (resource) => resource.metadata.name === name && resource.metadata.namespace === namespace
    )
    if (!gitOpsCluster) {
      void navigate(NavigationPath.gitOps)
      return
    }

    const placementName = gitOpsCluster.spec?.placementRef?.name
    const placement = placements.find(
      (item) => item.metadata.namespace === namespace && item.metadata.name === placementName
    )
    const agentEnabled = isAgentEnabled(gitOpsCluster)
    const argoCD = argoCDs.find((item) => item.metadata?.namespace === namespace) // never fall back to another NS
    const pushEnabled =
      (argoCD as (IResource & { spec?: { controller?: { enabled?: boolean } } }) | undefined)?.spec?.controller
        ?.enabled === true
    const wizardGitOps: GitOpsClusterWizardData = {
      ...gitOpsCluster,
      transformed: { pushModelEnabled: agentEnabled ? pushEnabled : false },
    }
    if (agentEnabled && wizardGitOps.spec) {
      wizardGitOps.spec.gitopsAddon = {
        ...wizardGitOps.spec.gitopsAddon,
        enabled: true,
        argoCDAgent: {
          ...wizardGitOps.spec.gitopsAddon?.argoCDAgent,
          enabled: true,
        },
      }
    }

    const relatedBindings = clusterSetBindings.filter(
      (binding) =>
        binding.metadata.namespace === namespace &&
        !!placement &&
        (!placement.spec.clusterSets?.length || placement.spec.clusterSets.includes(binding.spec.clusterSet))
    )
    const existingPolicy = policies.find(
      (policy) => policy.metadata.namespace === namespace && policy.metadata.name === policyNameFor(name)
    )
    const existingSubscription = findGitOpsOperatorSubscription(subscriptions)

    // Freeze the wizard baseline after the first successful load. Watched updates must not replace
    // Wizard defaultData alone (stale resourceVersion / lost draft). Upsert re-reads live objects on submit.
    // AppProject is not in Recoil; collectMissingPermissions probes the live object when the draft has no uid.
    setExistingResources((previous) => {
      if (previous !== undefined) {
        return previous
      }
      return buildGitOpsClusterResources({
        name,
        namespace,
        agentEnabled,
        pushModelEnabled: isPushModelEnabled(wizardGitOps),
        clusterSets: placement?.spec?.clusterSets,
        existingGitOpsCluster: wizardGitOps,
        existingPlacement: placement,
        existingBindings: relatedBindings,
        existingArgoCD: argoCD,
        existingSubscription,
        existingPolicy,
        includeBindings: true,
      })
    })
  }, [gitOpsClusters, placements, argoCDs, clusterSetBindings, policies, subscriptions, name, namespace, navigate])

  const { cancelForm, submitForm } = useContext(LostChangesContext)

  if (existingResources === undefined) {
    return <LoadingPage />
  }

  return (
    <GitOpsClusterWizard
      title={t('Edit GitOpsCluster')}
      namespaces={availableNamespaces}
      clusterSets={clusterSets}
      clusterSetBindings={clusterSetBindings}
      clusters={clusters}
      argoCDs={argoCDs}
      subscriptions={subscriptions}
      policies={policies}
      existingBindings={clusterSetBindings}
      resources={existingResources}
      yamlEditor={getWizardSyncEditor}
      onSubmit={async (data) => {
        const resources = ensureGitOpsClusterPlacement(data as IResource[])
        const missing = await collectMissingPermissions(resources)
        if (missing.length > 0) {
          toast.addAlert({
            title: t('Missing permissions'),
            message: formatMissingPermissions(missing).join(', '),
            type: 'danger',
            autoClose: true,
          })
          throw new Error(t('Missing permissions to update one or more required resources.'))
        }

        const previousOwned = stripTransformedFields(existingResources).filter(
          (resource) =>
            resource.kind === GitOpsClusterKind ||
            resource.kind === PlacementKind ||
            resource.kind === ManagedClusterSetBindingKind ||
            resource.kind === PolicyKind
        ) as IResource[]

        return reconcileGitOpsWizardResources(resources, previousOwned)
          .then(() => {
            const updated = resources.find((resource) => resource.kind === GitOpsClusterKind)
            toast.addAlert({
              title: t('GitOpsCluster updated'),
              message: t('{{name}} was successfully updated.', {
                name: updated?.metadata?.name,
              }),
              type: 'success',
              autoClose: true,
            })
            submitForm()
            void navigate(NavigationPath.gitOps)
          })
          .catch((err) => {
            toast.addAlert({
              title: t('Failed to update GitOpsCluster'),
              message: err instanceof Error ? err.message : String(err),
              type: 'danger',
              autoClose: true,
            })
            throw err
          })
      }}
      onCancel={() => {
        cancelForm()
        void navigate(NavigationPath.gitOps)
      }}
      breadcrumb={[{ text: t('GitOps'), to: NavigationPath.gitOps }, { text: name }]}
    />
  )
}
