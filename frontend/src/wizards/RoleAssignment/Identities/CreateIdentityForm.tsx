/* Copyright Contributors to the Open Cluster Management project */

import { ActionGroup, ActionList, ActionListGroup, ActionListItem, Button } from '@patternfly/react-core'
import { useState } from 'react'
import { useTranslation } from '../../../lib/acm-i18next'
import { createGroup, createUser, Group, User } from '../../../resources/rbac'
import { AcmForm, AcmSubmit } from '../../../ui-components/AcmForm/AcmForm'
import { AcmTextInput } from '../../../ui-components/AcmTextInput/AcmTextInput'
import { validateIdentityIdentifier } from './utils'

interface CreateIdentityFormProps {
  subjectKind: 'User' | 'Group'
  saveButtonText: string
  cancelButtonText: string
  onSuccess: (identity: User | Group) => void
  onCancel: () => void
  onError: (name: string) => void
}

interface FormData {
  identityIdentifier: string
}

export function CreateIdentityForm({
  subjectKind,
  saveButtonText,
  cancelButtonText,
  onSuccess,
  onCancel,
  onError,
}: CreateIdentityFormProps) {
  const { t } = useTranslation()
  const [formData, setFormData] = useState<FormData>({
    identityIdentifier: '',
  })

  const isUser = subjectKind === 'User'

  const handleSubmit = async () => {
    const name = formData.identityIdentifier.trim()
    try {
      if (isUser) {
        const result = createUser({ metadata: { name } })
        onSuccess(await result.promise)
      } else {
        const result = createGroup({ metadata: { name }, users: [] })
        onSuccess(await result.promise)
      }
    } catch (error) {
      console.error(`Error creating ${subjectKind.toLowerCase()}:`, error)
      onError(name)
    }
  }

  return (
    <AcmForm>
      <AcmTextInput
        id="identity-identifier"
        label={isUser ? t('User identifier') : t('Group identifier')}
        placeholder={isUser ? t('user@company.com or username') : t('group-name')}
        value={formData.identityIdentifier}
        onChange={(_event, value) => setFormData({ ...formData, identityIdentifier: value })}
        validation={(value) =>
          validateIdentityIdentifier(
            value,
            isUser ? t('User identifier is required') : t('Group identifier is required')
          )
        }
        isRequired
      />

      <ActionGroup>
        <ActionList>
          <ActionListGroup>
            <ActionListItem>
              <AcmSubmit label={saveButtonText} processingLabel={t('Saving...')} onClick={handleSubmit} />
            </ActionListItem>
            <ActionListItem>
              <Button variant="link" onClick={onCancel}>
                {cancelButtonText}
              </Button>
            </ActionListItem>
          </ActionListGroup>
        </ActionList>
      </ActionGroup>
    </AcmForm>
  )
}
