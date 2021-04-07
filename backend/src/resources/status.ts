export interface Status {
    kind: 'Status'
    apiVersion: 'v1'
    metadata: unknown
    status: string
    message: string
    reason: string
    code: number
}
