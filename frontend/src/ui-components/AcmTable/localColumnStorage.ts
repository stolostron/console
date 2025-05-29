/* Copyright Contributors to the Open Cluster Management project */
const columnKey = 'SavedCols'
const orderKey = 'SavedColOrder'

export function setLocalStorage(key: string | undefined, value: any) {
  try {
    window.localStorage.setItem(key as string, JSON.stringify(value))
  } catch {
    // catch possible errors
  }
}

export function getLocalStorage(key: string | undefined, initialValue: object) {
  try {
    const value = window.localStorage.getItem(key as string)
    return value ? JSON.parse(value) : initialValue
  } catch {
    // if error, return initial value
    return initialValue
  }
}

export function setColumnValues(id: string, localSavedCols: string[], localSavedColOrder: string[]): void {
  if (id) {
    setLocalStorage(id + columnKey, localSavedCols)
    setLocalStorage(id + orderKey, localSavedColOrder)
  }
}

export function getColumnValues(id: string): ColumnValues {
  const localCols = getLocalStorage(id + columnKey, [])
  const localColsOrder = getLocalStorage(id + orderKey, [])

  return {
    localSavedCols: localCols,
    localSavedColOrder: localColsOrder,
  }
}

interface ColumnValues {
  localSavedCols: string[]
  localSavedColOrder: string[]
}
