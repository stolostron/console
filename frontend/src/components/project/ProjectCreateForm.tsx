/* Copyright Contributors to the Open Cluster Management project */

import { ActionGroup, ActionList, ActionListGroup, ActionListItem, Button } from '@patternfly/react-core'
import { useState } from 'react'
import { useTranslation } from '../../lib/acm-i18next'
import { AcmForm, AcmSubmit } from '../../ui-components/AcmForm/AcmForm'
import { AcmTextInput } from '../../ui-components/AcmTextInput/AcmTextInput'
import { validateName } from './validation'

export interface ProjectFormData {
  name: string
  displayName: string
  description: string
}

export function ProjectCreateForm({
  onCancelCallback,
  onSubmit,
}: {
  /** Callback function called when the cancel button is clicked */
  readonly onCancelCallback: () => void
  /** Callback function called when the form is submitted with valid data */
  readonly onSubmit: (data: ProjectFormData) => void | Promise<void>
}) {
  const { t } = useTranslation()

  // Form state
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    displayName: '',
    description: '',
  })

  // Validation function wrappers that include translation context
  const validateNameWithTranslation = (value: string): string | undefined => validateName(value, t)

  // Form handlers
  const handleSubmit = async () => await onSubmit(formData)

  const handleCancel = () => onCancelCallback()

  return (
    <AcmForm>
      <AcmTextInput
        id="project-name"
        label={t('Name')}
        placeholder={t('Enter project name')}
        value={formData.name}
        onChange={(_event, value) => setFormData({ ...formData, name: value })}
        validation={validateNameWithTranslation}
        isRequired
      />

      <AcmTextInput
        id="project-display-name"
        label={t('Display name')}
        placeholder={t('Enter display name (optional)')}
        value={formData.displayName}
        onChange={(_event, value) => setFormData({ ...formData, displayName: value })}
      />

      <AcmTextInput
        id="project-description"
        label={t('Description')}
        placeholder={t('Enter description (optional)')}
        value={formData.description}
        onChange={(_event, value) => setFormData({ ...formData, description: value })}
      />

      <ActionGroup>
        <ActionList>
          <ActionListGroup>
            <ActionListItem>
              <AcmSubmit label={t('Save')} processingLabel={t('Saving...')} onClick={handleSubmit} />
            </ActionListItem>
            <ActionListItem>
              <Button variant="link" onClick={handleCancel}>
                {t('Cancel')}
              </Button>
            </ActionListItem>
          </ActionListGroup>
        </ActionList>
      </ActionGroup>
    </AcmForm>
  )
}
