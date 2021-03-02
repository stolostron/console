/* Copyright Contributors to the Open Cluster Management project */

import { V1Status } from '@kubernetes/client-node'

export const StatusApiVersion = 'v1'
export type StatusApiVersionType = 'v1'

export const StatusKind = 'Status'
export type StatusKindType = 'Status'

export interface Status extends V1Status {
    apiVersion: StatusApiVersionType
    kind: StatusKindType
    status: 'Success' | 'Failure'
}
