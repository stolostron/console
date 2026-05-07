/* Copyright Contributors to the Open Cluster Management project */

import {
  EditorValidationStatus,
  useData,
  useEditorValidationStatus,
  useHighlightEditorPath,
  useItem,
} from '@patternfly-labs/react-form-wizard'
import { SyncEditor, ValidationStatus } from '~/components/SyncEditor/SyncEditor'
import { useTranslation } from '~/lib/acm-i18next'
import schema from './schema.json'
import { useSharedAtoms, useRecoilValue } from '~/shared-recoil'
import { useContext, useEffect, useState } from 'react'
import { AcmToastContext } from '~/ui-components'
import { generatePath, useParams } from 'react-router-dom-v5-compat'
import { useNavigate } from 'react-router-dom-v5-compat'
import { NavigationPath } from '~/NavigationPath'
import { LostChangesContext } from '~/components/LostChanges'
import { LoadingPage } from '~/components/LoadingPage'
import { PlacementWizard } from './PlacementWizard'
import { reconcileResources } from '~/resources/utils'
import { isType } from '~/lib/is-type'
import { IResource, PlacementKind } from '~/resources'
import { useSearchParams } from '~/lib/search'

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
      onEditorChange={(changes: { resources: any[] }): void => {
        update(changes?.resources)
      }}
      onStatusChange={(editorStatus: ValidationStatus): void => {
        setEditorValidationStatus(editorStatus as unknown as EditorValidationStatus)
      }}
      editableUidSiblings={true}
      filters={['*.metadata.managedFields']}
      immutables={['*.metadata']}
      highlightEditorPath={highlightEditorPath}
    />
  )
}

function getWizardSyncEditor() {
  return <WizardSyncEditor />
}

export function EditPlacement() {
  const { t } = useTranslation()
  const toast = useContext(AcmToastContext)
  const params = useParams()
  const { name = '', namespace = '' } = params
  const searchParams = useSearchParams()
  const navigate = useNavigate()
  const {
    namespacesState,
    placementsState,
    managedClusterSetsState,
    managedClusterSetBindingsState,
    managedClustersState,
  } = useSharedAtoms()
  const namespaces = useRecoilValue(namespacesState)
  const placements = useRecoilValue(placementsState)
  const [existingResources, setExistingResources] = useState<IResource[]>()
  const clusterSets = useRecoilValue(managedClusterSetsState)
  const clusterSetBindings = useRecoilValue(managedClusterSetBindingsState)
  const clusters = useRecoilValue(managedClustersState)
  const availableNamespaces = namespaces.map((namespace) => namespace.metadata.name).filter(isType)

  useEffect(() => {
    const placement = placements.find(
      (placement) => placement.metadata.name === name && placement.metadata.namespace === namespace
    )
    if (!placement) {
      navigate(NavigationPath.placements)
      return
    }
    setExistingResources([placement])
  }, [placements, name, namespace, navigate])

  const { cancelForm, submitForm } = useContext(LostChangesContext)

  if (existingResources === undefined) {
    return <LoadingPage />
  }

  return (
    <PlacementWizard
      title={t('Edit placement')}
      namespaces={availableNamespaces}
      clusterSets={clusterSets}
      clusterSetBindings={clusterSetBindings}
      clusters={clusters}
      yamlEditor={getWizardSyncEditor}
      resources={existingResources}
      onSubmit={(data) => {
        const resources = data as IResource[]
        return reconcileResources(resources, existingResources)
          .then(() => {
            const placement = resources.find((resource) => resource.kind === PlacementKind)
            if (placement) {
              toast.addAlert({
                title: t('Placement updated'),
                message: t('{{name}} was successfully updated.', { name: placement.metadata?.name }),
                type: 'success',
                autoClose: true,
              })
              submitForm()
              if (searchParams.get('context') === 'placements') {
                navigate(NavigationPath.placements)
              } else {
                navigate(
                  generatePath(NavigationPath.placementDetails, {
                    namespace: placement.metadata?.namespace ?? '',
                    name: placement.metadata?.name ?? '',
                  })
                )
              }
            }
          })
          .catch((err) => {
            toast.addAlert({
              title: t('Failed to update placement'),
              message: err instanceof Error ? err.message : String(err),
              type: 'danger',
            })
            throw err
          })
      }}
      onCancel={() => {
        cancelForm()
        if (searchParams.get('context') === 'placements') {
          navigate(NavigationPath.placements)
        } else {
          const placement = existingResources.find((resource) => resource.kind === PlacementKind)
          if (placement) {
            navigate(
              generatePath(NavigationPath.placementDetails, {
                namespace: placement.metadata?.namespace ?? '',
                name: placement.metadata?.name ?? '',
              })
            )
          } else {
            navigate(NavigationPath.placements)
          }
        }
      }}
      breadcrumb={[{ text: t('Placements'), to: NavigationPath.placements }, { text: name }]}
    />
  )
}
