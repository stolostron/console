/* Copyright Contributors to the Open Cluster Management project */

import { getBackendUrl, getRequest } from '../resources'

export const usernameUrl = '/username'

export function getUsername() {
    const url = getBackendUrl() + usernameUrl
    return getRequest(url)
}