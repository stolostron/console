/* Copyright Contributors to the Open Cluster Management project */
import { useNavigate } from 'react-router-dom'
import { onCancel, onSubmit } from '../common/utils'
import { RosaWizard } from './RosaWizard'

export function RosaExample() {
  const navigate = useNavigate()
  return <RosaWizard onSubmit={onSubmit} onCancel={() => onCancel(navigate)} />
}
