/* Copyright Contributors to the Open Cluster Management project */

import { EditorValidationStatus, useData, useEditorValidationStatus, useItem } from '@patternfly-labs/react-form-wizard'
import { ArgoWizard, setRepositoryTypeForSources } from '../../../wizards/Argo/ArgoWizard'
import { AcmToastContext } from '../../../ui-components'
import { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom-v5-compat'
import { useRecoilValue, useSharedAtoms, useSharedSelectors } from '../../../shared-recoil'
import { SyncEditor, ValidationStatus } from '../../../components/SyncEditor/SyncEditor'
import { useTranslation } from '../../../lib/acm-i18next'
import { isType } from '../../../lib/is-type'
import { NavigationPath } from '../../../NavigationPath'
import {
  ApplicationSet,
  ApplicationSetApiVersion,
  ApplicationSetKind,
  getGitChannelBranches,
  getGitChannelPaths,
  GitOpsCluster,
  IResource,
} from '../../../resources'
import { listResources } from '../../../resources/utils'
import { createArgoResources } from './createArgoResources'
import pushmodelschema from './pushmodelschema.json'
import { LostChangesContext } from '../../../components/LostChanges'
import { LoadingPage } from '../../../components/LoadingPage'
import { useTimezones } from '../../../hooks/useTimezone'

export default function CreateArgoApplicationSetPage() {
  return <CreateApplicationArgo />
}

export function GetGitOpsClusters(gitOpsClusters: GitOpsCluster[]) {
  return gitOpsClusters
    .map((gitOpsCluster) => {
      const description = `name: ${gitOpsCluster.metadata.name}; namespace: ${gitOpsCluster.metadata.namespace}`
      const name = gitOpsCluster.spec?.argoServer?.argoNamespace!
      return { value: gitOpsCluster, label: name, description: description }
    })
    .filter(isType)
}

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
        update(setRepositoryTypeForSources(changes?.resources))
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

export function CreateApplicationArgo() {
  const { t } = useTranslation()
  const {
    channelsState,
    namespacesState,
    placementsState,
    gitOpsClustersState,
    managedClustersState,
    managedClusterSetsState,
    managedClusterSetBindingsState,
  } = useSharedAtoms()
  const navigate = useNavigate()
  const { timeZones } = useTimezones()
  const toast = useContext(AcmToastContext)
  const placements = useRecoilValue(placementsState)
  const gitOpsClusters = useRecoilValue(gitOpsClustersState)
  const channels = useRecoilValue(channelsState)
  const namespaces = useRecoilValue(namespacesState)
  const managedClusters = useRecoilValue(managedClustersState)
  const clusterSets = useRecoilValue(managedClusterSetsState)
  const managedClusterSetBindings = useRecoilValue(managedClusterSetBindingsState)
  const { ansibleCredentialsValue } = useSharedSelectors()

  const availableArgoNS = GetGitOpsClusters(gitOpsClusters)
  const availableNamespace = namespaces.map((namespace) => namespace.metadata.name).filter(isType)
  const availableAnsibleCredentials = useRecoilValue(ansibleCredentialsValue)
    .map((ansibleCredential) => ansibleCredential.metadata.name)
    .filter(isType)

  const { cancelForm, submitForm } = useContext(LostChangesContext)
  const [applicationSets, setApplicationSets] = useState<ApplicationSet[]>()
  const [loadingAppSets, setLoadingAppSets] = useState(true)

  // instead of burdoning recoil with appsets, use old fashioned fetch
  // opening wizard may take longer, but the longer the wait the more likelihood
  // user is creating appsets with the cli and not this wizard
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

  return loadingAppSets ? (
    <LoadingPage />
  ) : (
    <ArgoWizard
      createClusterSetCallback={() => open(NavigationPath.clusterSets, '_blank')}
      ansibleCredentials={availableAnsibleCredentials}
      argoServers={availableArgoNS}
      namespaces={availableNamespace}
      applicationSets={applicationSets}
      placements={placements}
      breadcrumb={[
        { text: t('Applications'), to: NavigationPath.applications },
        { text: t('Create application set - push model') },
      ]}
      clusters={managedClusters}
      clusterSets={clusterSets}
      clusterSetBindings={managedClusterSetBindings}
      channels={channels}
      getGitRevisions={getGitChannelBranches}
      getGitPaths={getGitChannelPaths}
      yamlEditor={getWizardSyncEditor}
      onCancel={() => {
        cancelForm()
        navigate(NavigationPath.applications)
      }}
      onSubmit={(data) =>
        createArgoResources({
          resources: data as IResource[],
          toast,
          t,
          submitForm,
          navigate,
        })
      }
      timeZones={timeZones}
    />
  )
}
