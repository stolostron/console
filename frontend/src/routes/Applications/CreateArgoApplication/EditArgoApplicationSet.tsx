/* Copyright Contributors to the Open Cluster Management project */

import { EditorValidationStatus, useData, useEditorValidationStatus, useItem } from '@patternfly-labs/react-form-wizard'
import { ArgoWizard } from '../../../wizards/Argo/ArgoWizard'
import { useContext, useEffect, useState } from 'react'
import { useParams, useNavigate, PathParam, generatePath } from 'react-router-dom-v5-compat'
import { useRecoilValue, useSharedAtoms, useSharedSelectors } from '../../../shared-recoil'
import { LoadingPage } from '../../../components/LoadingPage'
import { SyncEditor, ValidationStatus } from '../../../components/SyncEditor/SyncEditor'
import { useTranslation } from '../../../lib/acm-i18next'
import { isType } from '../../../lib/is-type'
import { useSearchParams } from '../../../lib/search'
import { NavigationPath } from '../../../NavigationPath'
import {
  ApplicationSet,
  ApplicationSetApiVersion,
  ApplicationSetKind,
  getGitChannelBranches,
  getGitChannelPaths,
  IResource,
  Placement,
  PlacementKind,
} from '../../../resources'
import { listResources, reconcileResources } from '../../../resources/utils'
import { AcmToastContext } from '../../../ui-components'
import { argoAppSetQueryString } from './actions'
import pushmodelschema from './pushmodelschema.json'
import { GetGitOpsClusters } from './CreateApplicationArgo'
import { get, set } from 'lodash'
import { LostChangesContext } from '../../../components/LostChanges'
import { useTimezones } from '../../../hooks/useTimezone'

export function WizardSyncEditor() {
  const resources = useItem() // Wizard framework sets this context
  const { update } = useData() // Wizard framework sets this context
  const { setEditorValidationStatus } = useEditorValidationStatus()
  const { t } = useTranslation()
  return (
    <SyncEditor
      editorTitle={t('Application set YAML')}
      variant="toolbar"
      resources={resources}
      schema={pushmodelschema}
      onEditorChange={(changes: { resources: any[] }): void => {
        update(changes?.resources)
      }}
      onStatusChange={(editorStatus: ValidationStatus): void => {
        setEditorValidationStatus(editorStatus as unknown as EditorValidationStatus)
      }}
    />
  )
}

function getWizardSyncEditor() {
  return <WizardSyncEditor />
}

export function EditArgoApplicationSet() {
  const { t } = useTranslation()
  const { timeZones } = useTimezones()
  const {
    channelsState,
    namespacesState,
    placementsState,
    gitOpsClustersState,
    managedClustersState,
    managedClusterSetsState,
    managedClusterSetBindingsState,
  } = useSharedAtoms()
  const { ansibleCredentialsValue } = useSharedSelectors()

  const navigate = useNavigate()
  const searchParams = useSearchParams()
  const toast = useContext(AcmToastContext)
  const { name = '', namespace = '' } = useParams<PathParam<NavigationPath.editApplicationArgo>>()
  const placements = useRecoilValue(placementsState)
  const gitOpsClusters = useRecoilValue(gitOpsClustersState)
  const channels = useRecoilValue(channelsState)
  const namespaces = useRecoilValue(namespacesState)
  const managedClusters = useRecoilValue(managedClustersState)
  const clusterSets = useRecoilValue(managedClusterSetsState)
  const managedClusterSetBindings = useRecoilValue(managedClusterSetBindingsState)
  const availableArgoNS = GetGitOpsClusters(gitOpsClusters)
  const availableNamespace = namespaces.map((namespace) => namespace.metadata.name).filter(isType)
  const availableAnsibleCredentials = useRecoilValue(ansibleCredentialsValue)
    .map((ansibleCredential) => ansibleCredential.metadata.name)
    .filter(isType)

  const [existingResources, setExistingResources] = useState<IResource[]>()
  const [pullModel, setPullModel] = useState<boolean>(false)
  const [applicationSets, setApplicationSets] = useState<ApplicationSet[]>()
  const [loadingAppSets, setLoadingAppSets] = useState(true)

  // instead of burdoning recoil with appsets, use old fashioned fetch
  // opening wizard may take longer, but argo wizards are probably seldom used
  useEffect(() => {
    const fetchAppSets = async () => {
      try {
        const response = await listResources<ApplicationSet>({
          apiVersion: ApplicationSetApiVersion,
          kind: ApplicationSetKind,
        }).promise
        setApplicationSets(response)
        setLoadingAppSets(false)
      } catch {
        setLoadingAppSets(false)
      }
    }
    fetchAppSets()
  }, [])

  useEffect(() => {
    if (applicationSets) {
      const applicationSet = applicationSets.find(
        (policySet) => policySet.metadata.namespace == namespace && policySet.metadata.name === name
      )

      if (
        applicationSet?.spec.template?.metadata?.annotations?.['apps.open-cluster-management.io/ocm-managed-cluster']
      ) {
        setPullModel(true)
      }
      const copyOfAppSet = JSON.parse(JSON.stringify(applicationSet))
      const sources = get(applicationSet, 'spec.template.spec.sources')?.map(
        (source: { path: string; chart: string }) => {
          if (source.path) {
            return {
              ...source,
              repositoryType: 'git',
            }
          }

          if (source.chart) {
            return { ...source, repositoryType: 'helm' }
          }

          // path is optional
          return {
            ...source,
            repositoryType: 'git',
          }
        }
      )

      if (sources) {
        set(copyOfAppSet, 'spec.template.spec.sources', sources)
      }

      if (applicationSet === undefined) {
        navigate(NavigationPath.applications)
        return
      }
      const applicationSetPlacements = placements.filter((placement) =>
        isPlacementUsedByApplicationSet(applicationSet, placement)
      )
      setExistingResources([copyOfAppSet, ...applicationSetPlacements])
    }
  }, [applicationSets, navigate, name, namespace, placements])

  const { cancelForm, submitForm } = useContext(LostChangesContext)

  if (existingResources === undefined || loadingAppSets || !applicationSets) {
    return <LoadingPage />
  }

  return (
    <ArgoWizard
      createClusterSetCallback={() => open(NavigationPath.clusterSets, '_blank')}
      ansibleCredentials={availableAnsibleCredentials}
      argoServers={availableArgoNS}
      breadcrumb={[{ text: t('Applications'), to: NavigationPath.applications }, { text: name }]}
      namespaces={availableNamespace}
      applicationSets={applicationSets}
      placements={placements}
      yamlEditor={getWizardSyncEditor}
      clusters={managedClusters}
      clusterSets={clusterSets}
      clusterSetBindings={managedClusterSetBindings}
      onCancel={() => {
        cancelForm()
        if (searchParams.get('context') === 'applicationsets') {
          navigate(NavigationPath.applications)
        } else {
          navigate({
            pathname: generatePath(NavigationPath.applicationDetails, { name, namespace }),
            search: argoAppSetQueryString,
          })
        }
      }}
      channels={channels}
      getGitRevisions={getGitChannelBranches}
      getGitPaths={getGitChannelPaths}
      onSubmit={(data) => {
        const resources = data as IResource[]
        onlyDeletePlacementsThatAreNotUsedByOtherApplicationSets(resources, existingResources, applicationSets)
        return reconcileResources(resources, existingResources).then(() => {
          const applicationSet = resources.find((resource) => resource.kind === ApplicationSetKind)
          if (applicationSet) {
            toast.addAlert({
              title: t('Application set updated'),
              message: t('{{name}} was successfully updated.', { name: applicationSet.metadata?.name }),
              type: 'success',
              autoClose: true,
            })
            submitForm()
            if (searchParams.get('context') === 'applicationsets') {
              navigate(NavigationPath.applications)
            } else {
              navigate({
                pathname: generatePath(NavigationPath.applicationDetails, {
                  namespace: applicationSet.metadata?.namespace ?? '',
                  name: applicationSet.metadata?.name ?? '',
                }),
                search: argoAppSetQueryString,
              })
            }
          }
        })
      }}
      timeZones={timeZones}
      resources={existingResources}
      isPullModel={pullModel}
    />
  )
}

function isPlacementUsedByApplicationSet(applicationSet: ApplicationSet, placement: Placement) {
  if (placement.metadata.namespace !== applicationSet.metadata.namespace) return false
  for (const generator of applicationSet.spec.generators ?? []) {
    const matchLabels = generator.clusterDecisionResource?.labelSelector?.matchLabels
    if (!matchLabels) continue
    if (matchLabels['cluster.open-cluster-management.io/placement'] === placement.metadata.name) return true
  }
  return false
}

function placementPolicySetCount(placement: Placement, applicationSets: ApplicationSet[]) {
  let count = 0
  for (const applicationSet of applicationSets) {
    if (isPlacementUsedByApplicationSet(applicationSet, placement)) count++
  }
  return count
}

function onlyDeletePlacementsThatAreNotUsedByOtherApplicationSets(
  newResources: IResource[],
  sourceResources: IResource[],
  applicationSets: ApplicationSet[]
) {
  for (const sourceResource of sourceResources) {
    if (sourceResource.kind === PlacementKind) {
      const placement = sourceResource as Placement
      if (!newResources.find((newResource) => newResource.metadata?.uid === sourceResource.metadata?.uid)) {
        if (placementPolicySetCount(placement, applicationSets) > 1) {
          newResources.push(JSON.parse(JSON.stringify(sourceResource)))
        }
      }
    }
  }
}
