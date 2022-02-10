/* Copyright Contributors to the Open Cluster Management project */

import { getBackendUrl, getRequest } from '../resources'

export const applinksUrl = '/console-links'

export type IAppLinksResult = {
    data: Record<string, [IAppSwitcherData]>
}

export interface IAppSwitcherData {
    name: string
    url: string
    icon: string
}

export function getApplinks() {
    const url = getBackendUrl() + applinksUrl
    return getRequest<IAppLinksResult>(url)
}
