/* Copyright Contributors to the Open Cluster Management project */

import { ActionGroup, ActionList, ActionListGroup, ActionListItem, Button } from '@patternfly/react-core'
import { useState } from 'react'
import { useTranslation } from '../../../../lib/acm-i18next'
import { createUser, User } from '../../../../resources/rbac'
import { AcmForm, AcmSubmit } from '../../../../ui-components/AcmForm/AcmForm'
import { AcmSelect } from '../../../../ui-components/AcmSelect/AcmSelect'
import { AcmTextInput } from '../../../../ui-components/AcmTextInput/AcmTextInput'
import { useGetIdentityProviders } from '../../../../resources/clients/oauth-client'
import { IdentityProviderSelectOption } from '../common/IdentityProviderSelectOption'

interface CreateUserFormProps {
  saveButtonText: string
  cancelButtonText: string
  onSuccess: (user: User) => void
  onCancel: () => void
  onError: (name: string) => void
}

interface FormData {
  userIdentifier: string
  identityProvider: string
}

export function CreateUserForm({
  saveButtonText,
  cancelButtonText,
  onSuccess,
  onCancel,
  onError,
}: CreateUserFormProps) {
  const { t } = useTranslation()
  const [formData, setFormData] = useState<FormData>({
    userIdentifier: '',
    identityProvider: '',
  })

  const identityProviders = useGetIdentityProviders()

  const validateUserIdentifier = (value: string): string | undefined => {
    if (!value || value.trim() === '') {
      return t('User identifier is required')
    }
    return undefined
  }

  const handleSubmit = async () => {
    try {
      const user = {
        metadata: {
          name: formData.userIdentifier.trim(),
        },
        identities: formData.identityProvider ? [`${formData.identityProvider}:${formData.userIdentifier.trim()}`] : [],
      }

      const newUserRequest = createUser(user)
      onSuccess(await newUserRequest.promise)
    } catch (error) {
      console.error('Error creating user:', error)
      onError(formData.userIdentifier.trim())
    }
  }

  return (
    <AcmForm>
      <AcmTextInput
        id="user-identifier"
        label={t('User Identifier')}
        placeholder={t('user@company.com or username')}
        value={formData.userIdentifier}
        onChange={(_event, value) => setFormData({ ...formData, userIdentifier: value })}
        validation={validateUserIdentifier}
        isRequired
      />

      <AcmSelect
        id="identity-provider"
        label={t('Identity Provider (optional)')}
        placeholder={t('Any identity provider')}
        value={formData.identityProvider}
        onChange={(value) => setFormData({ ...formData, identityProvider: value || '' })}
      >
        {identityProviders.map((provider) => (
          <IdentityProviderSelectOption key={provider.name} identityProvider={provider} />
        ))}
      </AcmSelect>

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
