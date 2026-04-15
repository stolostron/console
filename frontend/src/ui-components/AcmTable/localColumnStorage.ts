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

/** Persists selected column ids and their order for a table identified by `id`. */
export function setColumnValues(id: string, localSavedCols: string[], localSavedColOrder: string[]): void {
  if (id) {
    setLocalStorage(id + columnKey, localSavedCols)
    setLocalStorage(id + orderKey, localSavedColOrder)
  }
}

/** Coerces parsed localStorage values to string[] (ignores corrupt or legacy non-array shapes). */
function toPersistedColumnIdArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }
  return value.filter((item): item is string => typeof item === 'string')
}

/** Reads persisted column selection and order for a table, or empty arrays if unset. */
export function getColumnValues(id: string): ColumnValues {
  const localCols = getLocalStorage(id + columnKey, [])
  const localColsOrder = getLocalStorage(id + orderKey, [])

  return {
    localSavedCols: toPersistedColumnIdArray(localCols),
    localSavedColOrder: toPersistedColumnIdArray(localColsOrder),
  }
}

interface ColumnValues {
  localSavedCols: string[]
  localSavedColOrder: string[]
}

/**
 * Returns a copy of `ids` with duplicate strings removed, preserving first-seen order.
 * Used when merging column id lists so required and default columns cannot appear twice.
 */
export function dedupeColumnIdsPreserveOrder(ids: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const id of ids) {
    if (!seen.has(id)) {
      seen.add(id)
      out.push(id)
    }
  }
  return out
}

/**
 * Builds the initial selected column id list from localStorage and current table column definitions.
 *
 * When the product adds new manageable columns after a user has already saved preferences, ids that
 * appear in `defaultOrderIds` but not in the persisted order baseline are treated as new. Optional
 * columns that should be visible by default (`defaultColIds`, e.g. `isFirstVisitChecked`) are then
 * merged in so upgrades behave like a first visit for those columns, without turning back on columns
 * the user had hidden (still listed in the saved order).
 *
 * @param localSavedCols - Column ids last persisted for this table (full selection set).
 * @param localSavedColOrder - Column ids in the user’s saved order; used to detect newly shipped columns.
 * @param requiredColIds - Columns marked `isDefault` (always shown).
 * @param defaultColIds - Columns that should be selected by default (`isDefault` or `isFirstVisitChecked`).
 * @param defaultOrderIds - All non-action column ids in default display order.
 * @returns Selected column ids for `AcmTable` state, deduped in order.
 */
export function mergePersistedSelectedColumnIds({
  localSavedCols,
  localSavedColOrder,
  requiredColIds,
  defaultColIds,
  defaultOrderIds,
}: {
  localSavedCols: string[]
  localSavedColOrder: string[]
  requiredColIds: string[]
  defaultColIds: string[]
  defaultOrderIds: string[]
}): string[] {
  if (localSavedCols.length === 0) {
    return dedupeColumnIdsPreserveOrder([...requiredColIds, ...defaultColIds])
  }
  const orderBaseline = localSavedColOrder.length > 0 ? localSavedColOrder : defaultOrderIds
  const newColIdsFromRelease = defaultOrderIds.filter((id) => !orderBaseline.includes(id))
  const newDefaultVisibleIds = defaultColIds.filter(
    (id) => newColIdsFromRelease.includes(id) && !requiredColIds.includes(id)
  )
  return dedupeColumnIdsPreserveOrder([
    ...requiredColIds,
    ...localSavedCols.filter((val) => !requiredColIds.includes(val)),
    ...newDefaultVisibleIds,
  ])
}
