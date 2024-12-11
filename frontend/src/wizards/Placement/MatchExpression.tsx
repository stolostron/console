/* Copyright Contributors to the Open Cluster Management project */
import { Flex } from '@patternfly/react-core'
import { Fragment } from 'react'
import set from 'set-value'
import {
  ItemContext,
  useItem,
  WizSelect,
  WizMultiSelect,
  WizSingleSelect,
  WizStringsInput,
  WizTextInput,
  DisplayMode,
  useDisplayMode,
} from '@patternfly-labs/react-form-wizard'
import { IExpression } from '../common/resources/IMatchExpression'
import { useTranslation } from '../../lib/acm-i18next'

export function MatchExpression(props: { labelValuesMap?: Record<string, string[]> }) {
  const labelValuesMap = props.labelValuesMap
  const { t } = useTranslation()
  return (
    <Flex style={{ rowGap: 16 }}>
      {labelValuesMap ? (
        <WizSingleSelect
          label={t('Label')}
          placeholder={t('Select the label')}
          path="key"
          options={Object.keys(labelValuesMap)}
          isCreatable
          required
          onValueChange={(_value, item) => set(item as object, 'values', [])}
        />
      ) : (
        <WizTextInput
          label={t('Label')}
          path="key"
          required
          onValueChange={(_value, item) => set(item as object, 'values', [])}
        />
      )}
      <WizSelect
        label={t('Operator')}
        path="operator"
        options={[
          { label: t('equals any of'), value: 'In' },
          { label: t('does not equal any of'), value: 'NotIn' },
          { label: t('exists'), value: 'Exists' },
          { label: t('does not exist'), value: 'DoesNotExist' },
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
                label={t('Values')}
                placeholder={t('Select the values')}
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
          label={t('Values')}
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
  const { t } = useTranslation()
  let operator = t('unknown')
  switch (expression?.operator) {
    case 'In':
      if (expression.values && expression.values.length > 1) {
        operator = t('equals any of')
      } else {
        operator = t('equals')
      }
      break
    case 'NotIn':
      if (expression.values && expression.values.length > 1) {
        operator = t('does not equal any of')
      } else {
        operator = t('does not equal')
      }
      break
    case 'Exists':
      operator = t('exists')
      break
    case 'DoesNotExist':
      operator = t('does not exist')
      break
  }

  const displayMode = useDisplayMode()

  if (!expression?.key) {
    if (displayMode === DisplayMode.Details) return <Fragment />
    return <div>{t('Expand to enter expression')}</div>
  }

  return (
    <div>
      {expression?.key} {operator} {expression?.values?.map((value) => value).join(', ')}
    </div>
  )
}
