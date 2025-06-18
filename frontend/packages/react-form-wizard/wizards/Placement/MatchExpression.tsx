import { Flex } from '@patternfly/react-core'
import { Fragment } from 'react'
import set from 'set-value'
import { WizSelect, WizMultiSelect, WizSingleSelect, WizStringsInput, WizTextInput } from '../../src'
import { DisplayMode, useDisplayMode } from '../../src/contexts/DisplayModeContext'
import { ItemContext, useItem } from '../../src/contexts/ItemContext'
import { IExpression } from '../common/resources/IMatchExpression'

export function MatchExpression(props: { labelValuesMap?: Record<string, string[]> }) {
    const labelValuesMap = props.labelValuesMap
    return (
        <Flex style={{ rowGap: 16 }}>
            {labelValuesMap ? (
                <WizSingleSelect
                    label="Label"
                    path="key"
                    options={Object.keys(labelValuesMap)}
                    isCreatable
                    required
                    onValueChange={(_value, item) => set(item as object, 'values', [])}
                />
            ) : (
                <WizTextInput label="Label" path="key" required onValueChange={(_value, item) => set(item as object, 'values', [])} />
            )}
            <WizSelect
                label="Operator"
                path="operator"
                options={[
                    { label: 'equals any of', value: 'In' },
                    { label: 'does not equal any of', value: 'NotIn' },
                    { label: 'exists', value: 'Exists' },
                    { label: 'does not exist', value: 'DoesNotExist' },
                ]}
                required
                onValueChange={(value, item) => {
                    switch (value) {
                        case 'Exists':
                        case 'DoesNotExist':
                            set(item, 'values', undefined)
                            break
                    }
                }}
            />
            {labelValuesMap ? (
                <ItemContext.Consumer>
                    {(item: IExpression) => {
                        const selectedLabel = item.key ?? ''
                        const values = labelValuesMap[selectedLabel] ?? []
                        return (
                            <WizMultiSelect
                                label="Values"
                                path="values"
                                isCreatable
                                required
                                hidden={(labelSelector) => !['In', 'NotIn'].includes(labelSelector?.operator)}
                                options={values}
                            />
                        )
                    }}
                </ItemContext.Consumer>
            ) : (
                <WizStringsInput
                    label="Values"
                    path="values"
                    required
                    hidden={(labelSelector) => !['In', 'NotIn'].includes(labelSelector?.operator)}
                />
            )}
        </Flex>
    )
}

export function MatchExpressionCollapsed() {
    const expression = useItem() as IExpression
    return <MatchExpressionSummary expression={expression} />
}

export function MatchExpressionSummary(props: { expression: IExpression }) {
    const { expression } = props

    let operator = 'unknown'
    switch (expression?.operator) {
        case 'In':
            if (expression.values && expression.values.length > 1) {
                operator = 'equals any of'
            } else {
                operator = 'equals'
            }
            break
        case 'NotIn':
            if (expression.values && expression.values.length > 1) {
                operator = 'does not equal any of'
            } else {
                operator = 'does not equal'
            }
            break
        case 'Exists':
            operator = 'exists'
            break
        case 'DoesNotExist':
            operator = 'does not exist'
            break
    }

    const displayMode = useDisplayMode()

    if (!expression?.key) {
        if (displayMode === DisplayMode.Details) return <Fragment />
        return <div>Expand to enter expression</div>
    }

    return (
        <div>
            {expression?.key} {operator} {expression?.values?.map((value) => value).join(', ')}
        </div>
    )
}
