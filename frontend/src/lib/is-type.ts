/* Copyright Contributors to the Open Cluster Management project */

export function isType<T>(item: T | undefined): item is T {
  return !!item
}
