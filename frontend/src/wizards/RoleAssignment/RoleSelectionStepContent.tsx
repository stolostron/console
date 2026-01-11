/* Copyright Contributors to the Open Cluster Management project */
import { RolesList } from './Roles/RolesList'

interface RoleSelectionStepContentProps {
  onRoleSelect: (roleName: string) => void
}

export const RoleSelectionStepContent = ({ onRoleSelect }: RoleSelectionStepContentProps) => {
  return (
    <>
      <RolesList onRadioSelect={onRoleSelect} />
    </>
  )
}
