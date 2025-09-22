/* Copyright Contributors to the Open Cluster Management project */

// Utility function to safely get nested properties (replaces lodash get)
export function safeGet<T = any>(obj: any, path: string | string[], defaultValue?: T): T {
  if (!obj || typeof obj !== 'object') return defaultValue as T

  const keys = Array.isArray(path) ? path : path.split('.')
  let result = obj

  for (const key of keys) {
    if (result == null || typeof result !== 'object') {
      return defaultValue as T
    }
    result = result[key]
  }

  return result === undefined ? (defaultValue as T) : result
}

/**
 * Helper function to safely get nested properties from an object
 */
export const getNestedProperty = (obj: any, path: string | number | (string | number)[], defaultValue?: any): any => {
  if (obj == null) return defaultValue

  const pathArray = Array.isArray(path) ? path : String(path).split('.')
  let result = obj

  for (const key of pathArray) {
    if (result == null) return defaultValue
    result = result[key]
  }

  return result !== undefined ? result : defaultValue
}
