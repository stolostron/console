/* Copyright Contributors to the Open Cluster Management project */

import {
  EditorValidationStatus,
  useData,
  useDefaultItem,
  useEditorValidationStatus,
  useHighlightEditorPath,
  useItem,
} from '@patternfly-labs/react-form-wizard'
import { useContext } from 'react'
import { useNavigate } from 'react-router'
import { LostChangesContext } from '~/components/LostChanges'
import { SyncEditor, ValidationStatus } from '~/components/SyncEditor/SyncEditor'
import { useTranslation } from '~/lib/acm-i18next'
import { isType } from '~/lib/is-type'
import { NavigationPath } from '~/NavigationPath'
import { GitOpsClusterKind } from '~/resources/gitops-cluster'
import type { IResource } from '~/resources'
import { useSharedAtoms, useSharedValue } from '~/shared-atoms'
import { AcmToastContext } from '~/ui-components'
import {
  collectMissingPermissions,
  ensureGitOpsClusterPlacement,
  formatMissingPermissions,
  reconcileGitOpsWizardResources,
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
      highlightEditorPath={highlightEditorPath}
      onEditorChange={(changes, resetDefaultSnapshot): void => {
        update(changes?.resources, resetDefaultSnapshot)
      }}
      onStatusChange={(editorStatus: ValidationStatus): void => {
        setEditorValidationStatus(editorStatus as unknown as EditorValidationStatus)
      }}
      editableUidSiblings={true}
      filters={['*.metadata.managedFields', '*.transformed']}
    />
  )
}

function getWizardSyncEditor() {
  return <WizardSyncEditor />
}

export default function CreateGitOpsClusterPage() {
  return <CreateGitOpsCluster />
}

export function CreateGitOpsCluster(
  props: { isModal?: boolean; onCancel?: () => void; onSubmitSuccess?: () => void } = {}
) {
  const { t } = useTranslation()
  const {
    argoCDsState,
    namespacesState,
    managedClusterSetsState,
    managedClusterSetBindingsState,
    managedClustersState,
    subscriptionOperatorsState,
    policiesState,
  } = useSharedAtoms()
  const argoCDs = useSharedValue(argoCDsState)
  const namespaces = useSharedValue(namespacesState)
  const clusterSets = useSharedValue(managedClusterSetsState)
  const clusterSetBindings = useSharedValue(managedClusterSetBindingsState)
  const clusters = useSharedValue(managedClustersState)
  const subscriptions = useSharedValue(subscriptionOperatorsState)
  const policies = useSharedValue(policiesState)

  const argoNamespaces = Array.from(
    new Set(
      [
        ...argoCDs.map((argo) => argo.metadata?.namespace).filter(isType),
        ...namespaces.map((namespace) => namespace.metadata.name).filter(isType),
      ].filter(Boolean)
    )
  )
  // Prefer Argo CD namespaces when available
  const availableNamespaces =
    argoCDs.length > 0 ? argoCDs.map((argo) => argo.metadata?.namespace).filter(isType) : argoNamespaces

  const { cancelForm, submitForm } = useContext(LostChangesContext)
  const navigate = useNavigate()
  const toast = useContext(AcmToastContext)

  return (
    <GitOpsClusterWizard
      title={t('Create GitOpsCluster')}
      isModal={props.isModal}
      namespaces={availableNamespaces}
      clusterSets={clusterSets}
      clusterSetBindings={clusterSetBindings}
      clusters={clusters}
      argoCDs={argoCDs}
      subscriptions={subscriptions}
      policies={policies}
      existingBindings={clusterSetBindings}
      yamlEditor={getWizardSyncEditor}
      onCancel={() => {
        cancelForm()
        if (props.onCancel) props.onCancel()
        else void navigate(NavigationPath.gitOps)
      }}
      breadcrumb={[{ text: t('GitOps'), to: NavigationPath.gitOps }, { text: t('Create GitOpsCluster') }]}
      onSubmit={async (data) => {
        const resources = ensureGitOpsClusterPlacement(data as IResource[], t)
        const missing = await collectMissingPermissions(resources)
        if (missing.length > 0) {
          toast.addAlert({
            title: t('Missing permissions'),
            message: formatMissingPermissions(missing).join(', '),
            type: 'danger',
            autoClose: true,
          })
          throw new Error(t('Missing permissions to create one or more required resources.'))
        }

        return reconcileGitOpsWizardResources(resources, t)
          .then((result) => {
            const gitOpsCluster = resources.find((resource) => resource.kind === GitOpsClusterKind)
            const name = gitOpsCluster?.metadata?.name
            const wasUpdated = result.gitOpsCluster === 'updated'
            toast.addAlert({
              title: wasUpdated ? t('GitOpsCluster updated') : t('GitOpsCluster created'),
              message: wasUpdated
                ? t('{{name}} was successfully updated.', { name })
                : t('{{name}} was successfully created.', { name }),
              type: 'success',
              autoClose: true,
            })
            submitForm()
            if (props.onSubmitSuccess) props.onSubmitSuccess()
            else void navigate(NavigationPath.gitOps)
          })
          .catch((err) => {
            const reason = err?.reason ?? 'Unknown'
            const message = err?.message ?? String(err)
            toast.addAlert({
              title: t('Failed to create GitOpsCluster'),
              message: t('Reason: {{reason}}. Error: {{error}}.', {
                reason,
                error: message,
              }),
              type: 'danger',
              autoClose: true,
            })
            throw err
          })
      }}
    />
  )
}
