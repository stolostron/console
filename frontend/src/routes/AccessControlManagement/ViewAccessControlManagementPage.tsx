/* Copyright Contributors to the Open Cluster Management project */
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom-v5-compat'
import { useRecoilValue } from 'recoil'
import { AccessControl } from '../../resources/access-control'
import { useSharedAtoms } from '../../shared-recoil'
import { AccessControlManagementForm } from './AccessControlManagementForm'
import { filteredAccessControlState } from '../../filtered-atoms/AccessControlManagement'

const ViewAccessControlManagementPage = () => {
    const { id = undefined } = useParams()
    const { accessControlState } = useSharedAtoms()
    const accessControls = useRecoilValue(filteredAccessControlState)
    const [accessControl, setAccessControl] = useState<AccessControl | undefined>();

    useEffect(() => {
        if (id) {
            setAccessControl(accessControls.find(e => e.data?.id === id))
        }
    }, [accessControls, id])

    return <AccessControlManagementForm
        isEditing={false}
        isViewing={true}
        accessControl={accessControl}
    />
}

export { ViewAccessControlManagementPage }
