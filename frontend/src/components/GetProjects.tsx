/* Copyright Contributors to the Open Cluster Management project */

import { useEffect, useState } from 'react'
import { getAuthorizedNamespaces, rbacCreate } from '../lib/rbac-util'
import { SecretDefinition } from '../resources'
import { useSharedAtoms, useRecoilCallback } from '../shared-recoil'

export function GetProjects() {
  const { namespacesState } = useSharedAtoms()

  const [error, setError] = useState<Error>()
  const [projects, setProjects] = useState<string[]>([])

  const getNamespaces = useRecoilCallback(
    ({ snapshot }) =>
      () =>
        snapshot.getPromise(namespacesState),
    []
  )
  useEffect(() => {
    getNamespaces()
      .then(async (namespaces) => {
        const attributes = await rbacCreate(SecretDefinition)
        getAuthorizedNamespaces([attributes], namespaces)
          .then((namespaces: string[]) => setProjects(namespaces.sort()))
          .catch(setError)
      })
      .catch(setError)

    return undefined
  }, [getNamespaces])

  return { projects, error }
}
