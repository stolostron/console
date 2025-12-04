/* Copyright Contributors to the Open Cluster Management project */
import * as React from 'react'
import { isEqual } from 'lodash'

/**
 * Custom hook to memoize a value using deep comparison. Useful for preventing unnecessary re-renders when a calling component creates a new object on every call.
 *
 * @param value - The value to memoize
 * @param stringify - Whether to stringify the value
 * @returns A tuple containing the memoized value and a boolean indicating if the value has changed
 */
export const useDeepCompareMemoize = <T = any>(value: T, stringify?: boolean): [T | undefined, boolean] => {
  const ref = React.useRef<T>()

  if (stringify ? JSON.stringify(value) !== JSON.stringify(ref.current) : !isEqual(value, ref.current)) {
    ref.current = value
    return [ref.current, true]
  }

  return [ref.current, false]
}
