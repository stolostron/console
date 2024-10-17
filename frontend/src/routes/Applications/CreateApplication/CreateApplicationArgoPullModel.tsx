/* Copyright Contributors to the Open Cluster Management project */

import { useData, useItem } from '@patternfly-labs/react-form-wizard'
import { ArgoWizard } from '../../../wizards/Argo/ArgoWizard'
import { AcmToastContext } from '../../../ui-components'
import moment from 'moment-timezone'
import { useContext, useEffect, useState } from 'react'
import { generatePath, useNavigate } from 'react-router-dom-v5-compat'
import { useRecoilValue, useSharedAtoms, useSharedSelectors } from '../../../shared-recoil'
import { SyncEditor } from '../../../components/SyncEditor/SyncEditor'
import { useTranslation } from '../../../lib/acm-i18next'
import { isType } from '../../../lib/is-type'
import { NavigationPath } from '../../../NavigationPath'
import {
  ApplicationSetKind,
  createResources,
  getGitChannelBranches,
  getGitChannelPaths,
  GitOpsCluster,
  IResource,
} from '../../../resources'
import { argoAppSetQueryString } from './actions'
import schema from './pullmodelschema.json'
import { LostChangesContext } from '../../../components/LostChanges'
import { LoadingPage } from '../../../components/LoadingPage'

export default function CreateArgoApplicationSetPullModelPage() {
  return <CreateApplicationArgoPullModel />
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
  const { t } = useTranslation()
  return (
    <SyncEditor
      editorTitle={t('Application set YAML')}
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

export function CreateApplicationArgoPullModel() {
  const { t } = useTranslation()
  const {
    channelsState,
    namespacesState,
    applicationSetsState,
    placementsState,
    gitOpsClustersState,
    managedClustersState,
    managedClusterSetsState,
    managedClusterSetBindingsState,
  } = useSharedAtoms()
  const navigate = useNavigate()
  const applicationSets = useRecoilValue(applicationSetsState)
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

  const currentTimeZone = moment.tz.guess(true)
  const timeZones = currentTimeZone
    ? [currentTimeZone, ...moment.tz.names().filter((e) => e !== currentTimeZone)]
    : moment.tz.names()

  const { cancelForm, submitForm } = useContext(LostChangesContext)
  const [createdResource, setCreatedResource] = useState<any>()

  // don't navigate to details page until application exists in recoil
  useEffect(() => {
    if (createdResource) {
      if (
        applicationSets.findIndex(
          (appset) =>
            appset.metadata.name === createdResource.metadata.name! &&
            appset.metadata.namespace === createdResource.metadata.namespace!
        ) !== -1
      ) {
        navigate({
          pathname: generatePath(NavigationPath.applicationOverview, {
            namespace: createdResource?.metadata?.namespace ?? '',
            name: createdResource?.metadata?.name ?? '',
          }),
          search: argoAppSetQueryString,
        })
      }
    }
  }, [applicationSets, createdResource, navigate])

  return createdResource ? (
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
        { text: t('Create application set - Pull model') },
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
      onSubmit={(data) => {
        const resources = data as IResource[]
        return createResources(resources).then(() => {
          const applicationSet = resources.find((resource) => resource.kind === ApplicationSetKind)
          if (applicationSet) {
            toast.addAlert({
              title: t('Application set created'),
              message: t('{{name}} was successfully created.', { name: applicationSet.metadata?.name }),
              type: 'success',
              autoClose: true,
            })
          }
          submitForm()
          setCreatedResource(applicationSet)
        })
      }}
      timeZones={timeZones}
      isPullModel={true}
    />
  )
}
