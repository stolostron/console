/* Copyright Contributors to the Open Cluster Management project */

import { useEffect, useState } from 'react'
import { getAuthorizedNamespaces, rbacCreate } from '../lib/rbac-util'
import { SecretDefinition } from '../resources'
import { useSharedAtoms, useRecoilValueGetter } from '../shared-recoil'

/**
 * Custom hook to fetch and manage authorized projects (namespaces) for creation of secrets.
 *
 * @returns An object containing the projects and any error that occurred
 * @property {string[]} projects - Alphabetically sorted array of namespace names the user has access to
 * @property {Error} [error] - Error object if retrieval fails
 *
 * @example
 * ```tsx
 * function ProjectSelector() {
 *   const { projects, error } = useProjects()
 *
 *   if (error) {
 *     return <div>Error loading projects: {error.message}</div>
 *   }
 *
 *   return (
 *     <CredentialsForm namespaces={projects} />
 *   )
 * }
 * ```
 */

export function useProjects() {
  const { namespacesState } = useSharedAtoms()

  const [error, setError] = useState<Error>()
  const [projects, setProjects] = useState<string[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  const getNamespaces = useRecoilValueGetter(namespacesState)

  useEffect(() => {
    rbacCreate(SecretDefinition).then((attributes) =>
      getAuthorizedNamespaces([attributes], getNamespaces())
        .then((namespaces: string[]) => {
          namespaces.sort((a, b) => a.localeCompare(b))
          setProjects(namespaces)
        })
        .catch(setError)
        .finally(() => setLoading(false))
    )
  }, [getNamespaces])

  return { projects, error, loading }
}
