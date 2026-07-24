/* Copyright Contributors to the Open Cluster Management project */

import { useCallback } from 'react'
import { useParams, useNavigate, generatePath } from 'react-router'
import type { PathParam } from 'react-router'
import { useSearchParams } from '~/lib/search'
import { NavigationPath } from '~/NavigationPath'
import type { ApplicationSet } from '~/resources'
import { argoAppSetQueryString } from './actions'
import { EditArgoApplicationSet } from './EditArgoApplicationSet'

export function EditApplicationSetPage() {
  const navigate = useNavigate()
  const searchParams = useSearchParams()
  const { name = '', namespace = '' } = useParams<PathParam<NavigationPath.editApplicationArgo>>()

  const handleCancel = useCallback(() => {
    if (searchParams.get('context') === 'applicationsets') {
      navigate(NavigationPath.applications)
    } else {
      navigate({
        pathname: generatePath(NavigationPath.applicationDetails, { name, namespace }),
        search: argoAppSetQueryString,
      })
    }
  }, [name, namespace, navigate, searchParams])

  const handleSubmitSuccess = useCallback(
    (applicationSet: ApplicationSet) => {
      if (searchParams.get('context') === 'applicationsets') {
        navigate(NavigationPath.applications)
      } else {
        navigate({
          pathname: generatePath(NavigationPath.applicationDetails, {
            namespace: applicationSet.metadata?.namespace ?? '',
            name: applicationSet.metadata?.name ?? '',
          }),
          search: argoAppSetQueryString,
        })
      }
    },
    [navigate, searchParams]
  )

  const handleApplicationSetNotFound = useCallback(() => {
    navigate(NavigationPath.applications)
  }, [navigate])

  return (
    <EditArgoApplicationSet
      name={name}
      namespace={namespace}
      onCancel={handleCancel}
      onSubmitSuccess={handleSubmitSuccess}
      onApplicationSetNotFound={handleApplicationSetNotFound}
    />
  )
}
