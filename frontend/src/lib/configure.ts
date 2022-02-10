/* Copyright Contributors to the Open Cluster Management project */

import { getBackendUrl, getRequest } from '../resources'

export const configureUrl = '/configure'

export function configure() {
    const url = getBackendUrl() + '/configure'
    return getRequest(url)
}