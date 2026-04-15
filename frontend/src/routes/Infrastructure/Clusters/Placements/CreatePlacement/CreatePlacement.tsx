/* Copyright Contributors to the Open Cluster Management project */
import {
  EditorValidationStatus,
  useData,
  useEditorValidationStatus,
  useHighlightEditorPath,
  useItem,
} from '@patternfly-labs/react-form-wizard'
import { useTranslation } from '~/lib/acm-i18next'
import { SyncEditor, ValidationStatus } from '~/components/SyncEditor/SyncEditor'
import schema from './schema.json'
import { PlacementWizard } from './PlacementWizard'
import { NavigationPath } from '~/NavigationPath'
import { useRecoilValue, useSharedAtoms } from '~/shared-recoil'
import { isType } from '~/lib/is-type'
import { LostChangesContext } from '~/components/LostChanges'
import { useContext, useEffect, useState } from 'react'
import { generatePath, useNavigate } from 'react-router-dom-v5-compat'
import { reconcileResources } from '~/resources/utils'
import { AcmToastContext } from '~/ui-components'
import { IResource, Placement } from '~/resources'

export function WizardSyncEditor() {
  const resources = useItem()
  const { update } = useData()
  const { setEditorValidationStatus } = useEditorValidationStatus()
  const { highlightEditorPath } = useHighlightEditorPath()
  const { t } = useTranslation()

  return (
    <SyncEditor
      editorTitle={t('Placement YAML')}
      variant="toolbar"
      resources={resources}
      schema={schema}
      highlightEditorPath={highlightEditorPath}
      onEditorChange={(changes: { resources: any[] }): void => {
        update(changes?.resources)
      }}
      onStatusChange={(editorStatus: ValidationStatus): void => {
        setEditorValidationStatus(editorStatus as unknown as EditorValidationStatus)
      }}
      editableUidSiblings={true}
      filters={['*.metadata.managedFields']}
    />
  )
}

function getWizardSyncEditor() {
  return <WizardSyncEditor />
}

export default function CreatePlacementPage() {
  return <CreatePlacement />
}

export function CreatePlacement() {
  const { t } = useTranslation()
  const {
    namespacesState,
    managedClusterSetsState,
    managedClusterSetBindingsState,
    managedClustersState,
    placementsState,
  } = useSharedAtoms()
  const namespaces = useRecoilValue(namespacesState)
  const clusterSets = useRecoilValue(managedClusterSetsState)
  const clusterSetBindings = useRecoilValue(managedClusterSetBindingsState)
  const clusters = useRecoilValue(managedClustersState)
  const placements = useRecoilValue(placementsState)
  const availableNamespaces = namespaces.map((namespace) => namespace.metadata.name).filter(isType)

  const { cancelForm, submitForm } = useContext(LostChangesContext)
  const [createdPlacement, setCreatedPlacement] = useState<IResource>()
  const navigate = useNavigate()
  const toast = useContext(AcmToastContext)

  // Before moving to PlacementDetailPage,
  // Wait until "placements" are updated
  useEffect(() => {
    if (createdPlacement) {
      const foundPlacement = placements.find(
        (placement: Placement) =>
          placement.metadata.namespace === createdPlacement.metadata?.namespace &&
          placement.metadata.name === createdPlacement.metadata?.name
      )
      if (foundPlacement) {
        toast.addAlert({
          title: t('Placement created'),
          message: t('{{name}} was successfully created.', {
            name: foundPlacement.metadata?.name,
          }),
          type: 'success',
          autoClose: true,
        })
        navigate(
          generatePath(NavigationPath.placementDetails, {
            namespace: foundPlacement.metadata?.namespace ?? '',
            name: foundPlacement.metadata?.name ?? '',
          })
        )
        submitForm()
        setCreatedPlacement(undefined)
      }
    }
  }, [placements, createdPlacement, navigate, toast, t, submitForm])

  return (
    <PlacementWizard
      title={t('Create placement')}
      namespaces={availableNamespaces}
      clusterSets={clusterSets}
      clusterSetBindings={clusterSetBindings}
      clusters={clusters}
      yamlEditor={getWizardSyncEditor}
      onCancel={() => {
        cancelForm()
        navigate(NavigationPath.placements)
      }}
      breadcrumb={[{ text: t('Placements'), to: NavigationPath.placements }, { text: t('Create placement') }]}
      onSubmit={(data) => {
        const resources = data as IResource[]
        return reconcileResources(resources, [])
          .then(() => setCreatedPlacement(resources[0]))
          .catch((err) => {
            cancelForm()
            const reason = err?.reason ?? 'Unknown'
            const message = err?.message ?? String(err)
            toast.addAlert({
              title: t('Failed to create Placement'),
              message: t('Reason: {{reason}}. Error: {{error}}.', {
                reason,
                error: message,
              }),
              type: 'danger',
              autoClose: true,
            })
            throw err
          })
      }}
    />
  )
}
