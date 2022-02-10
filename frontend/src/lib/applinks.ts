/* Copyright Contributors to the Open Cluster Management project */

import { getBackendUrl, getRequest } from '../resources'

export const applinksUrl = '/console-links'

export function getApplinks() {
    const url = getBackendUrl() + applinksUrl
    return getRequest(url)
}