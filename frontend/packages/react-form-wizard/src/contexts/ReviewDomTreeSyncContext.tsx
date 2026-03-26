/* Copyright Contributors to the Open Cluster Management project */
import { createContext, ReactNode, useCallback, useContext, useState } from 'react'

const ReviewDomTreeVersionContext = createContext(0)

const ReviewDomTreeBumpContext = createContext<(() => void) | undefined>(undefined)

/** Bumps a version consumed by ReviewStep so the wizard DOM review tree is rebuilt after `__reviewStepProps` changes. */
export function ReviewDomTreeSyncProvider(props: { children: ReactNode }) {
  const [version, setVersion] = useState(0)
  const bump = useCallback(() => setVersion((v) => v + 1), [])
  return (
    <ReviewDomTreeVersionContext.Provider value={version}>
      <ReviewDomTreeBumpContext.Provider value={bump}>{props.children}</ReviewDomTreeBumpContext.Provider>
    </ReviewDomTreeVersionContext.Provider>
  )
}

export function useReviewDomTreeVersion(): number {
  return useContext(ReviewDomTreeVersionContext)
}

export function useBumpReviewDomTree(): (() => void) | undefined {
  return useContext(ReviewDomTreeBumpContext)
}
