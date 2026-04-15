/* Copyright Contributors to the Open Cluster Management project */
import {
  createContext,
  type MutableRefObject,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react'

/** DOM nodes that carry wizard input metadata (e.g. for review / focus helpers). */
export enum InputReviewMeta {
  INPUT = 'input',
  /** Review UI grouping for one wizard step; not stored in the step-input registry map. */
  SECTION = 'section',
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
      path?: string
      value: unknown
      label?: string
      type: InputReviewMeta.ARRAY_INSTANCE
    }

type InputOrArrayInputMeta = Extract<InputReviewStepMeta, { type: InputReviewMeta.INPUT | InputReviewMeta.ARRAY_INPUT }>

/** DOM review tree node; built by {@link buildTree} in `./utils`. */
export type WizardDomTreeNode =
  | {
      type: InputReviewMeta.SECTION
      id: string
      label?: string
      children?: WizardDomTreeNode[]
    }
  | (Omit<InputOrArrayInputMeta, 'type'> & {
      type: InputReviewMeta.INPUT
      stepId: string
      children?: WizardDomTreeNode[]
    })
  | (Omit<InputOrArrayInputMeta, 'type'> & { type: InputReviewMeta.ARRAY_INPUT; children?: WizardDomTreeNode[] })
  | (Extract<InputReviewStepMeta, { type: InputReviewMeta.ARRAY_INSTANCE }> & { children?: WizardDomTreeNode[] })
  | { children?: WizardDomTreeNode[] }

/** Nearest wizard step id; set by each `Step` for inputs to register against. */
export const CurrentStepIdContext = createContext<string | undefined>(undefined)
CurrentStepIdContext.displayName = 'CurrentStepIdContext'

/**
 * Path segments from nested {@link InputReviewMeta.ARRAY_INPUT} and {@link InputReviewMeta.ARRAY_INSTANCE}
 * ancestors (same order as `reviewPathPrefixSegments` in `utils` `buildReviewSubtree`).
 */
export const ReviewPathPrefixSegmentsContext = createContext<readonly string[]>([])
ReviewPathPrefixSegmentsContext.displayName = 'ReviewPathPrefixSegmentsContext'

export function ReviewPathPrefixSegmentsProvider(props: { value: readonly string[]; children: ReactNode }) {
  return (
    <ReviewPathPrefixSegmentsContext.Provider value={props.value}>
      {props.children}
    </ReviewPathPrefixSegmentsContext.Provider>
  )
}

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

  return (
    <StepInputsRegistryContext.Provider value={registry}>
      <StepRegisterProvider>{props.children}</StepRegisterProvider>
    </StepInputsRegistryContext.Provider>
  )
}

export function useStepInputsRegistry(): StepInputsRegistry | null {
  return useContext(StepInputsRegistryContext)
}

// --- Step register: per-step DOM review trees (`getSteps` defines iteration order) ---

export type RegisteredWizardStep = {
  id: string
  label: string
  tree: WizardDomTreeNode
}

export type StepRegister = {
  register: (id: string, label: string) => void
  setStepTree: (id: string, tree: WizardDomTreeNode) => void
  unregister: (id: string) => void
  /** Registered steps sorted by `id` (locale-aware string order). */
  getSteps: () => readonly RegisteredWizardStep[]
  /** Incremented when any entry is added, removed, or updated. */
  version: number
}

const StepRegisterContext = createContext<StepRegister | null>(null)
StepRegisterContext.displayName = 'StepRegisterContext'

export function StepRegisterProvider(props: { children: ReactNode }) {
  const mapRef = useRef<Map<string, RegisteredWizardStep>>(new Map())
  const [version, setVersion] = useState(0)
  const bump = useCallback(() => setVersion((v) => v + 1), [])

  const register = useCallback(
    (id: string, label: string) => {
      const prev = mapRef.current.get(id)
      if (prev && prev.label === label) return
      mapRef.current.set(id, { id, label, tree: prev?.tree ?? {} })
      bump()
    },
    [bump]
  )

  const setStepTree = useCallback(
    (id: string, tree: WizardDomTreeNode) => {
      const e = mapRef.current.get(id)
      if (!e) return
      e.tree = tree
      bump()
    },
    [bump]
  )

  const unregister = useCallback(
    (id: string) => {
      if (!mapRef.current.delete(id)) return
      bump()
    },
    [bump]
  )

  const getSteps = useCallback(() => Array.from(mapRef.current.values()).sort((a, b) => a.id.localeCompare(b.id)), [])

  const value = useMemo(
    (): StepRegister => ({ register, setStepTree, unregister, getSteps, version }),
    [register, setStepTree, unregister, getSteps, version]
  )

  return <StepRegisterContext.Provider value={value}>{props.children}</StepRegisterContext.Provider>
}

export function useStepRegister(): StepRegister | null {
  return useContext(StepRegisterContext)
}

// --- Review DOM tree sync (rebuild after `__reviewStepProps` changes) ---

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

// --- Highlight path for editor / review navigation ---

export const HighlightEditorPathContext = createContext<{
  highlightEditorPath: string
  setHighlightEditorPath: (path: string) => void
}>({
  highlightEditorPath: '',
  setHighlightEditorPath: () => void 0,
})
HighlightEditorPathContext.displayName = 'HighlightEditorPathContext'

export const useHighlightEditorPath = () => useContext(HighlightEditorPathContext)

export function HighlightEditorPathProvider(props: { children: ReactNode }) {
  const [highlightEditorPath, setHighlightEditorPath] = useState('')
  const value = useMemo(() => ({ highlightEditorPath, setHighlightEditorPath }), [highlightEditorPath])
  return <HighlightEditorPathContext.Provider value={value}>{props.children}</HighlightEditorPathContext.Provider>
}
