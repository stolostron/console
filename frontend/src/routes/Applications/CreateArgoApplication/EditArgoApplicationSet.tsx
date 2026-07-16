/* Copyright Contributors to the Open Cluster Management project */

import {
  EditorValidationStatus,
  useData,
  useDefaultItem,
  useEditorValidationStatus,
  useHighlightEditorPath,
  useItem,
} from '@patternfly-labs/react-form-wizard'
import { ArgoWizard } from '~/wizards/Argo/ArgoWizard'
import { useContext, useEffect, useState } from 'react'
import { useRecoilValue, useSharedAtoms, useSharedSelectors } from '~/shared-recoil'
import { LoadingPage } from '~/components/LoadingPage'
import { SyncEditor, ValidationStatus } from '~/components/SyncEditor/SyncEditor'
import { useTranslation } from '~/lib/acm-i18next'
import { isType } from '~/lib/is-type'
import { NavigationPath } from '~/NavigationPath'
import {
  ApplicationSet,
  ApplicationSetApiVersion,
  ApplicationSetKind,
  getGitChannelBranches,
  getGitChannelPaths,
  IResource,
  Placement,
  PlacementKind,
} from '~/resources'
import { listResources, reconcileResources } from '~/resources/utils'
import { AcmToastContext } from '~/ui-components'
import pushmodelschema from './pushmodelschema.json'
import { GetGitOpsClusters } from './CreatePushApplicationSet'
import { get, set } from 'lodash'
import { LostChangesContext } from '~/components/LostChanges'
import { useTimezones } from '~/hooks/useTimezone'

export function WizardSyncEditor() {
  const resources = useItem() // Wizard framework sets this context
  const defaultItem = useDefaultItem()
  const { update } = useData() // Wizard framework sets this context
  const { setEditorValidationStatus } = useEditorValidationStatus()
  const { highlightEditorPath } = useHighlightEditorPath()
  const { t } = useTranslation()
  return (
    <SyncEditor
      editorTitle={t('Application set YAML')}
      variant="toolbar"
      resources={resources}
      defaultResources={defaultItem}
      schema={pushmodelschema}
      filters={['*.metadata.managedFields']}
      highlightEditorPath={highlightEditorPath}
      onEditorChange={(changes, resetDefaultSnapshot): void => {
        update(changes?.resources, resetDefaultSnapshot)
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

export interface EditArgoApplicationSetProps {
  name: string
  namespace: string
  onCancel: () => void
  onSubmitSuccess: (applicationSet: ApplicationSet) => void
  onApplicationSetNotFound: () => void
  isModal?: boolean
  showWizardInput?: string
}

export function EditArgoApplicationSet({
  name,
  namespace,
  onCancel,
  onSubmitSuccess,
  onApplicationSetNotFound,
  isModal = false,
}: EditArgoApplicationSetProps) {
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
    secretsState,
  } = useSharedAtoms()
  const { ansibleCredentialsValue } = useSharedSelectors()
  const secrets = useRecoilValue(secretsState)
  const toast = useContext(AcmToastContext)
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
      const sources = get(applicationSet, 'spec.template.spec.sources')?.map((source: any) => {
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
      })

      if (sources) {
        set(copyOfAppSet, 'spec.template.spec.sources', sources)
      }

      if (applicationSet === undefined) {
        onApplicationSetNotFound()
        return
      }
      const applicationSetPlacements = placements.filter((placement) =>
        isPlacementUsedByApplicationSet(applicationSet, placement)
      )
      setExistingResources([copyOfAppSet, ...applicationSetPlacements])
    }
  }, [applicationSets, name, namespace, onApplicationSetNotFound, placements])

  const { cancelForm, submitForm } = useContext(LostChangesContext)

  const content =
    existingResources === undefined || loadingAppSets || !applicationSets ? (
      <LoadingPage />
    ) : (
      <ArgoWizard
        createClusterSetCallback={() => open(NavigationPath.clusterSets, '_blank')}
        ansibleCredentials={availableAnsibleCredentials}
        argoServers={availableArgoNS}
        breadcrumb={[{ text: t('Applications'), to: NavigationPath.applications }, { text: name }]}
        namespaces={availableNamespace}
        applicationSets={applicationSets}
        placements={placements}
        yamlEditor={isModal ? undefined : getWizardSyncEditor}
        clusters={managedClusters}
        clusterSets={clusterSets}
        clusterSetBindings={managedClusterSetBindings}
        isModal={isModal}
        onCancel={() => {
          cancelForm()
          onCancel()
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
              onSubmitSuccess(applicationSet as ApplicationSet)
            }
          })
        }}
        timeZones={timeZones}
        resources={existingResources}
        isPullModel={pullModel}
        repoSecrets={secrets}
      />
    )

  if (isModal) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          maxHeight: '100%',
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        {content}
      </div>
    )
  }

  return content
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
