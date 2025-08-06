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
  isEditing?: boolean
  isDisabled?: boolean
  isSaving?: boolean
}

const RoleAssignmentModal = ({ close, save, isOpen, isEditing, isDisabled, isSaving }: RoleAssignmentModalProps) => {
  const { t } = useTranslation()
  const [roleAssignment] = useState<RoleAssignment>(emptyRoleAssignment)

  return (
    <AcmModal
      isOpen={isOpen}
      width="90%"
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
      <RoleAssignmentForm isEditing={isEditing} />
    </AcmModal>
  )
}

export { RoleAssignmentModal }
