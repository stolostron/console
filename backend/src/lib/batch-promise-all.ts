/* Copyright Contributors to the Open Cluster Management project */

/**
 * Process an array of items through an async mapper in batches, yielding the
 * event loop between batches to allow HTTP requests (e.g. liveness probes) to
 * be served.
 */
export async function batchPromiseAll<T, R>(
  items: T[],
  mapper: (item: T) => Promise<R>,
  batchSize = 100
): Promise<R[]> {
  const results: R[] = []
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = await Promise.all(items.slice(i, i + batchSize).map(mapper))
    results.push(...batch)
    if (i + batchSize < items.length) {
      await new Promise((resolve) => setImmediate(resolve))
    }
  }
  return results
}
