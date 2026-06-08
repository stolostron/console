/* Copyright Contributors to the Open Cluster Management project */
import { useNavigate } from 'react-router-dom'
import { onCancel, onSubmit } from '../common/utils'
import { AppWizard } from './AppWizard'

export function AppExample() {
  const navigate = useNavigate()
  return <AppWizard onSubmit={onSubmit} onCancel={() => onCancel(navigate)} />
}
