/* Copyright Contributors to the Open Cluster Management project */
import { useData, useItem } from '@patternfly-labs/react-form-wizard'
import { PolicySetWizard } from '../../../wizards/Governance/PolicySet/PolicySetWizard'
import { AcmToastContext } from '../../../ui-components'
import { useContext, useMemo } from 'react'
import { useHistory } from 'react-router-dom'
import { useRecoilState, useSharedAtoms } from '../../../shared-recoil'
import { SyncEditor } from '../../../components/SyncEditor/SyncEditor'
import { useTranslation } from '../../../lib/acm-i18next'
import { NavigationPath } from '../../../NavigationPath'
import { IResource, PolicySetKind, reconcileResources } from '../../../resources'
import schema from './schema.json'

export function WizardSyncEditor() {
  const resources = useItem() // Wizard framework sets this context
  const { update } = useData() // Wizard framework sets this context
  const { t } = useTranslation()
  return (
    <SyncEditor
      editorTitle={t('Policy set YAML')}
      variant="toolbar"
      resources={resources}
      schema={schema}
      onEditorChange={(changes: { resources: any[] }): void => {
        update(changes?.resources)
      }}
    />
  )
}

function getWizardSyncEditor() {
  return <WizardSyncEditor />
}

export function CreatePolicySet() {
  const { t } = useTranslation()
  const toast = useContext(AcmToastContext)
  const history = useHistory()
  const {
    managedClusterSetBindingsState,
    managedClusterSetsState,
    managedClustersState,
    namespacesState,
    placementRulesState,
    placementsState,
    usePolicies,
  } = useSharedAtoms()
  const policies = usePolicies()
  const [namespaces] = useRecoilState(namespacesState)
  const [placements] = useRecoilState(placementsState)
  const [placementRules] = useRecoilState(placementRulesState)
  const [managedClusters] = useRecoilState(managedClustersState)
  const [clusterSets] = useRecoilState(managedClusterSetsState)
  const [clusterSetBindings] = useRecoilState(managedClusterSetBindingsState)
  const namespaceNames = useMemo(
    () => namespaces.map((namespace) => namespace.metadata.name ?? '').sort(),
    [namespaces]
  )
  return (
    <PolicySetWizard
      title={t('Create policy set')}
      policies={policies}
      clusters={managedClusters}
      placements={placements}
      breadcrumb={[{ text: t('Policy sets'), to: NavigationPath.policySets }, { text: t('Create policy set') }]}
      namespaces={namespaceNames}
      placementRules={placementRules}
      yamlEditor={getWizardSyncEditor}
      clusterSets={clusterSets}
      clusterSetBindings={clusterSetBindings}
      onSubmit={(data) => {
        const resources = data as IResource[]
        return reconcileResources(resources, []).then(() => {
          const policySet = resources.find((resource) => resource.kind === PolicySetKind)
          if (policySet) {
            toast.addAlert({
              title: t('Policy set created'),
              message: t('{{name}} was successfully created.', { name: policySet.metadata?.name }),
              type: 'success',
              autoClose: true,
            })
          }
          history.push(NavigationPath.policySets)
        })
      }}
      onCancel={() => history.push(NavigationPath.policySets)}
    />
  )
}
