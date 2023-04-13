/* Copyright Contributors to the Open Cluster Management project */

import { useData, useItem } from '@patternfly-labs/react-form-wizard'
import { useContext, useState } from 'react'
import { useRecoilState } from 'recoil'
import { argoCDsState } from '../../atoms'
import { AcmDataFormPage } from '../../components/AcmDataForm'
import { FormData } from '../../components/AcmFormData'
import { SyncEditor } from '../../components/SyncEditor/SyncEditor'
import { useTranslation } from '../../lib/acm-i18next'
import {
  GitOpsCluster,
  GitOpsClusterApiVersion,
  GitOpsClusterKind,
  ManagedClusterSetBinding,
  ManagedClusterSetBindingApiVersion,
  ManagedClusterSetBindingKind,
  Placement,
  PlacementApiVersionBeta,
  PlacementKind,
  reconcileResources,
} from '../../resources'
import { AcmToastContext } from '../../ui-components'
import { IResource } from '../common/resources/IResource'
import schema from './schema.json'

export interface ICreateArgoResourcesModalProps {
  handleModalToggle: () => void
  clusterSets: IResource[]
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

export function CreateArgoResources(props: ICreateArgoResourcesModalProps) {
  const { t } = useTranslation()
  const { handleModalToggle, clusterSets } = props

  const [argoCDs] = useRecoilState(argoCDsState)

  const toast = useContext(AcmToastContext)

  const [name, setName] = useState('')
  const [namespace, setNamespace] = useState('')
  const [clusterSet, setClusterSet] = useState('default')

  const argoCDsList = argoCDs.map((argoCD) => {
    const namespace = argoCD.metadata?.namespace!
    return {
      id: namespace,
      value: namespace,
    }
  })

  function stateToData() {
    const gitOpsCluster: GitOpsCluster = {
      apiVersion: GitOpsClusterApiVersion,
      kind: GitOpsClusterKind,
      metadata: { name, namespace },
      spec: {
        argoServer: {
          argoNamespace: namespace,
        },
        placementRef: {
          kind: PlacementKind,
          apiVersion: PlacementApiVersionBeta,
          name: `${name}-placement`,
        },
      },
    }

    const managedClusterSetBinding: ManagedClusterSetBinding = {
      apiVersion: ManagedClusterSetBindingApiVersion,
      kind: ManagedClusterSetBindingKind,
      metadata: { name: clusterSet, namespace: namespace },
      spec: {
        clusterSet: clusterSet,
      },
    }

    const placement: Placement = {
      apiVersion: PlacementApiVersionBeta,
      kind: PlacementKind,
      metadata: { name: `${name}-placement`, namespace: namespace },
      spec: {
        clusterSets: [clusterSet],
      },
    }

    return [gitOpsCluster, managedClusterSetBinding, placement]
  }
  const formData: FormData = {
    title: t('Add Argo Server'),
    description: t(
      'Argo Server exposes an API and UI for workflows. You can run this in either "hosted" or "local" mode. '
    ),
    sections: [
      {
        type: 'Section',
        title: '',
        inputs: [
          {
            id: 'Text',
            type: 'Text',
            label: t('Name'),
            placeholder: t('Enter the name'),
            value: name,
            onChange: setName,
            isRequired: true,
          },
          {
            id: 'namespace',
            type: 'Select',
            label: t('Namespace'),
            placeholder: t('Select the namespace'),
            value: namespace,
            onChange: setNamespace,
            isRequired: true,
            options: argoCDsList,
          },
          {
            id: 'clusterset',
            type: 'Select',
            label: t('ClusterSet'),
            placeholder: t('Select the cluster set'),
            value: clusterSet,
            onChange: setClusterSet,
            isRequired: true,
            options: clusterSets.map((clusterSet) => {
              const name = clusterSet.metadata?.name!
              return {
                id: name,
                value: name,
              }
            }),
          },
        ],
      },
    ],
    submit: () => {
      let createData = stateToData()
      return reconcileResources(createData, []).then(() => {
        toast.addAlert({
          title: t('GitOpsCluster created'),
          message: t('{{namespace}} has been successfully added to Argo server.', { namespace }),
          type: 'success',
          autoClose: true,
        })

        // if (newCredentialCallback) {
        //   newCredentialCallback(credentialData)
        // }

        handleModalToggle()
      })
    },
    submitText: t('Add'),
    submittingText: t('Adding'),
    reviewTitle: 'Review',
    reviewDescription: 'Review description',
    nextLabel: 'Next',
    backLabel: 'Back',
    cancelLabel: 'Cancel',
    cancel: handleModalToggle,
    stateToData,
  }

  return <AcmDataFormPage formData={formData} mode={'form'} editorTitle={t('GitOpsCluster YAML')} schema={schema} />
}
