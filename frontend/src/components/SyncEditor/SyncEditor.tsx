/* Copyright Contributors to the Open Cluster Management project */
import { HTMLProps, ReactNode, useRef, useEffect, useState, useCallback, useMemo } from 'react'
import useResizeObserver from '@react-hook/resize-observer'
import { CodeEditor, CodeEditorControl, Language } from '@patternfly/react-code-editor'
import { RedoIcon, UndoIcon, SearchIcon, EyeIcon, EyeSlashIcon, CloseIcon } from '@patternfly/react-icons'
import { ClipboardCopyButton } from '@patternfly/react-core'
import { debounce, noop, isEqual, cloneDeep } from 'lodash'
import { processForm, processUser, ProcessedType } from './process'
import { compileAjvSchemas } from './validation'
import { getFormChanges, getUserChanges } from './changes'
import { decorate, getResourceEditorDecorations } from './decorate'
import { setFormValues, updateReferences } from './synchronize'
import './SyncEditor.css'
import { useTranslation } from '../../lib/acm-i18next'
import { ChangeHandler } from 'react-monaco-editor'
import * as monaco from 'monaco-editor'
import { editor as editorTypes } from 'monaco-editor'
import { loader, Monaco } from '@monaco-editor/react'
import { Schema } from 'ajv'
import { defineThemes, getTheme, mountTheme, dismountTheme } from '../theme'

// loader can be null in tests
loader?.config({ monaco })

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
  onEditorChange?: (editorResources: any) => void
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
  } = props
  const pageRef = useRef<HTMLDivElement>(null)
  const [editor, setEditor] = useState<editorTypes.IStandaloneCodeEditor | null>(null)
  const [monaco, setMonaco] = useState<Monaco | null>(null)
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
  const [editorHasErrors, setEditorHasErrors] = useState<boolean>(false)
  const [showCondensed, setShowCondensed] = useState<boolean>(false)
  const [hasUndo, setHasUndo] = useState<boolean>(false)
  const [hasRedo, setHasRedo] = useState<boolean>(false)

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

  useEffect(() => {
    if (editor && monaco) {
      // if user is pasting a certificate, fix the indent
      const domNode = editor.getDomNode()
      domNode?.addEventListener(
        'paste',
        (event: ClipboardEvent) => {
          const selection = editor.getSelection()
          const pasteText = event.clipboardData?.getData('text/plain').trim()

          if (selection && pasteText) {
            const model = editor.getModel()
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
              editor.executeEdits('my-source', [{ range: selection, text: text, forceMoveMarkers: true }])
            }

            // when user is pasting in a complete yaml, do we need to make sure the resource has a namespace
            if (
              autoCreateNs && // make sure resource has namespace
              selection?.startColumn === 1 &&
              selection?.endLineNumber === model?.getLineCount()
            ) {
              let nameInx
              let hasMetadata = false
              let hasNamespace = false
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
                event.stopPropagation()
                event.preventDefault()
                lines.splice(nameInx + 1, 0, '  namespace: ""')
                const text = lines.join('\r\n')
                editor.executeEdits('my-source', [{ range: selection, text: text, forceMoveMarkers: true }])
              }
            }
          }
        },
        true
      )
      // clear our the getEditorValue method
      return () => {
        window.getEditorValue = undefined
      }
    }
  }, [autoCreateNs, editor, monaco])

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
    if (editor) {
      const handle = editor.onMouseDown(onMouseDown)
      return () => {
        handle?.dispose()
      }
    }
  }, [filteredRows, showFiltered, editor, onMouseDown])

  // show tooltips over errors
  useEffect(() => {
    if (monaco) {
      const handle = monaco.languages.registerHoverProvider('yaml', {
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
  }, [squigglyTooltips, monaco])

  // prevent user from changing protected text
  useEffect(() => {
    if (editor) {
      const handle = editor.onKeyDown(
        (e: {
          code: string
          ctrlKey: boolean
          metaKey: boolean
          stopPropagation: () => void
          preventDefault: () => void
        }) => {
          const selections = editor.getSelections()
          const model = editor.getModel()
          const isAllSelected =
            selections?.length === 1 &&
            selections[0].startColumn === 1 &&
            selections[0].endLineNumber === model?.getLineCount()
          // if user presses enter, add new key: below this line
          let endOfLineEnter = false
          if (e.code === 'Enter') {
            const pos = editor.getPosition()
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
  }, [prohibited, editor])

  // if editor loses focus, do form changes immediately
  useEffect(() => {
    if (editor) {
      editor.onDidBlurEditorWidget(() => {
        const editorHasFocus = !!document.querySelector('.monaco-editor.focused')
        const activeId = document.activeElement?.id as string
        if (!editorHasFocus && ['undo-button', 'redo-button'].indexOf(activeId) === -1) {
          setClickedOnFilteredLine(false)
          setEditorHasFocus(false)
        }
      })
    }
  }, [editor, setClickedOnFilteredLine, setEditorHasFocus])

  // react to changes from form
  useEffect(
    () => {
      let changeTimeoutId: NodeJS.Timeout

      // if editor loses focus, update form immediately
      // otherwise if form already had focus, no need to call formChange

      const model = editor?.getModel()

      // if editor didn't have focus before and now it does, ignore form change
      if (!editorHadFocus.current && editorHasFocus) {
        // ignore
      } else if (editor && monaco && model) {
        // debounce changes from form
        const formChange = () => {
          if (editorHasFocus || editorHasErrors) {
            return
          }
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
            monaco,
            code,
            resources,
            changeStack,
            showSecrets ? undefined : secrets,
            showFiltered,
            filters,
            immutables,
            readonly === true,
            userEdits,
            validationRef.current,
            model?.getValue() ?? '',
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

          // update yaml in editor
          //model.resources = cloneDeep(change.resources)
          const saveDecorations = getResourceEditorDecorations(editor, false)
          const viewState = editor.saveViewState()
          // instead of setValue, it's more robust to create a new text model
          // but fall back to setValue for test environments where createModel may not be available
          if (typeof monaco.editor.createModel === 'function') {
            editor.getModel()?.dispose?.()
            editor.setModel(monaco.editor.createModel(yaml, 'yaml'))
          } else {
            model.setValue(yaml)
          }
          if (viewState) {
            editor.restoreViewState(viewState)
          }
          editor.deltaDecorations([], saveDecorations)
          setHasRedo(false)
          setHasUndo(false)

          // report to form
          onStatusChange?.(allErrors.length === 0 ? ValidationStatus.success : ValidationStatus.failure)

          // user edits that haven't been incorporated into form
          setLastUserEdits(remainingEdits)

          // decorate errors, changes
          const squigglyTooltips = decorate(
            false,
            editorHasFocus,
            editor,
            monaco,
            [...allErrors, ...customValidationErrors],
            yamlChanges,
            change,
            remainingEdits,
            protectedRanges,
            filteredRows
          )
          setSquigglyTooltips(squigglyTooltips)
          setLastFormComparison(formComparison)
          setLastChange(change)
          setUserEdits(remainingEdits)
        }
        // if form changed, and editor doesn't have focus (user isn't typing) process form change immediately
        // if form changed, and editor has focus (user is typing) process form with debounce of 1 s to allow user to type
        changeTimeoutId = setTimeout(formChange, !clickedOnFilteredLine && editorHasFocus ? 1000 : 100)
      }
      editorHadFocus.current = editorHasFocus

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
      clickedOnFilteredLine,
      changeStack,
      editor,
      monaco,
      // eslint-disable-next-line react-hooks/exhaustive-deps
      JSON.stringify(immutables),
    ]
  )

  // report resource changes to form
  const reportResourceChanges = useCallback(
    (resourceChanges: ProcessedType) => {
      if (resourceChanges) {
        const isArr = Array.isArray(resources)
        const _resources = isArr ? resources : [resources]
        if (onEditorChange && !isEqual(resourceChanges.resources, _resources)) {
          const editChanges = {
            resources: isArr ? resourceChanges.resources : resourceChanges.resources[0],
          }
          onEditorChange(editChanges)
        }
      }
    },
    [onEditorChange, resources]
  )

  // react to changes from user editing yaml
  const editorChanged = useCallback(
    (value: string, e: { isFlush: any }) => {
      if (editor && monaco) {
        if (!e.isFlush) {
          // parse/validate/secrets
          const {
            protectedRanges,
            filteredRows,
            errors,
            comparison: userComparison,
            change,
            unredactedChange,
          } = processUser(
            monaco,
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
            reportResourceChanges(clonedUnredactedChange)
            customErrors = setFormValues(syncs, clonedUnredactedChange) || []
            setCustomValidationErrors(customErrors)
          }
          setEditorHasErrors(editorHasErrors)
          onStatusChange?.(allErrors.length === 0 ? ValidationStatus.success : ValidationStatus.failure)

          // decorate errors, changes
          const squigglyTooltips = decorate(
            true,
            editorHasFocus,
            editor,
            monaco,
            [...allErrors, ...customErrors],
            [],
            change,
            lastUserEdits,
            protectedRanges,
            filteredRows
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
          const model = editor.getModel()
          if (model) {
            setHasRedo((model as any).canRedo())
            setHasUndo((model as any).canUndo())
          }
        }
      }
    },
    [
      changeStack?.baseResources,
      editableUidSiblings,
      editor,
      editorHasFocus,
      filters,
      immutables,
      lastChange,
      lastUnredactedChange?.hiddenFilteredValues,
      lastUnredactedChange?.hiddenSecretsValues,
      lastUserEdits,
      monaco,
      readonly,
      reportResourceChanges,
      secrets,
      showFiltered,
      showSecrets,
      syncs,
      xreferences,
      onStatusChange,
    ]
  )

  const editorChange = useCallback<ChangeHandler>(
    (value, e) => {
      onStatusChange?.(ValidationStatus.pending)
      editorChanged(value, e)
    },
    [editorChanged, onStatusChange]
  )

  const toolbarControls = useMemo(() => {
    return (
      <>
        <div className="sy-c-code-editor__title">{editorTitle || 'YAML'}</div>
        <div className="sy-toolbar-buttons" style={{ display: 'flex' }}>
          {/* undo */}
          {!readonly && (
            <CodeEditorControl
              id="undo-button"
              icon={<UndoIcon />}
              aria-label={t('Undo')}
              tooltipProps={{ content: t('Undo') }}
              isDisabled={!hasUndo}
              onClick={() => {
                editor?.trigger('source', 'undo', undefined)
              }}
            />
          )}
          {/* redo */}
          {!readonly && (
            <CodeEditorControl
              id="redo-button"
              icon={<RedoIcon />}
              aria-label={t('Redo')}
              tooltipProps={{ content: t('Redo') }}
              isDisabled={!hasRedo}
              onClick={() => {
                editor?.trigger('source', 'redo', undefined)
              }}
            />
          )}
          {/* search */}
          <CodeEditorControl
            id="search-button"
            icon={<SearchIcon />}
            aria-label={t('Find')}
            tooltipProps={{ content: t('Find') }}
            onClick={() => {
              editor?.trigger('source', 'actions.find', undefined)
            }}
          />
          {/* secrets */}
          {secrets && (
            <CodeEditorControl
              id="secret-button"
              icon={showSecrets ? <EyeIcon /> : <EyeSlashIcon />}
              aria-label={t('Show Secrets')}
              tooltipProps={{ content: t('Show Secrets') }}
              onClick={() => {
                setShowSecrets(!showSecrets)
              }}
            />
          )}
          {/* copy */}
          <ClipboardCopyButton
            id="copy-button"
            textId="code-content"
            aria-label={t('Copy to clipboard')}
            disabled={false}
            onClick={() => {
              if (editor && editor.getModel()) {
                const model = editor.getModel()
                const selection = editor.getSelection()
                if (model && selection) {
                  const selectedText = model.getValueInRange(selection)
                  navigator.clipboard.writeText(selectedText || lastUnredactedChange?.yaml || '')
                  setCopyHint(selectedText.length === 0 ? allCopiedCopy : copiedCopy)
                  setTimeout(() => {
                    setCopyHint(defaultCopy)
                  }, 800)
                }
              }
            }}
            exitDelay={600}
            variant="plain"
          >
            {copyHint}
          </ClipboardCopyButton>
          {!!onClose && (
            <CodeEditorControl
              icon={<CloseIcon />}
              aria-label={t('Close')}
              tooltipProps={{ content: t('Close') }}
              onClick={onClose || noop}
            />
          )}
        </div>
      </>
    )
  }, [
    editorTitle,
    readonly,
    t,
    hasUndo,
    hasRedo,
    secrets,
    showSecrets,
    copyHint,
    onClose,
    editor,
    lastUnredactedChange?.yaml,
    allCopiedCopy,
    copiedCopy,
    defaultCopy,
  ])

  useResizeObserver(pageRef, () => {
    layoutEditor(editor)
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

  return (
    <div ref={pageRef} className="sync-editor__container">
      <CodeEditor
        isLineNumbersVisible={true}
        isReadOnly={readonly}
        isMinimapVisible={true}
        onChange={editorChange}
        language={Language.yaml}
        customControls={variant === 'toolbar' ? toolbarControls : undefined}
        onEditorDidMount={onEditorDidMount}
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
    </div>
  )
}
