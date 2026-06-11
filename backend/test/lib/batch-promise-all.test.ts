/* Copyright Contributors to the Open Cluster Management project */
import { batchPromiseAll } from '../../src/lib/batch-promise-all'

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

  it('should process items in batches of the specified size', async () => {
    const batchesProcessed: number[][] = []
    const items = [1, 2, 3, 4, 5, 6, 7]

    await batchPromiseAll(
      items,
      (n) => {
        if (batchesProcessed.length === 0 || batchesProcessed[batchesProcessed.length - 1].length >= 3) {
          batchesProcessed.push([])
        }
        batchesProcessed[batchesProcessed.length - 1].push(n)
        return Promise.resolve(n)
      },
      3
    )

    expect(batchesProcessed).toEqual([[1, 2, 3], [4, 5, 6], [7]])
  })

  it('should yield the event loop between batches', async () => {
    let yielded = false
    const items = [1, 2, 3, 4]

    const originalSetImmediate = global.setImmediate
    global.setImmediate = ((fn: () => void) => {
      yielded = true
      return originalSetImmediate(fn)
    }) as typeof setImmediate

    await batchPromiseAll(items, (n) => Promise.resolve(n), 2)

    global.setImmediate = originalSetImmediate
    expect(yielded).toBe(true)
  })

  it('should not yield after the last batch', async () => {
    let yieldCount = 0
    const items = [1, 2, 3]

    const originalSetImmediate = global.setImmediate
    global.setImmediate = ((fn: () => void) => {
      yieldCount++
      return originalSetImmediate(fn)
    }) as typeof setImmediate

    await batchPromiseAll(items, (n) => Promise.resolve(n), 3)

    global.setImmediate = originalSetImmediate
    expect(yieldCount).toBe(0)
  })

  it('should use default batch size of 100', async () => {
    const items = Array.from({ length: 250 }, (_, i) => i)
    let batchCount = 0
    let currentBatchSize = 0

    await batchPromiseAll(items, (n) => {
      currentBatchSize++
      if (currentBatchSize === 100) {
        batchCount++
        currentBatchSize = 0
      }
      return Promise.resolve(n)
    })

    expect(batchCount).toBe(2)
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
