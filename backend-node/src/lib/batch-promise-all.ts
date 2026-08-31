/* Copyright Contributors to the Open Cluster Management project */

export const BATCH_SIZE = 100

/**
 * Process an array of items through an async mapper in batches, yielding the
 * event loop between batches to allow HTTP requests (e.g. liveness probes) to
 * be served.
 */
export async function batchPromiseAll<T, R>(items: T[], mapper: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = []
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = await Promise.all(items.slice(i, i + BATCH_SIZE).map(mapper))
    results.push(...batch)
    if (i + BATCH_SIZE < items.length) {
      await new Promise((resolve) => setImmediate(resolve))
    }
  }
  return results
}
