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

  test('orders by colOrderIds then appends ids not in the saved order', () => {
    const allCols = [column('a', 1), column('b', 2), column('gpu-count', 12)]
    const ids = sortColumnsForManageModal(['a', 'b'], allCols).map((c) => c.id)
    expect(ids).toEqual(['a', 'b', 'gpu-count'])
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
