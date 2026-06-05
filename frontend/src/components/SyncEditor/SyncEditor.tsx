/* Copyright Contributors to the Open Cluster Management project */
import { HTMLProps, ReactNode, useRef, useEffect, useState, useCallback, useMemo } from 'react'
import useResizeObserver from '@react-hook/resize-observer'
import { CodeEditor, Language } from '@patternfly/react-code-editor'
import { debounce, isEqual, cloneDeep } from 'lodash'
import { processForm, processUser, ProcessedType, stringify, normalize } from './process'
import { SyncEditorDiff, SyncEditorDiffHandle } from './SyncEditorDiff'
import { SyncEditorToolbar, readShowChangesPreference } from './SyncEditorToolbar'
import { compileAjvSchemas } from './validation'
import { getFormChanges, getUserChanges } from './changes'
import { decorate, getModelDecorations } from './decorate'
import { setFormValues, updateReferences } from './synchronize'
import './SyncEditor.css'
import { useTranslation } from '../../lib/acm-i18next'
import { ChangeHandler } from 'react-monaco-editor'
import * as monacoEditor from 'monaco-editor'
import { editor as editorTypes } from 'monaco-editor'
import { loader, Monaco } from '@monaco-editor/react'
import { Schema } from 'ajv'
import { defineThemes, getTheme, mountTheme, dismountTheme } from '../theme'

// loader can be null in tests
loader?.config({ monaco: monacoEditor })

export enum ValidationStatus {
  success = 'success',
  pending = 'pending',
  failure = 'failure',
}

export interface SyncEditorProps extends HTMLProps<HTMLPreElement> {
  variant?: string
  editorTitle?: string
  code?: string
  resources: unknown
  schema?: Schema
  secrets?: (string | string[])[]
  filters?: (string | string[])[]
  immutables?: (string | string[])[]
  editableUidSiblings?: boolean
  syncs?: unknown
  readonly?: boolean
  mock?: boolean
  autoCreateNs?: boolean
  onClose?: () => void
  onStatusChange?: (status: ValidationStatus) => void
  /** Second argument is true when the user replaced the full document (paste-all); wizards should pass it to {@link IDataContext.update}. */
  onEditorChange?: (editorResources: any, resetDefaultSnapshot?: boolean) => void
  /** Wizard review / form dot path used to scroll and highlight the matching YAML region. */
  highlightEditorPath?: string
  /** Initial wizard resources; when set with variant "toolbar", enables compare-to-default diff view. */
  defaultResources?: unknown
}

export function SyncEditor(props: SyncEditorProps): JSX.Element {
  const {
    variant,
    editorTitle,
    resources,
    schema,
    secrets,
    immutables,
    editableUidSiblings,
    code,
    syncs,
    filters,
    readonly,
    mock,
    autoCreateNs,
    onStatusChange,
    onEditorChange,
    onClose,
    highlightEditorPath,
    defaultResources,
  } = props
  const [editorHighlightPath, setEditorHighlightPath] = useState(() => highlightEditorPath ?? '')
  useEffect(() => {
    setEditorHighlightPath(highlightEditorPath ?? '')
  }, [highlightEditorPath])
  const pageRef = useRef<HTMLDivElement>(null)
  const syncEditorDiffRef = useRef<SyncEditorDiffHandle>(null)
  const [editor, setEditor] = useState<editorTypes.IStandaloneCodeEditor | null>(null)
  const [monaco, setMonaco] = useState<Monaco | null>(null)
  const [activeEditor, setActiveEditor] = useState<editorTypes.IStandaloneCodeEditor | null>(null)
  const [activeMonaco, setActiveMonaco] = useState<Monaco | null>(null)
  if (mock) {
    if (!monaco) {
      setMonaco({
        editor: {
          setTheme: () => {},
        },
        languages: {
          registerHoverProvider: () => {},
        },
      } as any as Monaco)
    }
    if (!editor) {
      setEditor({
        getModel: () => {},
        onMouseDown: () => {},
        onKeyDown: () => {},
        onDidBlurEditorWidget: () => {},
      } as any as editorTypes.IStandaloneCodeEditor)
    }
  }
  const { t } = useTranslation()
  const editorHadFocus = useRef(false)
  const diffHadFocus = useRef(false)
  /** Set before full-document YAML paste; consumed once by {@link reportResourceChanges}. */
  const resetDefaultSnapshotOnNextReportRef = useRef(false)
  const defaultCopy = useMemo<ReactNode>(() => <span style={{ wordBreak: 'keep-all' }}>{t('Copy')}</span>, [t])
  const copiedCopy = useMemo<ReactNode>(
    () => <span style={{ wordBreak: 'keep-all' }}>{t('Selection copied')}</span>,
    [t]
  )
  const allCopiedCopy = useMemo<ReactNode>(() => <span style={{ wordBreak: 'keep-all' }}>{t('All copied')}</span>, [t])
  const [copyHint, setCopyHint] = useState<ReactNode>(defaultCopy)
  const [prohibited, setProhibited] = useState<any>([])
  const [filteredRows, setFilteredRows] = useState<number[]>([])
  const [userEdits, setUserEdits] = useState<any>([])
  const [customValidationErrors, setCustomValidationErrors] = useState<any>([])
  const [lastUserEdits, setLastUserEdits] = useState<any>([])
  const [squigglyTooltips, setSquigglyTooltips] = useState<any>([])
  const [lastChange, setLastChange] = useState<ProcessedType>()
  const [lastUnredactedChange, setLastUnredactedChange] = useState<ProcessedType>()
  const [lastFormComparison, setLastFormComparison] = useState<{
    [name: string]: any[]
  }>()
  const [changeStack, setChangeStack] = useState<{
    baseResources: any[]
    customResources: any[]
  }>()
  const [xreferences, setXReferences] = useState<{ value: any; references: { [name: string]: any[] } }[]>([])
  const [showSecrets, setShowSecrets] = useState<boolean>(false)
  const [showFiltered, setShowFiltered] = useState<boolean>(false)
  const [clickedOnFilteredLine, setClickedOnFilteredLine] = useState<boolean>(false)
  const [editorHasFocus, setEditorHasFocus] = useState<boolean>(false)
  const [diffEditorHasFocus, setDiffEditorHasFocus] = useState<boolean>(false)
  const [editorHasErrors, setEditorHasErrors] = useState<boolean>(false)
  const [showCondensed, setShowCondensed] = useState<boolean>(false)
  const [hasUndo, setHasUndo] = useState<boolean>(false)
  const [hasRedo, setHasRedo] = useState<boolean>(false)
  const [showChanges, setShowChanges] = useState<boolean>(readShowChangesPreference)
  const [diffEditorInstanceEpoch, setDiffEditorInstanceEpoch] = useState(0)
  const onDiffEditorInstanceChange = useCallback(() => setDiffEditorInstanceEpoch((n) => n + 1), [])

  useEffect(() => {
    if (!(showChanges && defaultResources !== undefined && !mock)) {
      setDiffEditorHasFocus(false)
    }
  }, [showChanges, defaultResources, mock])

  // compile schema(s) just once
  const validationRef = useRef<unknown>()
  if (schema && !validationRef.current) {
    validationRef.current = compileAjvSchemas(schema)
  }
  // ensure cleanup when component unmounts
  useEffect(() => {
    // hide SyncEditor version of monaco-colors
    return () => dismountTheme('se')
  }, [])

  function onEditorDidMount(editor: editorTypes.IStandaloneCodeEditor, monaco: Monaco) {
    // make sure this instance of monaco editor has the ocp console themes
    defineThemes(monaco?.editor)

    // if we don't reset the themes to vs
    // and console-light or console-dark were set, monaco wouldn't
    // update the 'monoco-colors' style with the right colors
    monaco?.editor?.setTheme('vs')
    monaco?.editor?.setTheme(getTheme())

    // show SyncEditor version of monaco-colors
    mountTheme('se')

    // observe documentElement class changes (theme toggles)
    if (typeof MutationObserver !== 'undefined') {
      const classObserver = new MutationObserver(() => {
        monaco?.editor?.setTheme(getTheme())
        ;(window as any).monaco?.editor?.setTheme(getTheme())
      })
      classObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
      })
    }

    // a little breathing space above top line
    editor.changeViewZones(
      (changeAccessor: {
        addZone: (arg0: { afterLineNumber: number; heightInPx: number; domNode: HTMLDivElement }) => void
      }) => {
        const domNode = document.createElement('div')
        changeAccessor.addZone({
          afterLineNumber: 0,
          heightInPx: 10,
          domNode: domNode,
        })
      }
    )
    window.getEditorValue = () => editor.getValue()
    setEditor(editor)
    setMonaco(monaco)
    layoutEditor(editor)
  }

  const activeEditorContainerDomNode = activeEditor?.getContainerDomNode() ?? null

  useEffect(() => {
    if (activeEditor && activeMonaco && activeEditorContainerDomNode) {
      // if user is pasting a certificate, fix the indent
      const domNode = activeEditorContainerDomNode
      const onPaste = (event: ClipboardEvent) => {
        const selection = activeEditor.getSelection()
        const pasteText = event.clipboardData?.getData('text/plain').trim()

        if (selection && pasteText) {
          const model = activeEditor.getModel()
          const lines = pasteText?.split(/\r?\n/)
          if (selection.selectionStartLineNumber - 1 > 0 && pasteText?.startsWith('-----BEGIN')) {
            event.stopPropagation()
            event.preventDefault()
            const lines = pasteText.split(/\r?\n/)
            const spaces = (model?.getLineContent(selection.selectionStartLineNumber - 1)?.search(/\S/) ?? 0) + 2
            const leadSpaces = spaces - selection.selectionStartColumn + 1
            const lead = ' '.repeat(leadSpaces < 0 ? spaces : leadSpaces)
            const spacer = ' '.repeat(spaces)
            const joint = `\r\n${spacer}`
            const text = `${lead}${lines.map((line: string) => line.trim()).join(joint)}\r\n`
            activeEditor.executeEdits('my-source', [{ range: selection, text: text, forceMoveMarkers: true }])
          }

          // when user is pasting in a complete yaml, do we need to make sure the resource has a namespace
          if (
            selection?.startLineNumber === 1 &&
            selection?.startColumn === 1 &&
            selection?.endLineNumber === model?.getLineCount() &&
            selection?.endColumn === (model?.getLineMaxColumn(model.getLineCount() || 1) ?? selection?.endColumn)
          ) {
            if (autoCreateNs) {
              let nameInx
              let hasMetadata = false
              let hasNamespace = false
              event.stopPropagation()
              event.preventDefault()
              for (let i = 0; i < lines.length; i++) {
                if (lines[i].startsWith('metadata:')) {
                  hasMetadata = true
                }
                if (hasMetadata) {
                  if (lines[i].includes(' name:')) {
                    nameInx = i
                  }
                  if (lines[i].includes(' namespace:')) {
                    hasNamespace = true
                  }
                }
                if (hasNamespace || lines[i].startsWith('spec:')) {
                  break
                }
              }
              if (nameInx && !hasNamespace) {
                // add missing namespace
                lines.splice(nameInx + 1, 0, '  namespace: ""')
              }
            }
            const text = lines.join('\r\n')
            resetDefaultSnapshotOnNextReportRef.current = true
            activeEditor.executeEdits('my-source', [{ range: selection, text: text, forceMoveMarkers: true }])
          }
        }
      }

      domNode?.addEventListener('paste', onPaste, true)

      return () => {
        domNode?.removeEventListener('paste', onPaste, true)
        window.getEditorValue = undefined
      }
    }
  }, [autoCreateNs, activeEditor, activeMonaco, activeEditorContainerDomNode, diffEditorInstanceEpoch])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onMouseDown = useCallback(
    debounce((e) => {
      // if clicking on a filtered row, toggle the
      // show filter state to "expand" filtered content
      const editorHasFocus = !!document.querySelector('.monaco-editor.focused')
      const isClickOnFilteredLine = filteredRows.includes(e?.target?.position?.lineNumber)
      setClickedOnFilteredLine(isClickOnFilteredLine)
      if (isClickOnFilteredLine) {
        setShowFiltered(!showFiltered)
      }
      setEditorHasFocus(editorHasFocus && !isClickOnFilteredLine)
    }, 0),

    [filteredRows, showFiltered]
  )
  useEffect(() => {
    if (activeEditor) {
      const handle = activeEditor.onMouseDown(onMouseDown)
      return () => {
        handle?.dispose()
      }
    }
  }, [filteredRows, showFiltered, activeEditor, onMouseDown])

  // show tooltips over errors
  useEffect(() => {
    if (activeMonaco) {
      const handle = activeMonaco.languages.registerHoverProvider('yaml', {
        provideHover: (_model: any, position: any) => {
          return new Promise((resolve) => {
            squigglyTooltips.forEach((tip: { range: { containsPosition: (arg0: any) => any }; message: string }) => {
              if (tip.range.containsPosition(position)) {
                return resolve({ contents: [{ value: '```html\n' + tip.message + ' \n```' }] })
              }
            })
            return resolve(null)
          })
        },
      })
      return () => {
        handle?.dispose()
      }
    }
  }, [squigglyTooltips, activeMonaco])

  // prevent user from changing protected text
  useEffect(() => {
    if (activeEditor) {
      const handle = activeEditor.onKeyDown(
        (e: {
          code: string
          ctrlKey: boolean
          metaKey: boolean
          stopPropagation: () => void
          preventDefault: () => void
        }) => {
          const selections = activeEditor.getSelections()
          const model = activeEditor.getModel()
          const isAllSelected =
            selections?.length === 1 &&
            selections[0].startColumn === 1 &&
            selections[0].endLineNumber === model?.getLineCount()
          // if user presses enter, add new key: below this line
          let endOfLineEnter = false
          if (e.code === 'Enter') {
            const pos = activeEditor.getPosition()
            if (model && pos) {
              const thisLine = model.getLineContent(pos.lineNumber)
              endOfLineEnter = thisLine.length < pos.column
            }
          }
          if (
            // if user clicks on readonly area, ignore
            !(e.code === 'KeyC' && (e.ctrlKey || e.metaKey)) &&
            e.code !== 'ArrowDown' &&
            e.code !== 'ArrowUp' &&
            e.code !== 'ArrowLeft' &&
            e.code !== 'ArrowRight' &&
            !endOfLineEnter &&
            !isAllSelected &&
            !prohibited.every((prohibit: { intersectRanges: (arg: any) => any }) => {
              return selections?.findIndex((range: any) => prohibit.intersectRanges(range)) === -1
            })
          ) {
            e.stopPropagation()
            e.preventDefault()
          }
        }
      )
      return () => {
        handle?.dispose()
      }
    }
  }, [prohibited, activeEditor])

  // if editor loses focus, do form changes immediately
  useEffect(() => {
    if (activeEditor) {
      const handle = activeEditor.onDidBlurEditorWidget(() => {
        const editorHasFocus = !!document.querySelector('.monaco-editor.focused')
        const activeId = document.activeElement?.id as string
        if (
          !editorHasFocus &&
          ['undo-button', 'redo-button', 'compare-changes-button', 'diff-prev-button', 'diff-next-button'].indexOf(
            activeId
          ) === -1
        ) {
          setClickedOnFilteredLine(false)
          setEditorHasFocus(false)
        }
      })
      return () => {
        handle?.dispose()
      }
    }
  }, [activeEditor, setClickedOnFilteredLine, setEditorHasFocus])

  //  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  //  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  //  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  //
  // ██    ██ ██████  ██████   █████  ████████ ███████     ███████  ██████  ██████  ███    ███
  // ██    ██ ██   ██ ██   ██ ██   ██    ██    ██          ██      ██    ██ ██   ██ ████  ████
  // ██    ██ ██████  ██   ██ ███████    ██    █████       █████   ██    ██ ██████  ██ ████ ██
  // ██    ██ ██      ██   ██ ██   ██    ██    ██          ██      ██    ██ ██   ██ ██  ██  ██
  //  ██████  ██      ██████  ██   ██    ██    ███████     ██       ██████  ██   ██ ██      ██
  // //  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  //  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  //  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

  // react to changes from form
  useEffect(
    () => {
      let changeTimeoutId: NodeJS.Timeout

      // if editor loses focus, update form immediately
      // otherwise if form already had focus, no need to call formChange

      const activeModel = activeEditor?.getModel() ?? null

      // If focus just moved into the main editor or the diff, skip this run so we do not fight the caret.
      // When neither surface has focus, always allow the effect (e.g. form/resources changed after blur).
      if (editorHasFocus || diffEditorHasFocus) {
        // ignore
      } else if (activeEditor && activeMonaco && activeModel) {
        // debounce changes from form
        const formChange = () => {
          if (editorHasErrors) {
            return
          }
          // Main editor: defer while typing. Diff compare: apply to the modified pane (not the hidden standalone editor).
          if (!diffEditorHasFocus && editorHasFocus) {
            return
          }
          if (!activeEditor || !activeModel) {
            return
          }
          let activeResources: unknown = resources
          let comparedResources: any[] | undefined
          const showDiffView = showChanges && defaultResources !== undefined && !mock
          if (showDiffView) {
            const { original, current } = normalize(
              Array.isArray(defaultResources) ? defaultResources : [defaultResources],
              Array.isArray(resources) ? resources : [resources]
            )
            activeResources = current
            comparedResources = original
          }
          const cmpYaml = comparedResources !== undefined ? stringify(comparedResources) : undefined
          // parse/validate/secrets
          const {
            yaml,
            protectedRanges,
            filteredRows,
            errors,
            comparison: formComparison,
            change,
            unredactedChange,
            xreferences,
          } = processForm(
            activeMonaco,
            code,
            activeResources,
            changeStack,
            showSecrets ? undefined : secrets,
            showFiltered,
            filters,
            immutables,
            readonly === true,
            userEdits,
            validationRef.current,
            activeModel.getValue() ?? '',
            editableUidSiblings
          )
          setProhibited(protectedRanges)
          setFilteredRows(filteredRows)
          setLastUnredactedChange(unredactedChange)
          setXReferences(xreferences)

          const allErrors = [...errors.validation, ...errors.syntax]
          const { yamlChanges, remainingEdits } = getFormChanges(
            allErrors,
            change,
            userEdits,
            formComparison,
            lastChange,
            lastFormComparison
          )

          refreshModels(yaml, showDiffView, cmpYaml)
          setHasRedo(false)
          setHasUndo(false)

          // report to form
          onStatusChange?.(allErrors.length === 0 ? ValidationStatus.success : ValidationStatus.failure)

          // user edits that haven't been incorporated into form
          setLastUserEdits(remainingEdits)

          // decorate errors, changes
          const squigglyTooltips = decorate(
            false,
            editorHasFocus || diffEditorHasFocus,
            activeEditor,
            activeMonaco,
            [...allErrors, ...customValidationErrors],
            yamlChanges,
            change,
            remainingEdits,
            protectedRanges,
            filteredRows,
            editorHighlightPath
          )
          setSquigglyTooltips(squigglyTooltips)
          setLastFormComparison(formComparison)
          setLastChange(change)
          setUserEdits(remainingEdits)
        }
        // if form changed, and editor doesn't have focus (user isn't typing) process form change immediately
        // if form changed, and editor has focus (user is typing) process form with debounce of 1 s to allow user to type
        changeTimeoutId = setTimeout(
          formChange,
          !clickedOnFilteredLine && (editorHasFocus || diffEditorHasFocus) ? 1000 : 100
        )
      }
      editorHadFocus.current = editorHasFocus
      diffHadFocus.current = diffEditorHasFocus

      return () => {
        clearTimeout(changeTimeoutId)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      // eslint-disable-next-line react-hooks/exhaustive-deps
      JSON.stringify(resources),
      code,
      showSecrets,
      showFiltered,
      editorHasFocus,
      diffEditorHasFocus,
      clickedOnFilteredLine,
      changeStack,
      activeEditor,
      activeMonaco,
      editorHighlightPath,
      mock,
      diffEditorInstanceEpoch,
      showChanges,
      // eslint-disable-next-line react-hooks/exhaustive-deps
      JSON.stringify(defaultResources),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      JSON.stringify(immutables),
    ]
  )

  const refreshModels = (yaml: string, showDiffView: boolean, cmpYaml: string | undefined) => {
    const diffEditor = showDiffView && cmpYaml !== undefined ? syncEditorDiffRef.current?.getDiffEditor() ?? null : null
    const modifiedEditor = diffEditor?.getModifiedEditor() ?? activeEditor
    if (!modifiedEditor || !activeMonaco) {
      return
    }
    const originalEditor = diffEditor?.getOriginalEditor() ?? null
    const savedModifiedDecorations = getModelDecorations(modifiedEditor, editorHasErrors)
    const modifiedViewState = modifiedEditor.saveViewState()
    if (typeof activeMonaco.editor.createModel === 'function') {
      modifiedEditor.getModel()?.dispose?.()
      modifiedEditor.setModel(activeMonaco.editor.createModel(yaml, 'yaml'))
      if (originalEditor && cmpYaml !== undefined) {
        originalEditor.getModel()?.dispose?.()
        originalEditor.setModel(activeMonaco.editor.createModel(cmpYaml, 'yaml'))
      }
      if (modifiedViewState) {
        modifiedEditor.restoreViewState(modifiedViewState)
      }
      if (savedModifiedDecorations.length) {
        modifiedEditor.deltaDecorations([], savedModifiedDecorations)
      }
    } else {
      // test version (no createModel)
      modifiedEditor.getModel()?.setValue(yaml)
      if (originalEditor && cmpYaml !== undefined) {
        originalEditor.getModel()?.setValue(cmpYaml)
      }
      if (modifiedViewState) {
        modifiedEditor.restoreViewState(modifiedViewState)
      }
    }
    if (showDiffView && diffEditor) {
      setDiffEditorModels(diffEditor, () => {
        if (modifiedViewState) {
          modifiedEditor.restoreViewState(modifiedViewState)
        }
        if (savedModifiedDecorations.length) {
          modifiedEditor.deltaDecorations([], savedModifiedDecorations)
        }
      })
    }
  }

  /** Re-attach original/modified models on the diff editor (e.g. after form sync updates models). */
  function setDiffEditorModels(diffEditor: editorTypes.IStandaloneDiffEditor, afterSetModel?: () => void): void {
    const model = diffEditor.getModel()
    if (model?.original && model?.modified) {
      diffEditor.setModel({ original: model.original, modified: model.modified })
      afterSetModel?.()
    }
  }

  // report resource changes to form
  const reportResourceChanges = useCallback(
    (resourceChanges: ProcessedType, resetDefaultSnapshot?: boolean) => {
      if (resourceChanges) {
        const isArr = Array.isArray(resources)
        const _resources = isArr ? resources : [resources]
        if (onEditorChange && !isEqual(resourceChanges.resources, _resources)) {
          const editChanges = {
            resources: isArr ? resourceChanges.resources : resourceChanges.resources[0],
          }
          onEditorChange(editChanges, resetDefaultSnapshot)
        }
      }
    },
    [onEditorChange, resources]
  )
  //  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  //  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  //  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  //
  //  ███████ ██████  ██ ████████  ██████  ██████      ████████ ██    ██ ██████  ██ ███    ██  ██████
  //  ██      ██   ██ ██    ██    ██    ██ ██   ██        ██     ██  ██  ██   ██ ██ ████   ██ ██
  //  █████   ██   ██ ██    ██    ██    ██ ██████         ██      ████   ██████  ██ ██ ██  ██ ██   ███
  //  ██      ██   ██ ██    ██    ██    ██ ██   ██        ██       ██    ██      ██ ██  ██ ██ ██    ██
  //  ███████ ██████  ██    ██     ██████  ██   ██        ██       ██    ██      ██ ██   ████  ██████
  // //  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  //  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  //  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

  // react to changes from user editing yaml
  const editorChanged = useCallback(
    (value: string, e: editorTypes.IModelContentChangedEvent) => {
      const activeModel = activeEditor?.getModel() ?? null
      if (activeEditor && activeMonaco) {
        if (!e.isFlush) {
          const resetDefaultSnapshot = resetDefaultSnapshotOnNextReportRef.current
          // parse/validate/secrets
          const {
            protectedRanges,
            filteredRows,
            errors,
            comparison: userComparison,
            change,
            unredactedChange,
          } = processUser(
            activeMonaco,
            value,
            showSecrets ? undefined : secrets,
            lastUnredactedChange?.hiddenSecretsValues,
            showFiltered,
            filters,
            lastUnredactedChange?.hiddenFilteredValues,
            immutables,
            readonly === true,
            validationRef.current,
            value,
            editableUidSiblings
          )
          setLastUnredactedChange(unredactedChange)
          setProhibited(protectedRanges)
          setFilteredRows(filteredRows)

          // determine what changes were made by user so we can decorate
          // and know what form changes to block
          const allErrors = [...errors.validation, ...errors.syntax]
          let changes = getUserChanges(allErrors, change, lastUserEdits, userComparison, lastChange, lastChange?.parsed)

          // using cross reference created in formchange, propagate any user change to
          // a path that has cross references to those other references
          changes = updateReferences(changes, xreferences, unredactedChange)

          // report new resources/errors/useredits to form
          // if there are validation errors still pass it to form
          const editorHasErrors =
            errors.syntax.length > 0 || errors.validation.filter(({ errorType }) => errorType === 'error').length > 0
          let customErrors = []
          if (!editorHasErrors) {
            const clonedUnredactedChange = cloneDeep(unredactedChange)
            reportResourceChanges(clonedUnredactedChange, resetDefaultSnapshot)
            customErrors = setFormValues(syncs, clonedUnredactedChange) || []
            setCustomValidationErrors(customErrors)
          }
          if (resetDefaultSnapshot) {
            resetDefaultSnapshotOnNextReportRef.current = false
            const showDiffView = showChanges && defaultResources !== undefined && !mock
            refreshModels(value, showDiffView, value)
          }
          setEditorHasErrors(editorHasErrors)
          onStatusChange?.(allErrors.length === 0 ? ValidationStatus.success : ValidationStatus.failure)

          // decorate errors, changes
          const squigglyTooltips = decorate(
            true,
            editorHasFocus || diffEditorHasFocus,
            activeEditor,
            activeMonaco,
            [...allErrors, ...customErrors],
            [],
            change,
            lastUserEdits,
            protectedRanges,
            filteredRows,
            editorHighlightPath
          )
          setSquigglyTooltips(squigglyTooltips)
          setUserEdits(changes)
          // don't set last change here--always comparing against last form
          //setLastChange(change)

          // set up a change stack that can be used to reconcile user changes typed here and if/when form changes occur
          if (allErrors.length === 0) {
            setChangeStack({
              baseResources: changeStack?.baseResources ?? unredactedChange?.resources ?? [],
              customResources: unredactedChange.resources,
            })
          }

          // undo/redo enable
          if (activeModel) {
            setHasRedo((activeModel as any).canRedo())
            setHasUndo((activeModel as any).canUndo())
          }
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refreshModels is defined in this component body
    [
      activeEditor,
      activeMonaco,
      showSecrets,
      secrets,
      lastUnredactedChange?.hiddenSecretsValues,
      lastUnredactedChange?.hiddenFilteredValues,
      showFiltered,
      filters,
      immutables,
      readonly,
      editableUidSiblings,
      lastUserEdits,
      lastChange,
      xreferences,
      onStatusChange,
      editorHasFocus,
      editorHighlightPath,
      reportResourceChanges,
      syncs,
      changeStack?.baseResources,
      showChanges,
      defaultResources,
      mock,
    ]
  )

  const editorChange = useCallback<ChangeHandler>(
    (value, e) => {
      onStatusChange?.(ValidationStatus.pending)
      editorChanged(value, e)
    },
    [editorChanged, onStatusChange]
  )

  const onDiffPrevious = useCallback(() => {
    syncEditorDiffRef.current?.previous()
  }, [])

  const onDiffNext = useCallback(() => {
    syncEditorDiffRef.current?.next()
  }, [])

  const toolbarControls = useMemo(() => {
    return (
      <SyncEditorToolbar
        editorTitle={editorTitle}
        readonly={readonly}
        hasUndo={hasUndo}
        hasRedo={hasRedo}
        secrets={secrets}
        showSecrets={showSecrets}
        setShowSecrets={setShowSecrets}
        showCompareButton={defaultResources !== undefined}
        showChanges={showChanges}
        setShowChanges={setShowChanges}
        onDiffPrevious={onDiffPrevious}
        onDiffNext={onDiffNext}
        copyHint={copyHint}
        setCopyHint={setCopyHint}
        onClose={onClose}
        editor={editor}
        syncEditorDiffRef={syncEditorDiffRef}
        lastUnredactedYaml={lastUnredactedChange?.yaml}
        allCopiedCopy={allCopiedCopy}
        copiedCopy={copiedCopy}
        defaultCopy={defaultCopy}
        t={t}
      />
    )
  }, [
    editorTitle,
    readonly,
    hasUndo,
    hasRedo,
    secrets,
    showSecrets,
    defaultResources,
    showChanges,
    onDiffPrevious,
    onDiffNext,
    copyHint,
    onClose,
    editor,
    syncEditorDiffRef,
    lastUnredactedChange?.yaml,
    allCopiedCopy,
    copiedCopy,
    defaultCopy,
    t,
  ])

  useResizeObserver(pageRef, () => {
    layoutEditor(activeEditor)
  })

  const layoutEditor = useCallback(
    (editor: any) => {
      if (pageRef.current && editor) {
        const rect = pageRef.current.getBoundingClientRect()
        const { width } = rect
        let { height } = rect

        if (pageRef.current) {
          height = window.innerHeight - pageRef.current?.getBoundingClientRect().top
        }

        if (variant === 'toolbar') {
          height -= 36
        }
        if (editorHasErrors) {
          height -= 75
        }
        editor.layout({ width, height })
        setShowCondensed(width < 500)
      }
    },
    [editorHasErrors, variant]
  )

  // if showChanges is true, set activeEditor,activeMonaco to DiffEditor
  // else set the actives to the regular editor/monanco
  const syncActiveInstances = useCallback(() => {
    const showDiffView = showChanges && defaultResources !== undefined && !mock
    if (showDiffView) {
      setActiveEditor(syncEditorDiffRef.current?.getModifiedEditor() ?? null)
      setActiveMonaco(syncEditorDiffRef.current?.getDiffEditorMonaco() ?? null)
    } else {
      setActiveEditor(editor)
      setActiveMonaco(monaco)
    }
  }, [showChanges, defaultResources, mock, editor, monaco])

  useEffect(() => {
    syncActiveInstances()
  }, [syncActiveInstances, diffEditorInstanceEpoch])

  const showDiffView = showChanges && defaultResources !== undefined && !mock

  return (
    <div
      ref={pageRef}
      className={`sync-editor__container${showChanges ? ' sync-editor__container--show-changes' : ''}`}
    >
      <div className="sync-editor__stack">
        <CodeEditor
          isFullHeight={!showDiffView}
          isLineNumbersVisible={true}
          isReadOnly={readonly}
          isMinimapVisible={true}
          onChange={editorChange}
          language={Language.yaml}
          customControls={variant === 'toolbar' ? toolbarControls : undefined}
          onEditorDidMount={onEditorDidMount}
          showEditor={!showDiffView}
          options={{
            theme: getTheme(),
            wordWrap: 'wordWrapColumn',
            wordWrapColumn: showCondensed ? 512 : 256,
            scrollBeyondLastLine: true,
            smoothScrolling: true,
            glyphMargin: true,
            tabSize: 2,
            scrollbar: {
              verticalScrollbarSize: 17,
              horizontalScrollbarSize: 17,
            },
            minimap: {
              enabled: false,
            },
          }}
        />
        <SyncEditorDiff
          ref={syncEditorDiffRef}
          showChanges={showChanges}
          defaultResources={defaultResources}
          resources={resources}
          mock={mock}
          diffEditorHasFocus={diffEditorHasFocus}
          onDiffEditorFocusChange={setDiffEditorHasFocus}
          onDiffEditorInstanceChange={onDiffEditorInstanceChange}
          onActiveInstancesChange={syncActiveInstances}
          resizeRootRef={pageRef}
          onChange={editorChange}
        />
      </div>
    </div>
  )
}
