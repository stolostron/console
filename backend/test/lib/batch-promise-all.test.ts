/* Copyright Contributors to the Open Cluster Management project */
import { batchPromiseAll, BATCH_SIZE } from '../../src/lib/batch-promise-all'

describe('batchPromiseAll', () => {
  it('should process all items and return results in order', async () => {
    const items = [1, 2, 3, 4, 5]
    const results = await batchPromiseAll(items, (n) => Promise.resolve(n * 2))
    expect(results).toEqual([2, 4, 6, 8, 10])
  })

  it('should handle empty arrays', async () => {
    const results = await batchPromiseAll([], (n: number) => Promise.resolve(n))
    expect(results).toEqual([])
  })

  it('should process items in batches', async () => {
    const items = Array.from({ length: BATCH_SIZE * 2 + 3 }, (_, i) => i)
    const batchesProcessed: number[][] = []

    await batchPromiseAll(items, (n) => {
      const last = batchesProcessed[batchesProcessed.length - 1]
      if (!last || last.length >= BATCH_SIZE) {
        batchesProcessed.push([])
      }
      batchesProcessed[batchesProcessed.length - 1].push(n)
      return Promise.resolve(n)
    })

    expect(batchesProcessed.length).toBe(3)
    expect(batchesProcessed[0].length).toBe(BATCH_SIZE)
    expect(batchesProcessed[1].length).toBe(BATCH_SIZE)
    expect(batchesProcessed[2].length).toBe(3)
  })

  it('should yield the event loop between batches', async () => {
    let yielded = false
    const items = Array.from({ length: BATCH_SIZE + 1 }, (_, i) => i)

    const originalSetImmediate = global.setImmediate
    global.setImmediate = ((fn: () => void) => {
      yielded = true
      return originalSetImmediate(fn)
    }) as typeof setImmediate

    try {
      await batchPromiseAll(items, (n) => Promise.resolve(n))
    } finally {
      global.setImmediate = originalSetImmediate
    }
    expect(yielded).toBe(true)
  })

  it('should not yield after the last batch', async () => {
    let yieldCount = 0
    const items = Array.from({ length: BATCH_SIZE }, (_, i) => i)

    const originalSetImmediate = global.setImmediate
    global.setImmediate = ((fn: () => void) => {
      yieldCount++
      return originalSetImmediate(fn)
    }) as typeof setImmediate

    try {
      await batchPromiseAll(items, (n) => Promise.resolve(n))
    } finally {
      global.setImmediate = originalSetImmediate
    }
    expect(yieldCount).toBe(0)
  })

  it('should propagate errors from the mapper', async () => {
    const items = [1, 2, 3]
    await expect(
      batchPromiseAll(items, (n) => {
        if (n === 2) return Promise.reject(new Error('test error'))
        return Promise.resolve(n)
      })
    ).rejects.toThrow('test error')
  })
})
