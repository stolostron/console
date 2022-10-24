/* Copyright Contributors to the Open Cluster Management project */

import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { CreateCredentialsFormPage, isCredentialsType } from './CredentialsForm'
import { CreateCredentialsType } from './CreateCredentialsType'

export function CreateCredentialsPage() {
    const { search } = useLocation()
    const searchParams = useMemo(() => new URLSearchParams(search), [search])
    const credentialsType = (searchParams.get('credentialsType') || '').toLowerCase()
    return isCredentialsType(credentialsType) ? (
        <CreateCredentialsFormPage credentialsType={credentialsType} />
    ) : (
        <CreateCredentialsType />
    )
}
