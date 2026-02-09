/* Copyright Contributors to the Open Cluster Management project */
import { EditorValidationStatus, useData, useEditorValidationStatus, useItem } from '@patternfly-labs/react-form-wizard'
import { useContext, useEffect, useMemo, useState } from 'react'
import { generatePath, useNavigate } from 'react-router-dom-v5-compat'
import { LostChangesContext } from '../../../components/LostChanges'
import { SyncEditor, ValidationStatus } from '../../../components/SyncEditor/SyncEditor'
import { useTranslation } from '../../../lib/acm-i18next'
import { NavigationPath } from '../../../NavigationPath'
import { IResource, Policy } from '../../../resources'
import { reconcileResources } from '../../../resources/utils'
import { useRecoilValue, useSharedAtoms } from '../../../shared-recoil'
import { AcmToastContext } from '../../../ui-components'
import { localeCompare } from '../../../utils/localeCompare'
import { PolicyWizard } from '../../../wizards/Governance/Policy/PolicyWizard'
import schema from './schema.json'

export function WizardSyncEditor() {
  const resources = useItem() // Wizard framework sets this context
  const { update } = useData() // Wizard framework sets this context
  const { setEditorValidationStatus } = useEditorValidationStatus()

  const { t } = useTranslation()
  return (
    <SyncEditor
      editorTitle={t('Policy YAML')}
      variant="toolbar"
      resources={resources}
      schema={schema}
      onEditorChange={(changes: { resources: any[] }): void => {
        update(changes?.resources)
      }}
      onStatusChange={(editorStatus: ValidationStatus): void => {
        setEditorValidationStatus(editorStatus as unknown as EditorValidationStatus)
      }}
      editableUidSiblings={true}
      autoCreateNs
    />
  )
}

function getWizardSyncEditor() {
  return <WizardSyncEditor />
}

export function CreatePolicy(props: { initialResources?: IResource[] }) {
  const { t } = useTranslation()
  const {
    managedClusterSetBindingsState,
    managedClusterSetsState,
    managedClustersState,
    namespacesState,
    placementRulesState,
    placementsState,
    usePolicies,
  } = useSharedAtoms()
  const toast = useContext(AcmToastContext)
  const navigate = useNavigate()
  const policies = usePolicies()
  const namespaces = useRecoilValue(namespacesState)
  const placements = useRecoilValue(placementsState)
  const placementRules = useRecoilValue(placementRulesState)
  const managedClusters = useRecoilValue(managedClustersState)
  const clusterSets = useRecoilValue(managedClusterSetsState)
  const clusterSetBindings = useRecoilValue(managedClusterSetBindingsState)
  const namespaceNames = useMemo(
    () =>
      namespaces
        .filter((namespace) => !namespace.metadata.labels?.['cluster.open-cluster-management.io/managedCluster'])
        .map((namespace) => namespace.metadata.name ?? '')
        .sort(localeCompare),
    [namespaces]
  )
  const { cancelForm, submitForm } = useContext(LostChangesContext)
  const [createdPolicy, setCreatedPolicy] = useState<IResource>()
  const [isSaving, setIsSaving] = useState(false)

  // Before move to PolicyDetailPage,
  // Wait until "policies" are updated
  useEffect(() => {
    if (createdPolicy) {
      const foundPolicy = policies.find(
        (policy: Policy) =>
          policy.metadata.namespace === createdPolicy.metadata?.namespace &&
          policy.metadata.name === createdPolicy.metadata?.name
      )
      if (foundPolicy) {
        toast.addAlert({
          title: t('Policy created'),
          message: t('{{name}} was successfully created.', {
            name: foundPolicy.metadata?.name,
          }),
          type: 'success',
          autoClose: true,
        })
        navigate(
          generatePath(NavigationPath.policyDetails, {
            namespace: foundPolicy.metadata?.namespace ?? '',
            name: foundPolicy.metadata?.name ?? '',
          })
        )
        setIsSaving(false)
        submitForm()
        setCreatedPolicy(undefined)
      }
    }
  }, [policies, createdPolicy, navigate, toast, t, submitForm])

  return (
    <PolicyWizard
      title={t('Create policy')}
      policies={policies}
      clusters={managedClusters}
      yamlEditor={getWizardSyncEditor}
      resources={props.initialResources}
      namespaces={namespaceNames}
      placements={placements}
      placementRules={placementRules}
      clusterSets={clusterSets}
      clusterSetBindings={clusterSetBindings}
      breadcrumb={[{ text: t('Policies'), to: NavigationPath.policies }, { text: t('Create policy') }]}
      onCancel={() => {
        cancelForm()
        navigate(NavigationPath.policies)
      }}
      onSubmit={(data) => {
        setIsSaving(true)
        const resources = data as IResource[]
        return reconcileResources(resources, [])
          .then(() => setCreatedPolicy(resources[0]))
          .catch((err) => {
            cancelForm()
            toast.addAlert({
              title: t('Failed to create Policy'),
              message: t('Reason: {{reason}}. Error: {{error}}.', {
                reason: err.reason,
                error: err.message,
              }),
              type: 'danger',
              autoClose: true,
            })
            setIsSaving(false)
          })
      }}
      isSaving={isSaving}
    />
  )
}
