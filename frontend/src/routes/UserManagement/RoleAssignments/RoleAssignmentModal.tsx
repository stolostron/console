/* Copyright Contributors to the Open Cluster Management project */

import { AcmModal } from '../../../ui-components'
import { RoleAssignmentForm } from './RoleAssignmentForm'

type RoleAssignmentModalProps = {
  close: () => void
  onSave?: () => void
  isOpen: boolean
  isEditing?: boolean
}

const RoleAssignmentModal = ({ close, onSave, isOpen, isEditing }: RoleAssignmentModalProps) => (
  <AcmModal isOpen={isOpen} width="90%" style={{ display: 'table !important' }} onClose={close}>
    <RoleAssignmentForm isEditing={isEditing} onCancel={close} onSave={onSave} />
  </AcmModal>
)

export { RoleAssignmentModal }
