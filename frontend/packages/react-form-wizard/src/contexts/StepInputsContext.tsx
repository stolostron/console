/* Copyright Contributors to the Open Cluster Management project */
import { createContext, type MutableRefObject, type ReactNode, useCallback, useContext, useMemo, useRef } from 'react'

/** DOM nodes that carry wizard input metadata (e.g. for review / focus helpers). */
export enum InputReviewMeta {
  INPUT = 'input',
  STEP = 'step',
  ARRAY_INPUT = 'arrayInput',
  ARRAY_INSTANCE = 'arrayInstance',
}
/** DOM metadata for review / focus: wizard step container vs. individual inputs. */
export type InputReviewStepMeta =
  | {
      id: string
      path: string
      value: unknown
      label?: string
      error: string | undefined
      type: InputReviewMeta.INPUT
      /** Nearest enclosing wizard step `id` (set when building the review DOM tree). */
      stepId?: string
    }
  | {
      id: string
      path: string
      value: unknown
      label?: string
      error: string | undefined
      type: InputReviewMeta.ARRAY_INPUT
    }
  | {
      id: string
      label?: string
      type: InputReviewMeta.STEP
    }
  | {
      /** Index segment within the parent array (`String(index)`); merged with parent ARRAY_INPUT path in the review DOM tree. */
      path?: string
      value: unknown
      label?: string
      type: InputReviewMeta.ARRAY_INSTANCE
    }

/** Nearest wizard step id; set by each `Step` for inputs to register against. */
export const CurrentStepIdContext = createContext<string | undefined>(undefined)
CurrentStepIdContext.displayName = 'CurrentStepIdContext'

export type StepInputsRegistry = {
  register: (inputId: string, entry: InputReviewStepMeta) => void
  unregister: (inputId: string) => void
  /** Live map of registered input id → review metadata; same ref for the provider lifetime. */
  get: () => MutableRefObject<Map<string, InputReviewStepMeta>>
}

const StepInputsRegistryContext = createContext<StepInputsRegistry | null>(null)
StepInputsRegistryContext.displayName = 'StepInputsRegistryContext'

export function StepInputsRegistryProvider(props: { children: ReactNode }) {
  const inputMapRef = useRef<Map<string, InputReviewStepMeta>>(new Map())

  const register = useCallback((inputId: string, entry: InputReviewStepMeta) => {
    inputMapRef.current.set(inputId, entry)
  }, [])

  const unregister = useCallback((inputId: string) => {
    inputMapRef.current.delete(inputId)
  }, [])

  const get = useCallback(() => inputMapRef, [])

  const registry = useMemo((): StepInputsRegistry => ({ register, unregister, get }), [register, unregister, get])

  return <StepInputsRegistryContext.Provider value={registry}>{props.children}</StepInputsRegistryContext.Provider>
}

export function useStepInputsRegistry(): StepInputsRegistry | null {
  return useContext(StepInputsRegistryContext)
}
