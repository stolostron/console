/* Copyright Contributors to the Open Cluster Management project */
import { useCallback, useContext, useEffect, useState } from 'react'
import { generatePath, useNavigate } from 'react-router-dom-v5-compat'
import { AcmDataFormPage } from '../../components/AcmDataForm'
import { FormData } from '../../components/AcmFormData'
import { LostChangesContext } from '../../components/LostChanges'
import { useTranslation } from '../../lib/acm-i18next'
import { NavigationPath, useBackCancelNavigation } from '../../NavigationPath'
import {
  IResource
} from '../../resources'
import { AccessControl, AccessControlApiVersion, AccessControlKind } from '../../resources/access-control'
import { createResource, patchResource } from '../../resources/utils'
import {
  AcmToastContext
} from '../../ui-components'
import { useAllClusters } from '../Infrastructure/Clusters/ManagedClusters/components/useAllClusters'
import schema from './schema.json'

const AccessControlManagementForm = (
  { isEditing, isViewing, handleModalToggle, hideYaml, accessControl }: {
    isEditing: boolean
    isViewing: boolean
    handleModalToggle?: () => void
    hideYaml?: boolean
    accessControl?: AccessControl
  }
) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { back, cancel } = useBackCancelNavigation()
  const toastContext = useContext(AcmToastContext)

  // Data
  const managedClusters = useAllClusters(true)

  // Form Values
  const [cluster, setCluster] = useState('')
  const { submitForm } = useContext(LostChangesContext)

  useEffect(() => {
    setCluster(accessControl?.data?.cluster ?? '')
  }, [accessControl?.data])

  const { cancelForm } = useContext(LostChangesContext)
  const guardedHandleModalToggle = useCallback(() => cancelForm(handleModalToggle), [cancelForm, handleModalToggle])

  const stateToData = () => ({
    apiVersion: AccessControlApiVersion,
    kind: AccessControlKind,
    type: 'Opaque',
    metadata: {
      name: 'tbd', //TODO: proper name and namespace
      namespace: 'tbd',
    },
    data: {
      id: '',
      namespaces: [],
      cluster: cluster,
      roles: [],
      creationTimestamp: ''
    },
  })

  const stateToSyncs = () => [
    { path: 'AccessControl[0].data.cluster', setState: setCluster },
  ]

  const title = isViewing ? accessControl?.data?.id! : isEditing ? t('Edit access control') : t('Add access control')
  const breadcrumbs = [{ text: t('Access Controls'), to: NavigationPath.accessControlManagement }, { text: title }]

  const formData: FormData = {
    title,
    description: t('An access control stores the... TO BE DEFINED'),
    breadcrumb: breadcrumbs,
    sections: [
      {
        type: 'Section',
        title: t('Basic information'),
        wizardTitle: t('Enter the basic Access Control information'),
        inputs: [
          {
            id: 'cluster',
            type: 'Select',
            label: t('Cluster'),
            value: cluster,
            onChange: setCluster,
            options: managedClusters.map(cluster => ({
              id: cluster.name,
              value: cluster.name,
              text: cluster.name,
            })),
            isRequired: true,
            isDisabled: false
          },
        ],
      }
    ],
    submit: () => {
      let accessControlData = formData?.customData ?? stateToData()
      if (Array.isArray(accessControlData)) {
        accessControlData = accessControlData[0]
      }
      if (isEditing) {
        const accessControl = accessControlData as AccessControl
        const patch: { op: 'replace'; path: string; value: unknown }[] = []
        const data: AccessControl['data'] = { ...accessControl.data!, cluster } // TODO: the rest of fields
        patch.push({ op: 'replace', path: `/data`, value: data })
        return patchResource(accessControl, patch).promise.then(() => {
          toastContext.addAlert({
            title: t('Acccess Control updated'),
            message: t('accessControlForm.updated.message', { id: data.id }),
            type: 'success',
            autoClose: true,
          })
          submitForm()
          navigate(NavigationPath.accessControlManagement)
        })
      } else {
        return createResource(accessControlData as IResource).promise.then((resource) => {
          toastContext.addAlert({
            title: t('Access Control created'),
            message: t('accessControlForm.created.message', { id: (resource as AccessControl).data?.id }),
            type: 'success',
            autoClose: true,
          })
          submitForm()

          if (handleModalToggle) {
            handleModalToggle()
          } else {
            navigate(NavigationPath.accessControlManagement)
          }
        })
      }
    },
    submitText: isEditing ? t('Save') : t('Add'),
    submittingText: isEditing ? t('Saving') : t('Adding'),
    reviewTitle: t('Review your selections'),
    reviewDescription: t('Return to a step to make changes'),
    cancelLabel: t('Cancel'),
    nextLabel: t('Next'),
    backLabel: t('Back'),
    back: handleModalToggle ? guardedHandleModalToggle : back(NavigationPath.accessControlManagement),
    cancel: handleModalToggle ? guardedHandleModalToggle : cancel(NavigationPath.accessControlManagement),
    stateToSyncs,
    stateToData,
  }

  return (
    <AcmDataFormPage
      formData={formData}
      editorTitle={t('Access Control YAML')}
      schema={schema}
      mode={isViewing ? 'details' : isEditing ? 'form' : 'wizard'}
      hideYaml={hideYaml}
      secrets={[]}
      immutables={
        isEditing
          ? ['*.metadata.name', '*.metadata.namespace', '*.data.id', '*.data.creationTimestamp']
          : []
      }
      edit={() => navigate(
        generatePath(NavigationPath.editAccessControlManagement, {
          id: accessControl?.data?.id!,
        })
      )}
      isModalWizard={!!handleModalToggle}
    />
  )
}

export { AccessControlManagementForm }
