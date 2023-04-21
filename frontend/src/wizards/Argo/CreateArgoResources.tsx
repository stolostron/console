/* Copyright Contributors to the Open Cluster Management project */

import { useData, useItem } from '@patternfly-labs/react-form-wizard'
import { useContext, useState } from 'react'
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
import './CreateArgoResources.css'
import { useRecoilState, useSharedAtoms } from '../../shared-recoil'

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

  const { argoCDsState } = useSharedAtoms()

  const [argoCDs] = useRecoilState(argoCDsState)

  const toast = useContext(AcmToastContext)

  const [name, setName] = useState('')
  const [namespace, setNamespace] = useState('')
  const [clusterSet, setClusterSet] = useState<string[]>(['default'])

  const argoCDsList = argoCDs.map((argoCD) => {
    const namespace = argoCD.metadata?.namespace!
    return {
      id: namespace,
      value: namespace,
    }
  })

  const clusterSetsList = clusterSets.map((clusterSet) => {
    const name = clusterSet.metadata?.name!
    const description = name === 'global' ? t('Deploy to all clusters') : clusterSet?.status?.conditions[0]?.message
    return {
      id: name,
      value: name,
      description,
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

    const managedClusterSetBindings: ManagedClusterSetBinding[] = []
    clusterSet &&
      clusterSet.forEach((clusterSet) => {
        managedClusterSetBindings.push({
          apiVersion: ManagedClusterSetBindingApiVersion,
          kind: ManagedClusterSetBindingKind,
          metadata: { name: clusterSet, namespace: namespace },
          spec: {
            clusterSet: clusterSet,
          },
        })
      })

    const placement: Placement = {
      apiVersion: PlacementApiVersionBeta,
      kind: PlacementKind,
      metadata: { name: `${name}-placement`, namespace: namespace },
      spec: {
        clusterSets: clusterSet,
      },
    }

    return [gitOpsCluster, ...managedClusterSetBindings, placement]
  }

  function stateToSyncs() {
    const syncs = [
      { path: 'GitOpsCluster[0].metadata.name' ?? '', setState: setName },
      { path: 'GitOpsCluster[0].metadata.namespace' ?? '', setState: setNamespace },
      { path: 'Placement[0].spec.clusterSets' ?? '', setState: setClusterSet },
    ]
    return syncs
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
            validation: (value) => {
              if (!argoCDsList.map((item) => item.value).includes(value)) {
                return t('The provided namespace is not a valid Argo Server namespace.')
              }
              return undefined
            },
          },
          {
            id: 'clusterset',
            type: 'Multiselect',
            label: t('ClusterSet'),
            value: clusterSet,
            onChange: setClusterSet,
            options: clusterSetsList,
            validation: (clusterSets) => {
              let msg = undefined
              const availableClusterSets = clusterSetsList.map((item) => item.value)
              clusterSets.forEach((clusterSet) => {
                if (!availableClusterSets.includes(clusterSet)) {
                  msg = t('The provided cluster sets are not valid.')
                }
              })
              return msg
            },
          },
        ],
      },
    ],
    submit: () => {
      const createData = stateToData()
      return reconcileResources(createData, []).then(() => {
        toast.addAlert({
          title: t('GitOpsCluster created'),
          message: t('{{namespace}} has been successfully added to Argo server.', { namespace }),
          type: 'success',
          autoClose: true,
        })

        handleModalToggle()
      })
    },
    submitText: t('Add'),
    submittingText: t('Adding'),
    reviewTitle: t('Review'),
    reviewDescription: t('Review and create'),
    nextLabel: t('Next'),
    backLabel: t('Back'),
    cancelLabel: t('Cancel'),
    cancel: handleModalToggle,
    stateToData,
    stateToSyncs,
  }

  return <AcmDataFormPage formData={formData} mode={'form'} editorTitle={t('GitOpsCluster YAML')} schema={schema} />
}
