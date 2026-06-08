/* Copyright Contributors to the Open Cluster Management project */
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { onCancel, onSubmit } from '../common/utils'
import { AnsibleWizard } from './AnsibleWizard'

export function AnsibleExample() {
  const navigate = useNavigate()
  const credentials = useMemo(() => ['my-inst-creds', 'my-up-creds'], [])
  const namespaces = useMemo(() => ['default'], [])
  return (
    <AnsibleWizard
      credentials={credentials}
      namespaces={namespaces}
      onSubmit={onSubmit}
      onCancel={() => onCancel(navigate)}
    />
  )
}
