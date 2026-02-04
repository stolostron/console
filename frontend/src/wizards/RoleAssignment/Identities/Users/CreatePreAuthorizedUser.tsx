/* Copyright Contributors to the Open Cluster Management project */

import { useContext } from 'react'
import { useTranslation } from '../../../../lib/acm-i18next'
import { AcmToastContext } from '../../../../ui-components/AcmAlert/AcmToast'
import { User } from '../../../../resources/rbac'
import { CreateUserForm } from './CreateUserForm'

interface CreatePreAuthorizedUserProps {
  onClose: () => void
  onSuccess: (user: User) => void
}

export function CreatePreAuthorizedUser({ onClose, onSuccess }: CreatePreAuthorizedUserProps) {
  const { t } = useTranslation()
  const toastContext = useContext(AcmToastContext)

  const handleSuccess = (user: User) => {
    toastContext.addAlert({
      title: t('Pre-authorized user created'),
      message: t('{{name}} user has been successfully created.', {
        name: user.metadata.name,
      }),
      type: 'success',
      autoClose: true,
    })
    onSuccess(user)
    onClose()
  }

  const handleError = (name: string) => {
    toastContext.addAlert({
      title: t('Failed to create pre-authorized user'),
      message: t('Failed to create pre-authorized user {{name}}. Please try again.', {
        name,
      }),
      type: 'danger',
    })
  }

  return (
    <div>
      <p style={{ marginBottom: '1rem' }}>
        {t("This role assignment will activate automatically on the user's first login.")}
      </p>

      <CreateUserForm
        saveButtonText={t('Save pre-authorized user')}
        cancelButtonText={t('Cancel and search users instead')}
        onSuccess={handleSuccess}
        onCancel={onClose}
        onError={handleError}
      />
    </div>
  )
}
