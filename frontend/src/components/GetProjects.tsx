/* Copyright Contributors to the Open Cluster Management project */

import { useEffect, useState } from 'react'
import { useRecoilCallback } from 'recoil'
import { namespacesState } from '../atoms'
import { getAuthorizedNamespaces, rbacCreate } from '../lib/rbac-util'
import { SecretDefinition } from '../resources'

export function GetProjects() {
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
            .then((namespaces) => {
                getAuthorizedNamespaces([rbacCreate(SecretDefinition)], namespaces)
                    .then((namespaces: string[]) => setProjects(namespaces.sort()))
                    .catch(setError)
            })
            .catch(setError)

        return undefined
    }, [getNamespaces])

    return { projects, error }
}
