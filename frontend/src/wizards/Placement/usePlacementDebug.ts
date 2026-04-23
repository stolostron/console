/* Copyright Contributors to the Open Cluster Management project */
import { useEffect, useRef, useState } from 'react'
import debounce from 'debounce'
import { IPlacement } from '../common/resources/IPlacement'
import { postPlacementDebug, PlacementDebugResult } from '../../resources/placement-debug'
import { isRequestAbortedError, ResourceError } from '../../resources/utils/resource-request'

export interface PlacementDebugState {
  matched: string[]
  notMatched: string[]
  totalClusters: number
  matchedCount: number | undefined
  loading: boolean
  error: Error | undefined
}

const EMPTY_STATE: PlacementDebugState = {
  matched: [],
  notMatched: [],
  totalClusters: 0,
  matchedCount: undefined,
  loading: false,
  error: undefined,
}

let cachedSpecKey: string | undefined
let cachedState: PlacementDebugState | undefined

export function clearPlacementDebugCache() {
  cachedSpecKey = undefined
  cachedState = undefined
}

function mapDebugResult(result: PlacementDebugResult): PlacementDebugState {
  if (result.error) {
    return { ...EMPTY_STATE, error: new Error(result.error) }
  }

  const allMatched = (result.aggregatedScores ?? []).map((s) => s.clusterName)
  const limit = result.placement?.spec?.numberOfClusters
  const matched = limit !== undefined && limit >= 0 ? allMatched.slice(0, limit) : allMatched
  const matchedSet = new Set(matched)

  const notMatched: string[] = []
  for (const clusterName of allMatched) {
    if (!matchedSet.has(clusterName)) {
      notMatched.push(clusterName)
    }
  }
  for (const pipeline of result.filteredPipelineResults ?? []) {
    for (const clusterName of pipeline.filteredClusters) {
      if (!matchedSet.has(clusterName) && !notMatched.includes(clusterName)) {
        notMatched.push(clusterName)
      }
    }
  }

  return {
    matched,
    notMatched,
    totalClusters: matched.length + notMatched.length,
    matchedCount: matched.length,
    loading: false,
    error: undefined,
  }
}

export function usePlacementDebug(placement: IPlacement | undefined, enabled = true): PlacementDebugState {
  const specKey = placement ? JSON.stringify({ metadata: placement.metadata, spec: placement.spec }) : undefined

  const [state, setState] = useState<PlacementDebugState>(() => {
    if (enabled && specKey && specKey === cachedSpecKey && cachedState) {
      return cachedState
    }
    return EMPTY_STATE
  })
  const abortRef = useRef<(() => void) | undefined>(undefined)

  const debouncedFetchRef = useRef(
    debounce((p: IPlacement, fetchKey: string) => {
      abortRef.current?.()
      setState((prev) => ({ ...prev, loading: true, error: undefined }))

      const { promise, abort } = postPlacementDebug(p)
      abortRef.current = abort

      promise
        .then((result) => {
          const mapped = mapDebugResult(result)
          cachedSpecKey = fetchKey
          cachedState = mapped
          setState(mapped)
        })
        .catch((err: unknown) => {
          if (isRequestAbortedError(err)) return
          let error: Error
          if (err instanceof ResourceError) {
            const parts = [`${err.code} ${err.message}`]
            if (err.reason) parts.push(err.reason)
            error = new Error(parts.join(': '))
          } else {
            error = err instanceof Error ? err : new Error(String(err))
          }
          const errorState = { ...EMPTY_STATE, error }
          cachedSpecKey = fetchKey
          cachedState = errorState
          setState(errorState)
        })
    }, 500)
  )

  useEffect(() => {
    const debouncedFetch = debouncedFetchRef.current
    if (!enabled || !specKey || !placement) {
      setState(EMPTY_STATE)
      return
    }

    if (specKey === cachedSpecKey && cachedState) {
      setState(cachedState)
      return
    }

    setState({ ...EMPTY_STATE, loading: true })
    debouncedFetch(placement, specKey)

    return () => {
      debouncedFetch.clear()
      abortRef.current?.()
    }
    // placement is intentionally omitted — specKey is derived from it and
    // serves as the sole cache/identity key. Including placement would cause
    // spurious re-fetches on every render due to referential inequality.
  }, [specKey, enabled]) // eslint-disable-line react-hooks/exhaustive-deps

  return state
}
