/* Copyright Contributors to the Open Cluster Management project */
import { EditMode, useData, useItem } from '@patternfly-labs/react-form-wizard'
import { PolicyWizard } from '../../../wizards/Governance/Policy/PolicyWizard'
import { useContext, useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate, generatePath } from 'react-router-dom-v5-compat'
import { useRecoilValue, useSharedAtoms } from '../../../shared-recoil'
import { LoadingPage } from '../../../components/LoadingPage'
import { SyncEditor } from '../../../components/SyncEditor/SyncEditor'
import { useTranslation } from '../../../lib/acm-i18next'
import { useSearchParams } from '../../../lib/search'
import { NavigationPath } from '../../../NavigationPath'
import { IResource, PolicyKind, reconcileResources } from '../../../resources'
import { AcmToastContext } from '../../../ui-components'
import {
  getPlacementBindingsForResource,
  getPlacementsForResource,
  resolveExternalStatus,
  resolveSource,
} from '../common/util'
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

export function EditPolicy() {
  const { t } = useTranslation()
  const toast = useContext(AcmToastContext)
  const params = useParams()
  const { name = '' } = params
  const navigate = useNavigate()
  const {
    channelsState,
    helmReleaseState,
    managedClusterSetBindingsState,
    managedClusterSetsState,
    managedClustersState,
    namespacesState,
    placementBindingsState,
    placementRulesState,
    placementsState,
    subscriptionsState,
    usePolicies,
  } = useSharedAtoms()
  const policies = usePolicies()
  const namespaces = useRecoilValue(namespacesState)
  const placements = useRecoilValue(placementsState)
  const placementRules = useRecoilValue(placementRulesState)
  const managedClusters = useRecoilValue(managedClustersState)
  const placementBindings = useRecoilValue(placementBindingsState)
  const clusterSets = useRecoilValue(managedClusterSetsState)
  const clusterSetBindings = useRecoilValue(managedClusterSetBindingsState)
  const namespaceNames = useMemo(
    () =>
      namespaces
        .filter((namespace) => !namespace.metadata.labels?.['cluster.open-cluster-management.io/managedCluster'])
        .map((namespace) => namespace.metadata.name ?? '')
        .sort(),
    [namespaces]
  )
  const [existingResources, setExistingResources] = useState<IResource[]>()
  const helmReleases = useRecoilValue(helmReleaseState)
  const subscriptions = useRecoilValue(subscriptionsState)
  const channels = useRecoilValue(channelsState)
  const [gitSource, setGitSource] = useState('')
  const searchParams = useSearchParams()

  useEffect(() => {
    const policy = policies.find(
      (policySet) => policySet.metadata.namespace == params.namespace && policySet.metadata.name === params.name
    )
    if (policy === undefined) {
      navigate(NavigationPath.policies)
      return
    }
    const policyPlacementBindings = getPlacementBindingsForResource(policy, placementBindings)
    const policyPlacements = getPlacementsForResource(policy, policyPlacementBindings, placements)
    const policyPlacementRules = getPlacementsForResource(policy, policyPlacementBindings, placementRules)

    const isExternal = resolveExternalStatus(policy)
    if (isExternal) {
      const policySource = resolveSource(policy, helmReleases, channels, subscriptions)
      setGitSource(policySource?.pathName ?? '')
    }

    setExistingResources([policy, ...policyPlacements, ...policyPlacementRules, ...policyPlacementBindings])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { cancelForm, submitForm } = useContext(LostChangesContext)

  if (existingResources === undefined) {
    return <LoadingPage />
  }

  return (
    <PolicyWizard
      title={t('Edit policy')}
      policies={policies}
      clusters={managedClusters}
      placements={placements}
      yamlEditor={getWizardSyncEditor}
      namespaces={namespaceNames}
      placementRules={placementRules}
      clusterSets={clusterSets}
      clusterSetBindings={clusterSetBindings}
      breadcrumb={[{ text: t('Policies'), to: NavigationPath.policies }, { text: name }]}
      editMode={EditMode.Edit}
      resources={existingResources}
      gitSource={gitSource}
      onSubmit={(data) => {
        const resources = data as IResource[]
        return reconcileResources(resources, existingResources).then(() => {
          const policy = resources.find((resource) => resource.kind === PolicyKind)
          if (policy) {
            toast.addAlert({
              title: t('Policy updated'),
              message: t('{{name}} was successfully updated.', { name: policy.metadata?.name }),
              type: 'success',
              autoClose: true,
            })
            submitForm()
            if (searchParams.get('context') === 'policies') {
              navigate(NavigationPath.policies)
            } else {
              navigate(
                generatePath(NavigationPath.policyDetails, {
                  namespace: policy.metadata?.namespace ?? '',
                  name: policy.metadata?.name ?? '',
                })
              )
            }
          }
        })
      }}
      onCancel={() => {
        cancelForm()
        if (searchParams.get('context') === 'policies') {
          navigate(NavigationPath.policies)
        } else {
          const policy = existingResources.find((resource) => resource.kind === PolicyKind)
          if (policy) {
            navigate(
              generatePath(NavigationPath.policyDetails, {
                namespace: policy.metadata?.namespace ?? '',
                name: policy.metadata?.name ?? '',
              })
            )
          } else {
            navigate(NavigationPath.policies)
          }
        }
      }}
    />
  )
}
