/* Copyright Contributors to the Open Cluster Management project */
import { useData, useItem } from '@patternfly-labs/react-form-wizard'
import { PolicyWizard } from '../../../wizards/Governance/Policy/PolicyWizard'
import { AcmToastContext } from '../../../ui-components'
import { useContext, useEffect, useMemo, useState } from 'react'
import { useHistory } from 'react-router-dom'
import { useRecoilState, useSharedAtoms } from '../../../shared-recoil'
import { SyncEditor } from '../../../components/SyncEditor/SyncEditor'
import { useTranslation } from '../../../lib/acm-i18next'
import { NavigationPath } from '../../../NavigationPath'
import { IResource, Policy, PolicyKind, reconcileResources } from '../../../resources'
import schema from './schema.json'
import { LostChangesContext } from '../../../components/LostChanges'

export function WizardSyncEditor() {
  const resources = useItem() // Wizard framework sets this context
  const { update } = useData() // Wizard framework sets this context
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
  const history = useHistory()
  const policies = usePolicies()
  const [namespaces] = useRecoilState(namespacesState)
  const [placements] = useRecoilState(placementsState)
  const [placementRules] = useRecoilState(placementRulesState)
  const [managedClusters] = useRecoilState(managedClustersState)
  const [clusterSets] = useRecoilState(managedClusterSetsState)
  const [clusterSetBindings] = useRecoilState(managedClusterSetBindingsState)
  const namespaceNames = useMemo(
    () =>
      namespaces
        .filter((namespace) => !namespace.metadata.labels?.['cluster.open-cluster-management.io/managedCluster'])
        .map((namespace) => namespace.metadata.name ?? '')
        .sort(),
    [namespaces]
  )
  const { cancelForm, submitForm } = useContext(LostChangesContext)
  const [createdPolicy, setCreatedPolicy] = useState<IResource>()
  // Before move to PolicyDetailPage,
  // Wait until "policies" are updated
  useEffect(() => {
    if (createdPolicy) {
      const found = policies.find(
        (policy: Policy) =>
          policy.metadata.namespace === createdPolicy.metadata?.namespace &&
          policy.metadata.name === createdPolicy.metadata?.name
      )

      found &&
        history.push(
          NavigationPath.policyDetails
            .replace(':namespace', createdPolicy.metadata?.namespace ?? '')
            .replace(':name', createdPolicy.metadata?.name ?? '')
        )
    }
  }, [policies, createdPolicy, history])

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
        history.push(NavigationPath.policies)
      }}
      onSubmit={(data) => {
        const resources = data as IResource[]
        return reconcileResources(resources, []).then(() => {
          const policy = resources.find((resource) => resource.kind === PolicyKind)
          if (policy) {
            toast.addAlert({
              title: t('Policy created'),
              message: t('{{name}} was successfully created.', {
                name: policy.metadata?.name,
              }),
              type: 'success',
              autoClose: true,
            })
            submitForm()

            return new Promise(() => {
              setCreatedPolicy(policy)
            })
          }
        })
      }}
    />
  )
}
