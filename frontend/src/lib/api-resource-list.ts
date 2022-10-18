/* Copyright Contributors to the Open Cluster Management project */

import { getBackendUrl, getRequest } from '../resources'

const versionUrl = '/apiPaths'

export interface APIResourceList {
    resources: APIResourceNames
}

export interface APIResourceNames {
    [key: string]: {
        group: string
        pluralName: string
        singularName: string
    }
}

export function getApiPaths() {
    const url = getBackendUrl() + versionUrl
    return getRequest<APIResourceList>(url)
}
