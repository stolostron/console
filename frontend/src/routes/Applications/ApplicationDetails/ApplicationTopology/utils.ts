/* Copyright Contributors to the Open Cluster Management project */

// Utility function to safely get nested properties (replaces lodash get)
export function safeGet<T = any>(obj: any, path: string | string[], defaultValue?: T): T {
  if (!obj || typeof obj !== 'object') return defaultValue as T

  const keys = Array.isArray(path) ? path : path.split(/[.[\]]+/).filter((key) => key !== '')
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

// Utility function to safely set nested properties (replaces lodash set)
export function safeSet(obj: any, path: string | string[], value: any): void {
  if (!obj || typeof obj !== 'object') return

  const keys = Array.isArray(path) ? path : path.split('.')
  let current = obj

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
      current[key] = {}
    }
    current = current[key]
  }

  current[keys[keys.length - 1]] = value
}

// Deep clone utility (replaces lodash cloneDeep)
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T
  if (obj instanceof Array) return obj.map((item) => deepClone(item)) as unknown as T
  if (typeof obj === 'object') {
    const cloned = {} as T
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        cloned[key] = deepClone(obj[key])
      }
    }
    return cloned
  }
  return obj
}

/**
 * Deep equality comparison for objects
 * @param obj1 - First object to compare
 * @param obj2 - Second object to compare
 * @returns true if objects are deeply equal, false otherwise
 */
export function deepEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true
  if (obj1 == null || obj2 == null) return false
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return false

  const keys1 = Object.keys(obj1)
  const keys2 = Object.keys(obj2)

  if (keys1.length !== keys2.length) return false

  for (const key of keys1) {
    if (!keys2.includes(key)) return false
    if (!deepEqual(obj1[key], obj2[key])) return false
  }

  return true
}
