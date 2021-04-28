/* Copyright Contributors to the Open Cluster Management project */
import { useEffect, useState } from "react";
import { RouteComponentProps } from "react-router-dom";
import { NavigationPath } from '../../../NavigationPath'
import { useRecoilState } from 'recoil'
import { namespacesState, secretsState } from '../../../atoms'

import { AcmIcon, Provider, ProviderIconMap, ProviderLongTextMap } from '@open-cluster-management/ui-components'
import { useTranslation } from 'react-i18next'
import { AcmDataFormPage } from '../../../components/AcmDataForm'
import { FormData } from '../../../components/AcmFormData'
import { AcmSvgIcon } from '../../../components/AcmSvgIcon'
import { ErrorPage } from '../../../components/ErrorPage'
import { LoadingPage } from '../../../components/LoadingPage'
import { DOC_LINKS } from '../../../lib/doc-util'
import { getAuthorizedNamespaces, rbacCreate } from '../../../lib/rbac-util'
import { createResource, replaceResource } from '../../../lib/resource-request'

import {
    packProviderConnection,
    ProviderConnection,
    unpackProviderConnection,
} from '../../../resources/provider-connection'
import { IResource } from '../../../resources/resource'
import { getSecret, SecretDefinition } from "../../../resources/secret";
import { ClusterCuratorDefinition } from "../../../resources/cluster-curator";




export default function AnsibleAutomationsFormPage({ match }: RouteComponentProps<{namespace: string; name: string}>){
    const {name, namespace} = match.params

    let isEditing = false
    let isViewing = false
    if (name !== undefined) {
        isEditing = match.path.endsWith(NavigationPath.editAnsibleAutomation)
        isViewing = !isEditing
    }

    const [error, setError] = useState<Error>()
    const [namespaces] = useRecoilState(namespacesState)
    const [projects, setProjects] = useState<string[]>()

    const [secrets] = useRecoilState(secretsState)
    const providerConnections = secrets.map(unpackProviderConnection)

    useEffect(() => {
        if (!isEditing && !isViewing)
            getAuthorizedNamespaces([rbacCreate(ClusterCuratorDefinition)], namespaces)
                .then((namespaces: string[]) => setProjects(namespaces.sort()))
                .catch(setError)
        return undefined
    }, [namespaces, isEditing, isViewing])

    // useEffect(() => {
    //     if (isEditing || isViewing) {
    //         const result = getSecret({ name, namespace })
    //         result.promise
    //             .then((secret) => setProviderConnection(unpackProviderConnection(secret as ProviderConnection)))
    //             .catch(setError)
    //         return result.abort
    //     }
    //     return undefined
    // }, [isEditing, isViewing, name, namespace])

    const ansibleCredentials = providerConnections.map((providerConnection) => {
        if (providerConnection.spec?.host) {
            return providerConnection.metadata.name as string
        } else return ''
    })

}

export function AnsibleAutomationsForm() {


}