/* Copyright Contributors to the Open Cluster Management project */

import { Title } from '@patternfly/react-core'
import { useContext } from 'react'
import { ProjectCreateForm, ProjectFormData } from '../../components/project'
import { useTranslation } from '../../lib/acm-i18next'
import { fireManagedClusterAction, ProjectRequestApiVersion, ProjectRequestKind } from '../../resources'
import type { Cluster } from '../../routes/UserManagement/RoleAssignments/hook/RoleAssignmentDataHook'
import { AcmToastContext } from '../../ui-components'
interface CommonProjectCreateProps {
  /** Callback function called when the cancel button is clicked */
  onCancelCallback: () => void
  /** Optional callback function called when the project is successfully created */
  onSuccess?: () => void
  /** Optional callback function called when project creation fails */
  onError?: (error: Error) => void
  /** Selected clusters to create the common project on */
  selectedClusters: Cluster[]
}

export function CommonProjectCreate({
  onCancelCallback,
  onSuccess,
  onError,
  selectedClusters,
}: CommonProjectCreateProps) {
  const { t } = useTranslation()
  const toastContext = useContext(AcmToastContext)

  const handleError = (projectName: string, clusterName: string, errorMessage: string) =>
    toastContext.addAlert({
      title: t('Failed to create common project'),
      message: t('Failed to create common project {{name}} for the cluster {{cluster}}. Error: {{error}}.', {
        name: projectName,
        cluster: clusterName,
        error: errorMessage,
      }),
      type: 'danger',
    })

  const handleSubmit = async (data: ProjectFormData) => {
    const kubeResourcePayload = {
      apiVersion: ProjectRequestApiVersion,
      kind: ProjectRequestKind,
      metadata: { name: data.name },
      displayName: data.displayName || undefined,
      description: data.description || undefined,
    }
    try {
      await Promise.all(
        selectedClusters.map((cluster) =>
          // createManagedClusterAction(cluster.name, {
          //   apiVersion: ProjectRequestApiVersion,
          //   kind: ProjectRequestKind,
          //   metadata: { name: data.name },
          //   displayName: data.displayName || undefined,
          //   description: data.description || undefined,
          // })
          fireManagedClusterAction(
            'Create',
            cluster.name,
            ProjectRequestKind,
            ProjectRequestApiVersion,
            data.name,
            data.name,
            kubeResourcePayload
          )
            .then(async (actionResponse) => {
              if (actionResponse.actionDone === 'ActionDone') {
                toastContext.addAlert({
                  title: t('Common project created'),
                  message: t('{{name}} project has been successfully created for the cluster {{cluster}.', {
                    name: data.name,
                    cluster: cluster.name,
                  }),
                  type: 'success',
                  autoClose: true,
                })
              } else {
                handleError(data.name, cluster.name, actionResponse.message)
                throw new Error(actionResponse.message)
              }
            })
            .catch((err) => {
              handleError(data.name, cluster.name, err.message)
              throw err
            })
        )
      )
      onSuccess?.()
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('Failed to create project')
      onError?.(errorObj)
    }
  }

  return (
    <div>
      <Title headingLevel="h1" size="lg" style={{ marginBottom: '1rem' }}>
        {t('Create common project')}
      </Title>
      <ProjectCreateForm onCancelCallback={onCancelCallback} onSubmit={handleSubmit} />
    </div>
  )
}
