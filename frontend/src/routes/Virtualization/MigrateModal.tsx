/* Copyright Contributors to the Open Cluster Management project */
import { Modal, Button, ModalVariant, Stack, StackItem } from '@patternfly/react-core'

export interface BulkMigrateModalProps {
  open: boolean
  onClose: () => void
  selectedIds: string[]
  onConfirm: () => void
}

export function MigrateModal({ open, onClose, selectedIds, onConfirm }: BulkMigrateModalProps) {
  return (
    <Modal
      title="Migrate selected virtual machines"
      isOpen={open}
      variant={ModalVariant.medium}
      onClose={onClose}
      actions={[
        <Button key="confirm" variant="primary" onClick={onConfirm}>
          Continue migration
        </Button>,
        <Button key="cancel" variant="link" onClick={onClose}>
          Cancel
        </Button>,
      ]}
    >
      <Stack hasGutter>
        <StackItem>The following VM IDs will be migrated:</StackItem>
        <StackItem>
          <ul>
            {selectedIds.map((id) => (
              <li key={id}>{id}</li>
            ))}
          </ul>
        </StackItem>
      </Stack>
    </Modal>
  )
}
