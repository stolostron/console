/* Copyright Contributors to the Open Cluster Management project */
import { useData, useItem } from '@patternfly-labs/react-form-wizard'
import { PolicyWizard } from '../../../wizards/Governance/Policy/PolicyWizard'
import { AcmToastContext } from '../../../ui-components'
import { useContext, useMemo } from 'react'
import { useHistory } from 'react-router-dom'
import { useRecoilState, useSharedAtoms } from '../../../shared-recoil'
import { SyncEditor } from '../../../components/SyncEditor/SyncEditor'
import { useTranslation } from '../../../lib/acm-i18next'
import { NavigationPath } from '../../../NavigationPath'
import { IResource, PolicyKind, reconcileResources } from '../../../resources'
import schema from './schema.json'

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
      onCancel={() => history.push(NavigationPath.policies)}
      onSubmit={(data) => {
        const resources = data as IResource[]
        return reconcileResources(resources, []).then(() => {
          const policy = resources.find((resource) => resource.kind === PolicyKind)
          if (policy) {
            toast.addAlert({
              title: t('Policy created'),
              message: t('{{name}} was successfully created.', { name: policy.metadata?.name }),
              type: 'success',
              autoClose: true,
            })
            history.push(
              NavigationPath.policyDetails
                .replace(':namespace', policy.metadata?.namespace ?? '')
                .replace(':name', policy.metadata?.name ?? '')
            )
          }
        })
      }}
    />
  )
}
