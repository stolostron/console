/* Copyright Contributors to the Open Cluster Management project */

import { useContext } from 'react'
import { useTranslation } from '../../../lib/acm-i18next'
import { Group, User } from '../../../resources/rbac'
import { useRecoilValue, useSharedAtoms } from '../../../shared-recoil'
import { AcmToastContext } from '../../../ui-components/AcmAlert/AcmToast'
import { CreateIdentityForm } from './CreateIdentityForm'
import { CreateIdentityFormDirectAuthentication } from './CreateIdentityFormDirectAuthentication'

function getDescriptionText(t: ReturnType<typeof useTranslation>['t'], isDirectAuth: boolean, isUser: boolean): string {
  if (isDirectAuth) {
    return isUser
      ? t(
          'This user identifier will be used to match the external identity provider login and activate the role assignment. No user resource will be created.'
        )
      : t(
          'This group identifier will be used to match the external identity provider login and activate the role assignment. No group resource will be created.'
        )
  }
  return isUser
    ? t(
        "This role assignment will activate automatically on the user's first login. Once you proceed with the creation, the user will be created immediately."
      )
    : t(
        "This role assignment will activate automatically on the group's first login. Once you proceed with the creation, the group will be created immediately."
      )
}

function getSaveButtonText(t: ReturnType<typeof useTranslation>['t'], isDirectAuth: boolean, isUser: boolean): string {
  const texts = {
    addUser: t('Add user'),
    addGroup: t('Add group'),
    saveUser: t('Save user'),
    saveGroup: t('Save group'),
  }
  const key = `${isDirectAuth ? 'add' : 'save'}${isUser ? 'User' : 'Group'}` as keyof typeof texts
  return texts[key]
}

interface CreatePreAuthorizedIdentityProps {
  subjectKind: 'User' | 'Group'
  onClose: () => void
  onSuccess: (identity: User | Group) => void
}

export function CreatePreAuthorizedIdentity({ subjectKind, onClose, onSuccess }: CreatePreAuthorizedIdentityProps) {
  const { t } = useTranslation()
  const toastContext = useContext(AcmToastContext)
  const { isDirectAuthenticationEnabledState, claimMappingsState } = useSharedAtoms()
  const isDirectAuthenticationEnabled = useRecoilValue(isDirectAuthenticationEnabledState)
  const claimMappings = useRecoilValue(claimMappingsState)

  const isUser = subjectKind === 'User'

  const handleSuccess = (identity: User | Group) => {
    const name = identity.metadata.name
    let title: string
    let message: string
    if (isDirectAuthenticationEnabled) {
      title = isUser ? t('Pre-authorized user added') : t('Pre-authorized group added')
      message = isUser
        ? t('{{name}} user has been successfully added.', { name })
        : t('{{name}} group has been successfully added.', { name })
    } else {
      title = isUser ? t('Pre-authorized user created') : t('Pre-authorized group created')
      message = isUser
        ? t('{{name}} user has been successfully created.', { name })
        : t('{{name}} group has been successfully created.', { name })
    }
    toastContext.addAlert({ title, message, type: 'success', autoClose: true })
    onSuccess(identity)
    onClose()
  }

  const handleError = (name: string) => {
    toastContext.addAlert({
      title: isUser ? t('Failed to create pre-authorized user') : t('Failed to create pre-authorized group'),
      message: isUser
        ? t('Failed to create pre-authorized user {{name}}. Please try again.', { name })
        : t('Failed to create pre-authorized group {{name}}. Please try again.', { name }),
      type: 'danger',
    })
  }

  const saveButtonText = getSaveButtonText(t, isDirectAuthenticationEnabled, isUser)
  const cancelButtonText = isUser ? t('Cancel and search users instead') : t('Cancel and search groups instead')

  return (
    <div>
      <p style={{ marginBottom: '1rem' }}>{getDescriptionText(t, isDirectAuthenticationEnabled, isUser)}</p>

      {isDirectAuthenticationEnabled ? (
        <CreateIdentityFormDirectAuthentication
          subjectKind={subjectKind}
          claimMappings={claimMappings}
          saveButtonText={saveButtonText}
          cancelButtonText={cancelButtonText}
          onSuccess={handleSuccess}
          onCancel={onClose}
        />
      ) : (
        <CreateIdentityForm
          subjectKind={subjectKind}
          saveButtonText={saveButtonText}
          cancelButtonText={cancelButtonText}
          onSuccess={handleSuccess}
          onCancel={onClose}
          onError={handleError}
        />
      )}
    </div>
  )
}
