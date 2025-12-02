/* Copyright Contributors to the Open Cluster Management project */

import { Title } from '@patternfly/react-core'
import { useContext } from 'react'
import { useTranslation } from '../../lib/acm-i18next'
import { ProjectCreateForm, ProjectFormData } from '../../components/project'
import { createProject } from '../../resources/project'
import { AcmToastContext } from '../../ui-components'

export function CommonProjectCreate({
  onCancelCallback,
  onSuccess,
  onError,
}: {
  /** Callback function called when the cancel button is clicked */
  onCancelCallback: () => void
  /** Optional callback function called when the project is successfully created */
  onSuccess?: () => void
  /** Optional callback function called when project creation fails */
  onError?: (error: Error) => void
}) {
  const { t } = useTranslation()
  const toastContext = useContext(AcmToastContext)

  const handleSubmit = async (data: ProjectFormData) => {
    try {
      const response = createProject(
        data.name,
        undefined, // labels
        {
          displayName: data.displayName || undefined,
          description: data.description || undefined,
        }
      )

      // Wait for the project creation to complete
      const project = await response.promise

      // Show success toast
      toastContext.addAlert({
        title: t('Common project created'),
        message: t('{{name}} project has been successfully created.', {
          name: project.metadata?.name || data.name,
        }),
        type: 'success',
        autoClose: true,
      })

      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('Failed to create project')
      console.error('Project creation failed:', errorObj)

      // Show error toast
      toastContext.addAlert({
        title: t('Failed to create common project'),
        message: t('Failed to create common project {{name}}. Please try again.', {
          name: data.name,
        }),
        type: 'danger',
      })

      if (onError) {
        onError(errorObj)
      }
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
