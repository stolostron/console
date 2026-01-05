/* Copyright Contributors to the Open Cluster Management project */
import { RoleAssignmentFormData } from './types'

interface ReviewStepContentProps {
  formData: RoleAssignmentFormData
}

export const ReviewStepContent = ({ formData }: ReviewStepContentProps) => {
  return <div>Review steps for {formData.roles}</div>
}
