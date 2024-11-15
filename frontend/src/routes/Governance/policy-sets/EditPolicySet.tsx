/* Copyright Contributors to the Open Cluster Management project */
import { EditMode, useData, useItem } from '@patternfly-labs/react-form-wizard'
import { IResource, PolicySetKind } from '../../../resources'
import { PathParam, useNavigate, useParams } from 'react-router-dom-v5-compat'
import { getPlacementBindingsForResource, getPlacementsForResource } from '../common/util'
import { useContext, useEffect, useMemo, useState } from 'react'
import { useRecoilValue, useSharedAtoms } from '../../../shared-recoil'

import { AcmToastContext } from '../../../ui-components'
import { LoadingPage } from '../../../components/LoadingPage'
import { LostChangesContext } from '../../../components/LostChanges'
import { NavigationPath } from '../../../NavigationPath'
import { PolicySetWizard } from '../../../wizards/Governance/PolicySet/PolicySetWizard'
import { SyncEditor } from '../../../components/SyncEditor/SyncEditor'
import { reconcileResources } from '../../../resources/utils'
import schema from './schema.json'
import { useTranslation } from '../../../lib/acm-i18next'

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
  const { name = '', namespace = '' } = useParams<PathParam<NavigationPath.editPolicySet>>()
  const navigate = useNavigate()
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
  const policySets = useRecoilValue(policySetsState)
  const namespaces = useRecoilValue(namespacesState)
  const placements = useRecoilValue(placementsState)
  const placementRules = useRecoilValue(placementRulesState)
  const managedClusters = useRecoilValue(managedClustersState)
  const placementBindings = useRecoilValue(placementBindingsState)
  const clusterSets = useRecoilValue(managedClusterSetsState)
  const clusterSetBindings = useRecoilValue(managedClusterSetBindingsState)
  const namespaceNames = useMemo(
    () => namespaces.map((namespace) => namespace.metadata.name ?? '').sort(),
    [namespaces]
  )
  const [existingResources, setExistingResources] = useState<IResource[]>()
  useEffect(() => {
    const policySet = policySets.find(
      (policySet) => policySet.metadata.namespace == namespace && policySet.metadata.name === name
    )
    if (policySet === undefined) {
      navigate(NavigationPath.policySets)
      return
    }
    const policySetPlacementBindings = getPlacementBindingsForResource(policySet, placementBindings)
    const policySetPlacements = getPlacementsForResource(policySet, policySetPlacementBindings, placements)
    const policySetPlacementRules = getPlacementsForResource(policySet, policySetPlacementBindings, placementRules)
    setExistingResources([policySet, ...policySetPlacements, ...policySetPlacementRules, ...policySetPlacementBindings])
  }, [navigate, name, namespace, placementBindings, placementRules, placements, policySets])

  const { cancelForm, submitForm } = useContext(LostChangesContext)

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
          submitForm()
          navigate(NavigationPath.policySets)
        })
      }}
      onCancel={() => {
        cancelForm()
        navigate(NavigationPath.policySets)
      }}
    />
  )
}
