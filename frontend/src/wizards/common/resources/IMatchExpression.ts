/* Copyright Contributors to the Open Cluster Management project */
export interface IExpression {
    key?: string
    operator?: 'In' | 'NotIn' | 'Exists' | 'DoesNotExist'
    values?: string[]
}
