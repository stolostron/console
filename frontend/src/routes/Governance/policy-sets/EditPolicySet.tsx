/* Copyright Contributors to the Open Cluster Management project */
import { EditMode, useData, useItem } from '@patternfly-labs/react-form-wizard'
import { PolicySetWizard } from '../../../wizards/Governance/PolicySet/PolicySetWizard'
import { useContext, useEffect, useMemo, useState } from 'react'
import { useHistory, useParams } from 'react-router-dom'
import { LoadingPage } from '../../../components/LoadingPage'
import { SyncEditor } from '../../../components/SyncEditor/SyncEditor'
import { useTranslation } from '../../../lib/acm-i18next'
import { NavigationPath } from '../../../NavigationPath'
import { IResource, PolicySetKind, reconcileResources } from '../../../resources'
import { useSharedAtoms, useRecoilState } from '../../../shared-recoil'
import { AcmToastContext } from '../../../ui-components'
import { getPlacementBindingsForResource, getPlacementsForResource } from '../common/util'
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
      filters={['*.metadata.managedFields']}
      immutables={['PlacementBinding.0.*']}
      onEditorChange={(changes: { resources: any[] }): void => {
        update(changes?.resources)
      }}
    />
  )
}

function getWizardSyncEditor() {
  return <WizardSyncEditor />
}

export function EditPolicySet() {
  const { t } = useTranslation()
  const toast = useContext(AcmToastContext)
  const params = useParams<{ namespace: string; name: string }>()
  const { name } = params
  const history = useHistory()
  const {
    managedClusterSetBindingsState,
    managedClusterSetsState,
    managedClustersState,
    namespacesState,
    placementBindingsState,
    placementRulesState,
    placementsState,
    policySetsState,
    usePolicies,
  } = useSharedAtoms()
  const policies = usePolicies()
  const [policySets] = useRecoilState(policySetsState)
  const [namespaces] = useRecoilState(namespacesState)
  const [placements] = useRecoilState(placementsState)
  const [placementRules] = useRecoilState(placementRulesState)
  const [managedClusters] = useRecoilState(managedClustersState)
  const [placementBindings] = useRecoilState(placementBindingsState)
  const [clusterSets] = useRecoilState(managedClusterSetsState)
  const [clusterSetBindings] = useRecoilState(managedClusterSetBindingsState)
  const namespaceNames = useMemo(
    () => namespaces.map((namespace) => namespace.metadata.name ?? '').sort(),
    [namespaces]
  )
  const [existingResources, setExistingResources] = useState<IResource[]>()
  useEffect(() => {
    const policySet = policySets.find(
      (policySet) => policySet.metadata.namespace == params.namespace && policySet.metadata.name === params.name
    )
    if (policySet === undefined) {
      history.push(NavigationPath.policySets)
      return
    }
    const policySetPlacementBindings = getPlacementBindingsForResource(policySet, placementBindings)
    const policySetPlacements = getPlacementsForResource(policySet, policySetPlacementBindings, placements)
    const policySetPlacementRules = getPlacementsForResource(policySet, policySetPlacementBindings, placementRules)
    setExistingResources([policySet, ...policySetPlacements, ...policySetPlacementRules, ...policySetPlacementBindings])
  }, [history, params.name, params.namespace, placementBindings, placementRules, placements, policySets])

  if (existingResources === undefined) {
    return <LoadingPage />
  }

  return (
    <PolicySetWizard
      title={t('Edit policy set')}
      policies={policies}
      clusters={managedClusters}
      placements={placements}
      namespaces={namespaceNames}
      breadcrumb={[{ text: t('Policy sets'), to: NavigationPath.policySets }, { text: name }]}
      placementRules={placementRules}
      clusterSets={clusterSets}
      clusterSetBindings={clusterSetBindings}
      yamlEditor={getWizardSyncEditor}
      editMode={EditMode.Edit}
      resources={existingResources}
      onSubmit={(data) => {
        const resources = data as IResource[]
        return reconcileResources(resources, existingResources).then(() => {
          const policySet = resources.find((resource) => resource.kind === PolicySetKind)
          if (policySet) {
            toast.addAlert({
              title: t('Policy set updated'),
              message: t('{{name}} was successfully updated.', { name: policySet.metadata?.name }),
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
