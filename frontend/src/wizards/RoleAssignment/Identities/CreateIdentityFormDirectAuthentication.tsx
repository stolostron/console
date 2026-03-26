/* Copyright Contributors to the Open Cluster Management project */

import { ActionGroup, ActionList, ActionListGroup, ActionListItem, Button } from '@patternfly/react-core'
import { useState } from 'react'
import { useTranslation } from '../../../lib/acm-i18next'
import { ClaimMappings } from '../../../resources/authentication'
import { Group, GroupKind, User, UserApiVersion, UserKind } from '../../../resources/rbac'
import { AcmForm, AcmSubmit } from '../../../ui-components/AcmForm/AcmForm'
import { AcmTextInput } from '../../../ui-components/AcmTextInput/AcmTextInput'
import { validateIdentityIdentifier } from './utils'

interface CreateIdentityFormDirectAuthenticationProps {
  subjectKind: 'User' | 'Group'
  claimMappings: ClaimMappings | undefined
  saveButtonText: string
  cancelButtonText: string
  onSuccess: (identity: User | Group) => void
  onCancel: () => void
  validation?: (value: string) => string | undefined
}

function getPlaceholder(
  subjectKind: 'User' | 'Group',
  claimMappings: ClaimMappings | undefined,
  t: (k: string) => string
): string {
  if (subjectKind === 'User') {
    const prefix =
      claimMappings?.username?.prefixPolicy === 'Prefix' ? claimMappings.username.prefix?.prefixString ?? '' : ''
    return prefix ? `${prefix}username` : t('user@company.com or username')
  }
  const groupPrefix = claimMappings?.groups?.prefix ?? ''
  return groupPrefix ? `${groupPrefix}group-name` : t('group-name')
}

function getPrefixWarning(
  subjectKind: 'User' | 'Group',
  claimMappings: ClaimMappings | undefined,
  t: (key: string, opts?: Record<string, string>) => string
): (value: string) => string | undefined {
  return (value: string) => {
    if (!value.trim()) return undefined

    if (subjectKind === 'User' && claimMappings?.username?.prefixPolicy === 'Prefix') {
      const prefix = claimMappings.username.prefix?.prefixString
      if (prefix && !value.trim().startsWith(prefix)) {
        return t('Identifier should start with prefix {{prefix}}', { prefix })
      }
    }

    if (subjectKind === 'Group') {
      const prefix = claimMappings?.groups?.prefix
      if (prefix && !value.trim().startsWith(prefix)) {
        return t('Identifier should start with prefix {{prefix}}', { prefix })
      }
    }

    return undefined
  }
}

interface FormData {
  identityIdentifier: string
}

export function CreateIdentityFormDirectAuthentication({
  subjectKind,
  claimMappings,
  saveButtonText,
  cancelButtonText,
  onSuccess,
  onCancel,
  validation,
}: CreateIdentityFormDirectAuthenticationProps) {
  const { t } = useTranslation()
  const [formData, setFormData] = useState<FormData>({
    identityIdentifier: '',
  })

  const isUser = subjectKind === 'User'
  const defaultValidation = (value: string) =>
    validateIdentityIdentifier(value, isUser ? t('User identifier is required') : t('Group identifier is required'))
  const validate = validation ?? defaultValidation
  const prefixWarningFn = getPrefixWarning(subjectKind, claimMappings, t)

  const handleSubmit = async () => {
    const name = formData.identityIdentifier.trim()
    if (isUser) {
      onSuccess({
        apiVersion: UserApiVersion,
        kind: UserKind,
        metadata: { name },
      } as User)
    } else {
      onSuccess({
        apiVersion: UserApiVersion,
        kind: GroupKind,
        metadata: { name },
        users: [],
      } as Group)
    }
  }

  return (
    <AcmForm>
      <AcmTextInput
        id="identity-identifier"
        label={isUser ? t('User identifier') : t('Group identifier')}
        placeholder={getPlaceholder(subjectKind, claimMappings, t)}
        value={formData.identityIdentifier}
        onChange={(_event, value) => setFormData({ ...formData, identityIdentifier: value })}
        validation={validate}
        warning={prefixWarningFn}
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
