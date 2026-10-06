/* Copyright Contributors to the Open Cluster Management project */

import { sortColumnsForManageModal } from './AcmManageColumn'
import { IAcmTableColumn } from './AcmTableTypes'

describe('sortColumnsForManageModal', () => {
  const column = (id: string, order: number): IAcmTableColumn<unknown> => ({
    id,
    order,
    header: id,
    cell: () => '',
  })

  test('orders by colOrderIds then appends missing ids', () => {
    const allCols = [column('a', 1), column('b', 2), column('gpu-count', 12)]
    const ids = sortColumnsForManageModal(['a', 'b'], allCols).map((c) => c.id)
    expect(ids).toEqual(['a', 'b', 'gpu-count'])
  })

  test('appends a new column without reordering saved ids', () => {
    const allCols = [column('name', 1), column('clusters', 4), column('sources', 5), column('labels', 6)]
    const ids = sortColumnsForManageModal(['name', 'clusters', 'labels'], allCols).map((c) => c.id)
    expect(ids).toEqual(['name', 'clusters', 'labels', 'sources'])
  })

  test('skips unknown ids in colOrderIds', () => {
    const allCols = [column('a', 1)]
    const ids = sortColumnsForManageModal(['a', 'removed-col'], allCols).map((c) => c.id)
    expect(ids).toEqual(['a'])
  })

  test('ignores action columns and columns without id', () => {
    const allCols: IAcmTableColumn<unknown>[] = [
      column('a', 1),
      { header: 'x', isActionCol: true } as IAcmTableColumn<unknown>,
      { header: 'no id' } as IAcmTableColumn<unknown>,
    ]
    const ids = sortColumnsForManageModal(['a'], allCols).map((c) => c.id)
    expect(ids).toEqual(['a'])
  })
})
