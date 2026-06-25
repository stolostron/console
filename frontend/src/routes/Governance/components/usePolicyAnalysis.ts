/* Copyright Contributors to the Open Cluster Management project */

import { useCallback, useRef, useState } from 'react'
import { getBackendUrl, postRequest } from '../../../resources/utils'
import type { IResource } from '../../../resources'

export interface DiagnosisResult {
  summary: string
  confidence: string
  rootCause: string
}

export interface PolicyAnalysisResponse {
  phase: string
  readyToDeploy?: boolean
  optionTitle?: string
  diagnosis?: DiagnosisResult
  error?: string
}

interface CachedAnalysis {
  result: PolicyAnalysisResponse
  resourcesHash: string
}

function computeResourcesHash(resources: IResource[]): string {
  const str = JSON.stringify(resources)
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0
  }
  return hash.toString(36)
}

export function runPolicyAnalysis(resources: IResource[]): {
  promise: Promise<PolicyAnalysisResponse>
  abort: () => void
} {
  const url = getBackendUrl() + '/policy-analysis'
  return postRequest<{ resources: IResource[] }, PolicyAnalysisResponse>(url, { resources })
}

export function usePolicyAnalysisCache() {
  const cacheRef = useRef<CachedAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const abortRef = useRef<(() => void) | null>(null)

  const setCachedAnalysis = useCallback((result: PolicyAnalysisResponse, resources: IResource[]) => {
    cacheRef.current = { result, resourcesHash: computeResourcesHash(resources) }
  }, [])

  const ensureAnalysis = useCallback(async (resources: IResource[]): Promise<PolicyAnalysisResponse> => {
    const currentHash = computeResourcesHash(resources)
    if (cacheRef.current && cacheRef.current.resourcesHash === currentHash) {
      return cacheRef.current.result
    }

    setIsAnalyzing(true)
    const { promise, abort } = runPolicyAnalysis(resources)
    abortRef.current = abort
    try {
      const result = await promise
      cacheRef.current = { result, resourcesHash: currentHash }
      return result
    } finally {
      setIsAnalyzing(false)
      abortRef.current = null
    }
  }, [])

  const getCachedResult = useCallback((resources: IResource[]): PolicyAnalysisResponse | null => {
    const currentHash = computeResourcesHash(resources)
    if (cacheRef.current && cacheRef.current.resourcesHash === currentHash) {
      return cacheRef.current.result
    }
    return null
  }, [])

  const cancelAnalysis = useCallback(() => {
    abortRef.current?.()
  }, [])

  return { isAnalyzing, setCachedAnalysis, getCachedResult, ensureAnalysis, cancelAnalysis }
}
