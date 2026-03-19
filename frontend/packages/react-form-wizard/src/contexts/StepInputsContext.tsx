/* Copyright Contributors to the Open Cluster Management project */
import { createContext, ReactNode, useCallback, useContext, useMemo, useRef, useState } from 'react'

export type StepInputEntry = {
  stepId: string
  path: string
  value: unknown
  label?: string
  error?: string
}

type Slot = { refCount: number; entry: Omit<StepInputEntry, 'stepId'> }

export type StepInputsRegistry = {
  register: (stepId: string, inputKey: string, entry: Omit<StepInputEntry, 'stepId'>) => void
  unregister: (stepId: string, inputKey: string) => void
}

const StepInputsRegistryContext = createContext<StepInputsRegistry | null>(null)
StepInputsRegistryContext.displayName = 'StepInputsRegistryContext'

export const StepInputsContext = createContext<readonly StepInputEntry[]>([])
StepInputsContext.displayName = 'StepInputsContext'

/** Nearest wizard step id; set by each `Step` for inputs to register against. */
export const CurrentStepIdContext = createContext<string | undefined>(undefined)
CurrentStepIdContext.displayName = 'CurrentStepIdContext'

function buildSnapshot(slots: Map<string, Map<string, Slot>>): StepInputEntry[] {
  const out: StepInputEntry[] = []
  for (const [stepId, stepMap] of slots) {
    for (const slot of stepMap.values()) {
      out.push({
        stepId,
        path: slot.entry.path,
        value: slot.entry.value,
        label: slot.entry.label,
        error: slot.entry.error,
      })
    }
  }
  return out
}

export function StepInputsRegistryProvider(props: { children: ReactNode }) {
  const [version, setVersion] = useState(0)
  const slotsRef = useRef<Map<string, Map<string, Slot>>>(new Map())

  const bump = useCallback(() => setVersion((v) => v + 1), [])

  const register = useCallback(
    (stepId: string, inputKey: string, entry: Omit<StepInputEntry, 'stepId'>) => {
      let stepMap = slotsRef.current.get(stepId)
      if (!stepMap) {
        stepMap = new Map()
        slotsRef.current.set(stepId, stepMap)
      }
      const existing = stepMap.get(inputKey)
      if (existing) {
        existing.refCount += 1
        existing.entry = entry
      } else {
        stepMap.set(inputKey, { refCount: 1, entry })
      }
      bump()
    },
    [bump]
  )

  const unregister = useCallback(
    (stepId: string, inputKey: string) => {
      const stepMap = slotsRef.current.get(stepId)
      if (!stepMap) return
      const existing = stepMap.get(inputKey)
      if (!existing) return
      existing.refCount -= 1
      if (existing.refCount <= 0) {
        stepMap.delete(inputKey)
      }
      if (stepMap.size === 0) {
        slotsRef.current.delete(stepId)
      }
      bump()
    },
    [bump]
  )

  const registry = useMemo((): StepInputsRegistry => ({ register, unregister }), [register, unregister])

  const snapshot = useMemo(() => {
    void version
    return buildSnapshot(slotsRef.current)
  }, [version])

  return (
    <StepInputsRegistryContext.Provider value={registry}>
      <StepInputsContext.Provider value={snapshot}>{props.children}</StepInputsContext.Provider>
    </StepInputsRegistryContext.Provider>
  )
}

export function useStepInputsRegistry(): StepInputsRegistry | null {
  return useContext(StepInputsRegistryContext)
}

/** All registered step inputs (path, value, label, validation error) keyed by wizard step id; updates when value or error changes. */
export function useStepInputs(): readonly StepInputEntry[] {
  return useContext(StepInputsContext)
}
