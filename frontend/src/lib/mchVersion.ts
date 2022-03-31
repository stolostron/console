/* Copyright Contributors to the Open Cluster Management project */

import { getBackendUrl, getRequest } from '../resources'

const versionUrl = '/mchVersion'

export type IMCHVersionResult = {
    mchVersion?: StringConstructor
}

export function getMCHVersion() {
    const url = getBackendUrl() + versionUrl
    return getRequest<IMCHVersionResult>(url)
}
