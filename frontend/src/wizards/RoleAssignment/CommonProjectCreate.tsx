/* Copyright Contributors to the Open Cluster Management project */

import { Title } from '@patternfly/react-core'
import { useContext } from 'react'
import { ProjectCreateForm, ProjectFormData } from '../../components/project'
import { useTranslation } from '../../lib/acm-i18next'
import { fireManagedClusterActionCreate, ProjectRequestApiVersion, ProjectRequestKind } from '../../resources'
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

  const handleSubmit = async (data: ProjectFormData) => {
    try {
      await Promise.all(
        selectedClusters.map((cluster) =>
          fireManagedClusterActionCreate(cluster.name, {
            apiVersion: ProjectRequestApiVersion,
            kind: ProjectRequestKind,
            metadata: { name: data.name },
            displayName: data.displayName || undefined,
            description: data.description || undefined,
          })
            .then(async (actionResponse) => {
              if (actionResponse.actionDone === 'ActionDone') {
                toastContext.addAlert({
                  title: t('Common project created'),
                  message: t('{{name}} project has been successfully created for the cluster {{cluster}}.', {
                    name: data.name,
                    cluster: cluster.name,
                  }),
                  type: 'success',
                  autoClose: true,
                })
              } else {
                throw new Error(actionResponse.message)
              }
            })
            .catch((err) => {
              toastContext.addAlert({
                title: t('Failed to create common project'),
                message: t('Failed to create common project {{name}} for the cluster {{cluster}}. Error: {{error}}.', {
                  name: data.name,
                  cluster: cluster.name,
                  error: err.message,
                }),
                type: 'danger',
                autoClose: true,
              })
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
