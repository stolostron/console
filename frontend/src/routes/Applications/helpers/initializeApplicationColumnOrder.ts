/* Copyright Contributors to the Open Cluster Management project */

import {
  getColumnValues,
  getLocalStorage,
  setColumnValues,
  setLocalStorage,
} from '~/ui-components/AcmTable/localColumnStorage'
import {
  DEFAULT_SORT,
  getItemWithExpiration,
  setItemWithExpiration,
} from '~/ui-components/AcmTable/AcmTableStateProvider'

export const APPLICATIONS_TABLE_ID = 'applicationTable'
const MODEL_COLUMN_ORDER_INITIALIZED_KEY = `${APPLICATIONS_TABLE_ID}.model-column-order-initialized`
const TABLE_STATE_KEY = 'applications-overview-table-state'
const CURRENT_COLUMN_IDS = [
  'name',
  'type',
  'model',
  'namespace',
  'clusters',
  'sources',
  'labels',
  'health',
  'sync',
  'pod',
  'created',
]
const REQUIRED_COLUMN_IDS = ['name', 'namespace', 'clusters']
const DEFAULT_VISIBLE_IDS = CURRENT_COLUMN_IDS.filter((id) => id !== 'sources' && id !== 'created')

function migrateSort(key: string, previousVisible: string[], nextVisible: string[]) {
  const raw = getItemWithExpiration(key)
  if (!raw) return
  let migrated = DEFAULT_SORT
  try {
    const sort: unknown = JSON.parse(raw)
    // Search can intentionally clear the active sort while retaining preFilterSort.
    if (sort && typeof sort === 'object' && !Array.isArray(sort) && !('index' in sort)) return
    if (sort && typeof sort === 'object' && 'index' in sort && typeof sort.index === 'number') {
      const column = previousVisible[sort.index]
      const index = nextVisible.indexOf(column)
      if (index >= 0) migrated = { ...sort, index }
    }
  } catch {
    // Corrupt or removed sort columns fall back to the table's default.
  }
  setItemWithExpiration(key, JSON.stringify(migrated))
}

export function initializeApplicationColumnOrder() {
  if (getLocalStorage(MODEL_COLUMN_ORDER_INITIALIZED_KEY, { initialized: false })?.initialized === true) return

  const { localSavedCols, localSavedColOrder } = getColumnValues(APPLICATIONS_TABLE_ID)
  if (localSavedColOrder.includes('type')) {
    const order = localSavedColOrder.filter((id) => id !== 'model')
    order.splice(order.indexOf('type') + 1, 0, 'model')
    const selected =
      localSavedCols.length > 0 && !localSavedColOrder.includes('model') ? [...localSavedCols, 'model'] : localSavedCols
    const visible = (ids: string[], selection: string[]) =>
      ids.filter(
        (id) =>
          REQUIRED_COLUMN_IDS.includes(id) ||
          (selection.length === 0 ? DEFAULT_VISIBLE_IDS.includes(id) : selection.includes(id))
      )
    const before = visible(localSavedColOrder, localSavedCols)
    const after = visible(order, selected).filter((id) => CURRENT_COLUMN_IDS.includes(id))
    migrateSort(`${TABLE_STATE_KEY}-sort`, before, after)
    migrateSort(`${TABLE_STATE_KEY}-preFilterSort`, before, after)
    setColumnValues(APPLICATIONS_TABLE_ID, selected, order)
  }

  setLocalStorage(MODEL_COLUMN_ORDER_INITIALIZED_KEY, { initialized: true })
}
