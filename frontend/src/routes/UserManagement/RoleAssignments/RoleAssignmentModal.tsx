/* Copyright Contributors to the Open Cluster Management project */

import { Button, ModalVariant } from '@patternfly/react-core'
import { useState } from 'react'
import { emptyRoleAssignment, RoleAssignment } from '../../../resources/role-assignment'
import { RoleAssignmentForm } from './RoleAssignmentForm'
import { useTranslation } from '../../../lib/acm-i18next'
import { AcmModal } from '../../../ui-components'

type RoleAssignmentModalProps = {
  close: () => void
  save: (roleAssignment: RoleAssignment) => void
  isOpen: boolean
  isEdit?: boolean
  isDisabled?: boolean
  isSaving?: boolean
}

const RoleAssignmentModal = ({ close, save, isOpen, isEdit, isDisabled, isSaving }: RoleAssignmentModalProps) => {
  const { t } = useTranslation()
  const [roleAssignment] = useState<RoleAssignment>(emptyRoleAssignment)

  return (
    <AcmModal
      title={isEdit ? t('Edit role assignment') : t('Create role assignment')}
      isOpen={isOpen}
      variant={ModalVariant.small}
      style={{ display: 'table !important' }}
      onClose={close}
      actions={[
        <Button
          key="save"
          id="save"
          variant="primary"
          onClick={() => save(roleAssignment)}
          isAriaDisabled={isDisabled || isSaving}
        >
          {isSaving ? t('Saving') : t('save')}
        </Button>,
        <Button key="cancel" id="cancel" variant="link" onClick={close}>
          {t('Cancel')}
        </Button>,
      ]}
    >
      <RoleAssignmentForm />
    </AcmModal>
  )
}

export { RoleAssignmentModal }
