/* Copyright Contributors to the Open Cluster Management project */
import { useNavigate } from 'react-router'
import { onCancel, onSubmit } from '../common/utils'
import { CredentialsWizard } from './CredentialsWizard'

export function CredentialsExample() {
  const navigate = useNavigate()
  return <CredentialsWizard onSubmit={onSubmit} onCancel={() => onCancel(navigate)} />
}
