/* Copyright Contributors to the Open Cluster Management project */

import { useEffect, useState } from 'react'
import { getAuthorizedNamespaces, rbacCreate } from '../lib/rbac-util'
import { SecretDefinition } from '../resources'
import { useSharedAtoms, useRecoilValueGetter } from '../shared-recoil'

export function useProjects() {
  const { namespacesState } = useSharedAtoms()

  const [error, setError] = useState<Error>()
  const [projects, setProjects] = useState<string[]>([])

  const getNamespaces = useRecoilValueGetter(namespacesState)

  useEffect(() => {
    rbacCreate(SecretDefinition).then((attributes) => {
      getAuthorizedNamespaces([attributes], getNamespaces())
        .then((namespaces: string[]) => setProjects(namespaces.sort()))
        .catch(setError)
    })
  }, [getNamespaces])

  return { projects, error }
}
