/* Copyright Contributors to the Open Cluster Management project */
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom-v5-compat'
import { AccessControl } from '../../resources/access-control'
import { AccessControlManagementForm } from './AccessControlManagementForm'
import { useRecoilValue, useSharedAtoms } from '../../shared-recoil'

const ViewAccessControlManagementPage = () => {
  const { id = undefined } = useParams()
  const { accessControlState } = useSharedAtoms()
  const accessControls = useRecoilValue(accessControlState)
  const [accessControl, setAccessControl] = useState<AccessControl | undefined>()

  useEffect(() => {
    if (id) {
      setAccessControl(accessControls.find((e) => e.metadata?.uid === id))
    }
  }, [accessControls, id])

  return (
    <AccessControlManagementForm isEditing={false} isViewing={true} accessControl={accessControl} isCreatable={false} />
  )
}

export { ViewAccessControlManagementPage }
