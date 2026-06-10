/* Copyright Contributors to the Open Cluster Management project */
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react'
import useResizeObserver from '@react-hook/resize-observer'
import { editor as editorTypes } from 'monaco-editor'
import { DiffEditor, Monaco } from '@monaco-editor/react'
import { defineThemes, getTheme, mountTheme } from '../theme'
import { ChangeHandler } from 'react-monaco-editor'

export interface SyncEditorDiffHandle {
  previous: () => void
  next: () => void
  /** When the diff view is mounted, the diff editor instance (e.g. Find). */
  getDiffEditor: () => editorTypes.IStandaloneDiffEditor | null
  /** When the diff view is mounted, the original (left) editor. */
  getOriginalEditor: () => editorTypes.IStandaloneCodeEditor | null
  /** When the diff view is mounted, the modified-side editor (for copy/selection). */
  getModifiedEditor: () => editorTypes.IStandaloneCodeEditor | null
  /** When the diff view is mounted, the Monaco API instance used by the diff editor. */
  getDiffEditorMonaco: () => Monaco | null
}

export interface SyncEditorDiffProps {
  showChanges: boolean
  /** Initial wizard resources for the left (original) diff pane. */
  defaultResources?: unknown
  mock?: boolean
  /** Notifies parent when either diff pane gains or loses text focus. */
  onDiffEditorFocusChange: (focused: boolean) => void
  /** Observed for layout when the editor page resizes. */
  resizeRootRef: RefObject<HTMLDivElement>
  /** Called when the modified (editable) side of the diff changes. */
  onChange?: ChangeHandler
  /** Invoked after a diff editor is created and again right before it is disposed (parent can re-run form sync). */
  onDiffEditorInstanceChange?: () => void
  /** Invoked when diff editor/monaco refs are set or cleared so the parent can update active editor instances. */
  onActiveInstancesChange?: () => void
}

const TOOLBAR_IDS_SKIP_DIFF_BLUR = [
  'undo-button',
  'redo-button',
  'compare-changes-button',
  'diff-prev-button',
  'diff-next-button',
] as const

const SIDE_BY_SIDE_BREAKPOINT_PX = 800

const DIFF_EDITOR_OPTIONS: editorTypes.IDiffEditorConstructionOptions = {
  originalEditable: false,
  automaticLayout: false,
  scrollBeyondLastLine: true,
  minimap: { enabled: false },
  quickSuggestions: false,
  lightbulb: { enabled: false },
}

export const SyncEditorDiff = forwardRef<SyncEditorDiffHandle, SyncEditorDiffProps>(function SyncEditorDiff(
  {
    showChanges,
    defaultResources,
    mock,
    onDiffEditorFocusChange,
    resizeRootRef,
    onChange,
    onDiffEditorInstanceChange,
    onActiveInstancesChange,
  },
  ref
) {
  const diffContainerRef = useRef<HTMLDivElement>(null)
  const diffEditorRef = useRef<editorTypes.IStandaloneDiffEditor | null>(null)
  const diffMonacoRef = useRef<Monaco | null>(null)
  const diffNavigatorRef = useRef<editorTypes.IDiffNavigator | null>(null)
  const mountDisposablesRef = useRef<{ dispose: () => void }[]>([])
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const onDiffEditorFocusChangeRef = useRef(onDiffEditorFocusChange)
  onDiffEditorFocusChangeRef.current = onDiffEditorFocusChange
  const onDiffEditorInstanceChangeRef = useRef(onDiffEditorInstanceChange)
  onDiffEditorInstanceChangeRef.current = onDiffEditorInstanceChange
  const onActiveInstancesChangeRef = useRef(onActiveInstancesChange)
  onActiveInstancesChangeRef.current = onActiveInstancesChange

  const showDiffView = showChanges && defaultResources !== undefined && !mock
  const [renderSideBySide, setRenderSideBySide] = useState(false)

  const diffEditorOptions = useMemo(
    () => ({
      ...DIFF_EDITOR_OPTIONS,
      renderSideBySide,
    }),
    [renderSideBySide]
  )

  const applyDiffLayoutFromContainer = useCallback(() => {
    if (!diffContainerRef.current) return
    const { width, height } = diffContainerRef.current.getBoundingClientRect()
    if (width <= 0 || height <= 0) return

    const sideBySide = width > SIDE_BY_SIDE_BREAKPOINT_PX
    setRenderSideBySide((prev) => {
      if (prev !== sideBySide) {
        diffEditorRef.current?.updateOptions({ renderSideBySide: sideBySide })
      }
      return sideBySide
    })

    if (diffEditorRef.current) {
      diffEditorRef.current.layout({ width, height })
    }
  }, [])

  useImperativeHandle(
    ref,
    () => ({
      previous: () => {
        diffNavigatorRef.current?.previous()
        requestAnimationFrame(() => {
          diffEditorRef.current?.focus()
        })
      },
      next: () => {
        diffNavigatorRef.current?.next()
        requestAnimationFrame(() => {
          diffEditorRef.current?.focus()
        })
      },
      getDiffEditor: () => diffEditorRef.current,
      getOriginalEditor: () => diffEditorRef.current?.getOriginalEditor() ?? null,
      getModifiedEditor: () => diffEditorRef.current?.getModifiedEditor() ?? null,
      getDiffEditorMonaco: () => diffMonacoRef.current,
    }),
    []
  )

  const handleBeforeMount = useCallback((monaco: Monaco) => {
    defineThemes(monaco.editor)
    mountTheme('se')
  }, [])

  const handleDiffMount = useCallback(
    (diffEditor: editorTypes.IStandaloneDiffEditor, monaco: Monaco) => {
      mountDisposablesRef.current.forEach((d) => d.dispose())
      mountDisposablesRef.current = []

      diffEditorRef.current = diffEditor
      diffMonacoRef.current = monaco
      onActiveInstancesChangeRef.current?.()
      monaco.editor.setTheme(getTheme())

      const originalEditor = diffEditor.getOriginalEditor()
      const modifiedEditor = diffEditor.getModifiedEditor()

      const notifyModifiedEditorChange = (event: editorTypes.IModelContentChangedEvent) => {
        const model = modifiedEditor.getModel()
        if (model) {
          onChangeRef.current?.(model.getValue(), event)
        }
      }

      const notifyBlurIfReallyLeft = () => {
        requestAnimationFrame(() => {
          const de = diffEditorRef.current
          if (!de) return
          if (de.getOriginalEditor().hasTextFocus() || de.getModifiedEditor().hasTextFocus()) {
            return
          }
          const activeId = document.activeElement?.id as string
          if (TOOLBAR_IDS_SKIP_DIFF_BLUR.includes(activeId as (typeof TOOLBAR_IDS_SKIP_DIFF_BLUR)[number])) {
            return
          }
          onDiffEditorFocusChangeRef.current(false)
        })
      }

      mountDisposablesRef.current = [
        originalEditor.onDidFocusEditorWidget(() => onDiffEditorFocusChangeRef.current(true)),
        originalEditor.onDidBlurEditorWidget(notifyBlurIfReallyLeft),
        modifiedEditor.onDidFocusEditorWidget(() => onDiffEditorFocusChangeRef.current(true)),
        modifiedEditor.onDidBlurEditorWidget(notifyBlurIfReallyLeft),
        modifiedEditor.onDidChangeModelContent(notifyModifiedEditorChange),
        modifiedEditor.onDidChangeModel(() => {
          const model = modifiedEditor.getModel()
          if (!model) {
            return
          }
          notifyModifiedEditorChange({
            changes: [],
            eol: model.getEOL(),
            versionId: model.getVersionId(),
            isUndoing: false,
            isRedoing: false,
            isFlush: true,
          })
        }),
      ]

      const container = diffContainerRef.current
      const onContainerMouseDown = () => {
        const focusedEl = document.querySelector('.monaco-editor.focused')
        if (focusedEl && diffContainerRef.current?.contains(focusedEl)) {
          onDiffEditorFocusChangeRef.current(true)
        }
      }
      if (container) {
        container.addEventListener('mousedown', onContainerMouseDown)
        mountDisposablesRef.current.push({
          dispose: () => container.removeEventListener('mousedown', onContainerMouseDown),
        })
      }

      diffNavigatorRef.current?.dispose()
      diffNavigatorRef.current = monaco.editor.createDiffNavigator(diffEditor, {
        followsCaret: true,
        ignoreCharChanges: true,
        alwaysRevealFirst: false,
      })

      requestAnimationFrame(applyDiffLayoutFromContainer)

      onDiffEditorInstanceChangeRef.current?.()
    },
    [applyDiffLayoutFromContainer]
  )

  useEffect(() => {
    return () => {
      mountDisposablesRef.current.forEach((d) => d.dispose())
      mountDisposablesRef.current = []
      diffNavigatorRef.current?.dispose()
      diffNavigatorRef.current = null
      const hadEditor = diffEditorRef.current != null
      diffEditorRef.current = null
      diffMonacoRef.current = null
      onActiveInstancesChangeRef.current?.()
      if (hadEditor) {
        onDiffEditorInstanceChangeRef.current?.()
      }
      onDiffEditorFocusChangeRef.current(false)
    }
  }, [showDiffView])

  useResizeObserver(resizeRootRef, () => {
    if (!diffEditorRef.current) return
    applyDiffLayoutFromContainer()
  })

  if (!showDiffView) {
    return null
  }

  return (
    <div ref={diffContainerRef} className="sync-editor__diff-host">
      <DiffEditor
        height="100%"
        width="100%"
        language="yaml"
        theme={getTheme()}
        options={diffEditorOptions}
        beforeMount={handleBeforeMount}
        onMount={handleDiffMount}
      />
    </div>
  )
})
