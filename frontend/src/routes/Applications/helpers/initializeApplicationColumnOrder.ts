/* Copyright Contributors to the Open Cluster Management project */

import {
  getColumnValues,
  getLocalStorage,
  setColumnValues,
  setLocalStorage,
} from '~/ui-components/AcmTable/localColumnStorage'

export const APPLICATIONS_TABLE_ID = 'applicationTable'
const MODEL_COLUMN_ORDER_INITIALIZED_KEY = `${APPLICATIONS_TABLE_ID}.model-column-order-initialized`

export function initializeApplicationColumnOrder() {
  if (getLocalStorage(MODEL_COLUMN_ORDER_INITIALIZED_KEY, { initialized: false })?.initialized === true) return

  const { localSavedCols, localSavedColOrder } = getColumnValues(APPLICATIONS_TABLE_ID)
  if (localSavedColOrder.includes('type')) {
    const order = localSavedColOrder.filter((id) => id !== 'model')
    order.splice(order.indexOf('type') + 1, 0, 'model')
    const selected =
      localSavedCols.length > 0 && !localSavedColOrder.includes('model') ? [...localSavedCols, 'model'] : localSavedCols
    setColumnValues(APPLICATIONS_TABLE_ID, selected, order)
  }

  setLocalStorage(MODEL_COLUMN_ORDER_INITIALIZED_KEY, { initialized: true })
}
