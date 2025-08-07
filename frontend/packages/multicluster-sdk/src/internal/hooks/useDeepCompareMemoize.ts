/* Copyright Contributors to the Open Cluster Management project */
import * as React from 'react'
import * as _ from 'lodash'

export const useDeepCompareMemoize = <T = any>(value: T, stringify?: boolean): T | undefined => {
  const ref = React.useRef<T>()

  if (stringify ? JSON.stringify(value) !== JSON.stringify(ref.current) : !_.isEqual(value, ref.current)) {
    ref.current = value
  }

  return ref.current
}
