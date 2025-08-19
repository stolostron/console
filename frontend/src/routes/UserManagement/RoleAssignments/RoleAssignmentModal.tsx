/* Copyright Contributors to the Open Cluster Management project */

import { AcmModal } from '../../../ui-components'
import { RoleAssignmentPreselected } from './model/role-assignment-preselected'
import { RoleAssignmentForm } from './RoleAssignmentForm'

type RoleAssignmentModalProps = {
  close: () => void
  onSave?: () => void
  isOpen: boolean
  isEditing?: boolean
  preselected?: RoleAssignmentPreselected
}

const RoleAssignmentModal = ({ close, onSave, isOpen, isEditing, preselected }: RoleAssignmentModalProps) => (
  <AcmModal isOpen={isOpen} width="90%" style={{ display: 'table !important' }} onClose={close}>
    <RoleAssignmentForm
      isEditing={isEditing}
      onCancel={close}
      onSave={onSave}
      hideYaml={true}
      preselected={preselected}
    />
  </AcmModal>
)

export { RoleAssignmentModal }
