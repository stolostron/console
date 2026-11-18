/* Copyright Contributors to the Open Cluster Management project */

import {
  EditorValidationStatus,
  useData,
  useDefaultItem,
  useEditorValidationStatus,
  useHighlightEditorPath,
  useItem,
} from '@patternfly-labs/react-form-wizard'
import { useContext, useEffect, useRef, useState } from 'react'
import { Alert } from '@patternfly/react-core'
import { useNavigate, useParams } from 'react-router'
import { LoadingPage } from '~/components/LoadingPage'
import { LostChangesContext } from '~/components/LostChanges'
import { SyncEditor, ValidationStatus } from '~/components/SyncEditor/SyncEditor'
import { useTranslation } from '~/lib/acm-i18next'
import { isType } from '~/lib/is-type'
import { NavigationPath } from '~/NavigationPath'
import { PluginContext } from '~/lib/PluginContext'
import type { IResource } from '~/resources'
import { GitOpsClusterKind } from '~/resources/gitops-cluster'
import { ManagedClusterSetBindingKind } from '~/resources/managed-cluster-set-binding'
import { PlacementKind } from '~/resources/placement'
import { PolicyKind } from '~/resources/policy'
import { useSharedAtoms, useSharedValue } from '~/shared-atoms'
import { getResource, ResourceError, ResourceErrorCode } from '~/resources/utils'
import { AcmToastContext } from '~/ui-components'
import {
  buildGitOpsClusterResources,
  AppProjectDefinition,
  collectMissingPermissions,
  ensureGitOpsClusterPlacement,
  findGitOpsOperatorSubscription,
  formatMissingPermissions,
  getRemovedGitOpsWizardResources,
  isGitOpsBindingOwnedBy,
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
  const { dataContext } = useContext(PluginContext)
  const { loadCompleted } = useContext(dataContext)
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
  const [existingAppProject, setExistingAppProject] = useState<IResource>()
  const [loadError, setLoadError] = useState<Error>()
  const baselineResources = useRef<IResource[]>([])

  const availableNamespaces =
    argoCDs.length > 0
      ? argoCDs.map((argo) => argo.metadata?.namespace).filter(isType)
      : namespaces.map((ns) => ns.metadata.name).filter(isType)

  useEffect(() => {
    // Array atoms have no per-kind readiness flag. LOADED means the Placement
    // snapshot (including an empty snapshot) and related watches have completed.
    if (!loadCompleted || existingResources !== undefined) return
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

    let cancelled = false
    // AppProject is not watched; load it before freezing either the wizard draft
    // or the original live resources used to merge concurrent edits on submit.
    void getResource({ ...AppProjectDefinition, metadata: { name: 'default', namespace } })
      .promise.catch((error: unknown) => {
        if (error instanceof ResourceError && error.code === ResourceErrorCode.NotFound) return undefined
        throw error
      })
      .then((project) => {
        if (cancelled) return
        setLoadError(undefined)
        baselineResources.current = JSON.parse(
          JSON.stringify(
            [
              gitOpsCluster,
              placement,
              ...relatedBindings,
              argoCD,
              project,
              existingSubscription,
              existingPolicy,
            ].filter(isType)
          )
        )
        setExistingAppProject(project)
        setExistingResources(
          buildGitOpsClusterResources({
            name,
            namespace,
            agentEnabled,
            pushModelEnabled: isPushModelEnabled(wizardGitOps),
            clusterSets: placement?.spec?.clusterSets,
            existingGitOpsCluster: wizardGitOps,
            existingPlacement: placement,
            existingBindings: relatedBindings,
            existingArgoCD: argoCD,
            existingAppProject: project,
            existingSubscription,
            existingPolicy,
            includeBindings: true,
          })
        )
      })
      .catch((error: Error) => {
        if (!cancelled) setLoadError(error)
      })
    return () => {
      cancelled = true
    }
  }, [
    loadCompleted,
    existingResources,
    gitOpsClusters,
    placements,
    argoCDs,
    clusterSetBindings,
    policies,
    subscriptions,
    name,
    namespace,
    navigate,
  ])

  const { cancelForm, submitForm } = useContext(LostChangesContext)

  if (loadError) {
    return (
      <Alert isInline variant="danger" title={t('Failed to load GitOpsCluster')}>
        {loadError.message}
      </Alert>
    )
  }
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
      existingAppProject={existingAppProject}
      resources={existingResources}
      yamlEditor={getWizardSyncEditor}
      onSubmit={async (data) => {
        const resources = ensureGitOpsClusterPlacement(data as IResource[])
        const gitOpsCluster = existingResources.find((resource) => resource.kind === GitOpsClusterKind)!
        const previousOwned = stripTransformedFields(baselineResources.current).filter(
          (resource) =>
            resource.kind === GitOpsClusterKind ||
            resource.kind === PlacementKind ||
            resource.kind === PolicyKind ||
            (resource.kind === ManagedClusterSetBindingKind && isGitOpsBindingOwnedBy(resource, gitOpsCluster))
        ) as IResource[]
        const removed = getRemovedGitOpsWizardResources(resources, previousOwned, placements)
        const missing = await collectMissingPermissions(resources, removed)
        if (missing.length > 0) {
          toast.addAlert({
            title: t('Missing permissions'),
            message: formatMissingPermissions(missing).join(', '),
            type: 'danger',
            autoClose: true,
          })
          throw new Error(t('Missing permissions to update one or more required resources.'))
        }

        return reconcileGitOpsWizardResources(resources, previousOwned, {
          baseline: baselineResources.current,
          placements,
        })
          .then((result) => {
            const gitOpsCluster = resources.find((resource) => resource.kind === GitOpsClusterKind)
            const name = gitOpsCluster?.metadata?.name
            const wasCreated = result.gitOpsCluster === 'created'
            toast.addAlert({
              title: wasCreated ? t('GitOpsCluster created') : t('GitOpsCluster updated'),
              message: wasCreated
                ? t('{{name}} was successfully created.', { name })
                : t('{{name}} was successfully updated.', { name }),
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
