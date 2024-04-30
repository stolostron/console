/* Copyright Contributors to the Open Cluster Management project */

import { TFunction } from 'react-i18next'
import { ReactNode } from 'react'

export function useDynamicPropertyValues<
  Control extends Record<string, ((control: Control, controlData: unknown, t: TFunction) => ReactNode) | ReactNode>,
  DynamicProperty extends keyof Control,
>(
  control: Control,
  controlData: unknown,
  t: TFunction,
  dynamicProperties: DynamicProperty[]
): Record<DynamicProperty, ReactNode> {
  const values = {} as Record<DynamicProperty, ReactNode>
  dynamicProperties.forEach((key) => {
    const property = control[key]
    if (typeof property === 'function') {
      values[key] = property(control, controlData, t)
    } else {
      values[key] = property as ReactNode
    }
  })
  return values
}
