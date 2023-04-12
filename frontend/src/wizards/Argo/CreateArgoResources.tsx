/* Copyright Contributors to the Open Cluster Management project */

import { Select, Step, Sync, useData, useItem, WizItemSelector, WizTextInput } from '@patternfly-labs/react-form-wizard'
import { useContext } from 'react'
import { SyncEditor } from '../../components/SyncEditor/SyncEditor'
import { useTranslation } from '../../lib/acm-i18next'
import {
  createResources,
  GitOpsClusterApiVersion,
  GitOpsClusterKind,
  IResource,
  ManagedClusterSetBindingApiVersion,
  ManagedClusterSetBindingKind,
  PlacementApiVersionBeta,
  PlacementKind,
} from '../../resources'
import { AcmToastContext } from '../../ui-components'
import { PlacementType } from '../common/resources/IPlacement'
import { WizardPage } from '../WizardPage'
import schema from './schema.json'

export interface ICreateArgoResourcesModalProps {
  handleModalToggle: () => void
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

export function CreateArgoResources(props: ICreateArgoResourcesModalProps) {
  const { t } = useTranslation()
  const { handleModalToggle } = props

  const toast = useContext(AcmToastContext)

  return (
    <WizardPage
      id="application-set-wizard"
      title={t('Add Argo Server')}
      description={t(
        'Argo Server exposes an API and UI for workflows. You can run this in either "hosted" or "local" mode. '
      )}
      yamlEditor={getWizardSyncEditor}
      defaultData={[
        {
          apiVersion: GitOpsClusterApiVersion,
          kind: GitOpsClusterKind,
          metadata: { name: '', namespace: '' },
          spec: {
            argoServer: {
              argoNamespace: '',
            },
            placementRef: {
              kind: PlacementKind,
              apiVersion: PlacementApiVersionBeta,
              name: '',
            },
          },
        },
        {
          apiVersion: ManagedClusterSetBindingApiVersion,
          kind: ManagedClusterSetBindingKind,
          metadata: { name: '', namespace: '' },
          spec: {
            clusterSet: '',
          },
        },
        {
          ...PlacementType,
          metadata: { name: '', namespace: '' },
          spec: {
            clusterSets: [],
          },
        },
      ]}
      onCancel={handleModalToggle}
      onSubmit={(data) => {
        const resources = data as IResource[]
        return createResources(resources).then(() => {
          const gitOpsCluster = resources.find((resource) => resource.kind === GitOpsClusterKind)
          if (gitOpsCluster) {
            toast.addAlert({
              title: t('Argo Server created'),
              message: t('{{name}} was successfully created.', { name: gitOpsCluster.metadata?.name }),
              type: 'success',
              autoClose: true,
            })
          }
          handleModalToggle()
        })
      }}
    >
      <Step id="general" label={t('General')}>
        {/* sync values to different fields */}
        <Sync
          kind={GitOpsClusterKind}
          path="metadata.name"
          targetKind={PlacementKind}
          targetPath="metadata.name"
          suffix="-placement"
        />
        <Sync
          kind={GitOpsClusterKind}
          path="metadata.name"
          targetKind={GitOpsClusterKind}
          targetPath="spec.placementRef.name"
          suffix="-placement"
        />
        <Sync
          kind={ManagedClusterSetBindingKind}
          path="metadata.name"
          targetKind={ManagedClusterSetBindingKind}
          targetPath="spec.clusterSet"
        />
        <Sync
          kind={ManagedClusterSetBindingKind}
          path="metadata.name"
          targetKind={PlacementKind}
          targetPath="spec.clusterSets.0"
        />
        <Sync
          kind={ManagedClusterSetBindingKind}
          path="metadata.namespace"
          targetKind={PlacementKind}
          targetPath="metadata.namespace"
        />
        <Sync
          kind={ManagedClusterSetBindingKind}
          path="metadata.namespace"
          targetKind={GitOpsClusterKind}
          targetPath="metadata.namespace"
        />
        <Sync
          kind={ManagedClusterSetBindingKind}
          path="metadata.namespace"
          targetKind={GitOpsClusterKind}
          targetPath="spec.argoServer.argoNamespace"
        />
        <WizItemSelector selectKey="kind" selectValue={GitOpsClusterKind}>
          <WizTextInput
            path="metadata.name"
            label={t('Name')}
            placeholder={t('Enter the GitOpsCluster name')}
            required
            id="name"
            // validation={validateAppSetName}
          />
        </WizItemSelector>

        <WizItemSelector selectKey="kind" selectValue="ManagedClusterSetBinding">
          <Select
            path="metadata.name"
            label={t('ClusterSet')}
            placeholder={t('Select the clusterSet')}
            options={['default']}
            required
          />
          <Select
            path="metadata.namespace"
            label={t('Namespace')}
            placeholder={t('Select the namespace')}
            options={['openshift-gitops']}
            required
          />
        </WizItemSelector>
      </Step>
    </WizardPage>
  )
}
