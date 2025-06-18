export interface IExpression {
    key?: string
    operator?: 'In' | 'NotIn' | 'Exists' | 'DoesNotExist'
    values?: string[]
}
