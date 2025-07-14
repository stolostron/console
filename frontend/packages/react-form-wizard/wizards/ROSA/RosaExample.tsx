/* Copyright Contributors to the Open Cluster Management project */
import { useHistory } from 'react-router-dom'
import { onCancel, onSubmit } from '../common/utils'
import { RosaWizard } from './RosaWizard'

export function RosaExample() {
  const history = useHistory()
  return <RosaWizard onSubmit={onSubmit} onCancel={() => onCancel(history)} />
}
