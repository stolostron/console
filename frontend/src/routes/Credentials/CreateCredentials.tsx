/* Copyright Contributors to the Open Cluster Management project */

import { useMemo } from 'react'
import { useLocation } from 'react-router-dom-v5-compat'
import { CreateCredentialsFormPage } from './CredentialsForm'
import { CREDENTIALS_TYPE_PARAM, isCredentialsType } from './CredentialsType'
import { CreateCredentialsCatalog } from './CreateCredentialsCatalog'

export function CreateCredentialsPage() {
  const { search } = useLocation()
  const searchParams = useMemo(() => new URLSearchParams(search), [search])
  const credentialsType = (searchParams.get(CREDENTIALS_TYPE_PARAM) || '').toLowerCase()
  return isCredentialsType(credentialsType) ? (
    <CreateCredentialsFormPage credentialsType={credentialsType} />
  ) : (
    <CreateCredentialsCatalog />
  )
}
