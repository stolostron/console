/* Copyright Contributors to the Open Cluster Management project */
import { Button, PageSection } from '@patternfly/react-core'
import { useState } from 'react'
import { RoleAssignmentModal } from '../../RoleAssignments/RoleAssignmentModal'

const Users = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  return (
    <PageSection>
      <div>Users list</div>
      {/* // TODO: to remove button and modal */}
      <Button variant="primary" onClick={() => setIsModalOpen(true)}>
        Open Modal
      </Button>
      <RoleAssignmentModal
        close={() => setIsModalOpen(false)}
        save={() => setIsModalOpen(false)}
        isOpen={isModalOpen}
      />
    </PageSection>
  )
}

export { Users }
