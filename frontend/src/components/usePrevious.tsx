/* Copyright Contributors to the Open Cluster Management project */

import { useRef, useEffect } from 'react'

/**
 * Custom React hook that returns the previous value of a variable from the last render.
 *
 * @template T The type of the value being tracked
 * @param {T} value The current value to compare against its previous state
 * @returns {T} The value from the previous render cycle
 *
 */

export function usePrevious<T>(value: T): T {
  const ref = useRef<T>()
  useEffect(() => {
    ref.current = value
  }, [value])
  return ref.current as T
}
