/* Copyright Contributors to the Open Cluster Management project */
/* eslint-disable react-hooks/exhaustive-deps */
import { HTMLProps, ReactNode, useRef, useEffect, useState, useCallback, useMemo } from 'react'
import useResizeObserver from '@react-hook/resize-observer'
import { CodeEditor, CodeEditorControl, Language } from '@patternfly/react-code-editor'
import { RedoIcon, UndoIcon, SearchIcon, EyeIcon, EyeSlashIcon, CloseIcon } from '@patternfly/react-icons'
import { Alert, ClipboardCopyButton } from '@patternfly/react-core'
import { debounce, noop, isEqual, cloneDeep } from 'lodash'
import { processForm, processUser, ProcessedType } from './process'
import { compileAjvSchemas, ErrorType, formatErrors } from './validation'
import { getFormChanges, getUserChanges, formatChanges } from './changes'
import { decorate, getResourceEditorDecorations } from './decorate'
import { setFormValues, updateReferences } from './synchronize'
import { global_BackgroundColor_200 as globalBackground200 } from '@patternfly/react-tokens/dist/js/global_BackgroundColor_200'
import { global_BackgroundColor_dark_100 as darkEditorBackground } from '@patternfly/react-tokens/dist/js/global_BackgroundColor_dark_100'
import { global_Color_light_100 as globalColorLight100 } from '@patternfly/react-tokens/dist/js/global_Color_light_100'
import './SyncEditor.css'
import { useTranslation } from '../../lib/acm-i18next'
import { ChangeHandler } from 'react-monaco-editor'

export interface SyncEditorProps extends HTMLProps<HTMLPreElement> {
  variant?: string
  editorTitle?: string
  code?: string
  resources: unknown
  schema?: any
  secrets?: (string | string[])[]
  filters?: (string | string[])[]
  immutables?: (string | string[])[]
  editableUidSiblings?: boolean
  syncs?: unknown
  readonly?: boolean
  mock?: boolean
  autoCreateNs?: boolean
  onClose?: () => void
  onStatusChange?: (editorState: any) => void
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
  const editorRef = useRef<any | null>(null)
  const monacoRef = useRef<any | null>(null)
  if (mock) {
    if (!monacoRef.current) {
      monacoRef.current = {
        editor: {
          setTheme: () => {},
        },
        languages: {
          registerHoverProvider: () => {},
        },
      }
      editorRef.current = {
        getModel: () => {},
        onMouseDown: () => {},
        onKeyDown: () => {},
        onDidBlurEditorWidget: () => {},
      }
    }
  }
  const { t } = useTranslation()
  const editorHadFocus = useRef(false)
  const defaultCopy: ReactNode = <span style={{ wordBreak: 'keep-all' }}>{t('Copy')}</span>
  const copiedCopy: ReactNode = <span style={{ wordBreak: 'keep-all' }}>{t('Selection copied')}</span>
  const allCopiedCopy: ReactNode = <span style={{ wordBreak: 'keep-all' }}>{t('All copied')}</span>
  const [copyHint, setCopyHint] = useState<ReactNode>(defaultCopy)
  const [prohibited, setProhibited] = useState<any>([])
  const [filteredRows, setFilteredRows] = useState<number[]>([])
  const [userEdits, setUserEdits] = useState<any>([])
  const [customValidationErrors, setCustomValidationErrors] = useState<any>([])
  const [resourceChanges, setResourceChanges] = useState<ProcessedType>()
  const [statusChanges, setStatusChanges] = useState<{
    changes: any[]
    errors: any[]
    redactedChange: {
      mappings: { [name: string]: any[] }
      parsed: { [name: string]: any[] }
      resources: any[]
    }
  }>()
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
  const [mouseDownHandle, setMouseDownHandle] = useState<any>()
  const [keyDownHandle, setKeyDownHandle] = useState<any>()
  const [hoverProviderHandle, setHoverProviderHandle] = useState<any>()
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

  function onEditorDidMount(editor: any, monaco: any) {
    // make sure this instance of monaco editor has a console theme
    monaco?.editor?.defineTheme('console', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        // avoid pf tokens for `rules` since tokens are opaque strings that might not be hex values
        { token: 'number', foreground: 'ace12e' },
        { token: 'type', foreground: '73bcf7' },
        { token: 'string', foreground: 'f0ab00' },
        { token: 'keyword', foreground: 'cbc0ff' },
      ],
      colors: {
        'editor.background': darkEditorBackground.value,
        'editorGutter.background': '#292e34', // no pf token defined
        'editorLineNumber.activeForeground': globalColorLight100.value,
        'editorLineNumber.foreground': globalBackground200.value,
      },
    })
    // set theme to console
    // --if we didn't reset the themes above to vs
    // --and console was set, monaco wouldn't
    // --update the 'monoco-colors' style
    // -- with the right colors
    monaco?.editor?.setTheme('vs')
    ;(window as any).monaco?.editor?.setTheme('vs')
    monaco?.editor?.setTheme('console')
    ;(window as any).monaco?.editor?.setTheme('console')

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

    editorRef.current = editor
    window.getEditorValue = () => editor.getValue()
    monacoRef.current = monaco
  }

  useEffect(() => {
    // if user is pasting a certificate, fix the indent
    const domNode = editorRef.current.getDomNode()
    domNode.addEventListener(
      'paste',
      (event: { stopPropagation: () => void; preventDefault: () => void; originalEvent: any; target: any }) => {
        const selection = editorRef.current.getSelection()
        const pasteText = (event.originalEvent || event).clipboardData.getData('text/plain').trim()
        const model = editorRef.current.getModel()
        const lines = pasteText.split(/\r?\n/)

        if (selection.selectionStartLineNumber - 1 > 0 && pasteText.startsWith('-----BEGIN')) {
          event.stopPropagation()
          event.preventDefault()
          const lines = pasteText.split(/\r?\n/)
          const spaces = model.getLineContent(selection.selectionStartLineNumber - 1).search(/\S/) + 2
          const leadSpaces = spaces - selection.selectionStartColumn + 1
          const lead = ' '.repeat(leadSpaces < 0 ? spaces : leadSpaces)
          const spacer = ' '.repeat(spaces)
          const joint = `\r\n${spacer}`
          const text = `${lead}${lines.map((line: string) => line.trim()).join(joint)}\r\n`
          editorRef.current.executeEdits('my-source', [{ range: selection, text: text, forceMoveMarkers: true }])
        }
        // when user is pasting in a complete yaml, do we need to make sure the resource has a namespace
        if (
          autoCreateNs && // make sure resource has namespace
          selection.startColumn === 1 &&
          selection.endLineNumber === model.getLineCount()
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
            editorRef.current.executeEdits('my-source', [{ range: selection, text: text, forceMoveMarkers: true }])
          }
        }
      },
      true
    )
    // clear our the getEditorValue method
    return () => {
      window.getEditorValue = undefined
    }
  }, [])

  // prevent editor from flashing when typing in form
  useEffect(() => {
    const model = editorRef.current.getModel()
    model?.onDidChangeContent(() => {
      model?.forceTokenization(model?.getLineCount())
    })
  }, [])

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
    if (mouseDownHandle) {
      mouseDownHandle.dispose()
    }
    const handle = editorRef.current.onMouseDown(onMouseDown)
    setMouseDownHandle(handle)
  }, [filteredRows, showFiltered])

  // show tooltips over errors
  useEffect(() => {
    if (hoverProviderHandle) {
      hoverProviderHandle.dispose()
    }
    const handle = monacoRef.current.languages.registerHoverProvider('yaml', {
      provideHover: (_model: any, position: any) => {
        return new Promise((resolve) => {
          squigglyTooltips.forEach((tip: { range: { containsPosition: (arg0: any) => any }; message: string }) => {
            if (tip.range.containsPosition(position)) {
              return resolve({ contents: [{ value: '```html\n' + tip.message + ' \n```' }] })
            }
          })
          return resolve([])
        })
      },
    })
    setHoverProviderHandle(handle)
  }, [squigglyTooltips])

  // prevent user from changing protected text
  useEffect(() => {
    if (keyDownHandle) {
      keyDownHandle.dispose()
    }
    const handle = editorRef.current.onKeyDown(
      (e: {
        code: string
        ctrlKey: boolean
        metaKey: boolean
        stopPropagation: () => void
        preventDefault: () => void
      }) => {
        const selections = editorRef.current.getSelections()
        const editor = editorRef.current
        const model = editor.getModel()
        const isAllSelected =
          selections.length === 1 &&
          selections[0].startColumn === 1 &&
          selections[0].endLineNumber === model.getLineCount()
        // if user presses enter, add new key: below this line
        let endOfLineEnter = false
        if (e.code === 'Enter') {
          const pos = editor.getPosition()
          const thisLine = model.getLineContent(pos.lineNumber)
          endOfLineEnter = thisLine.length < pos.column
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
            return selections.findIndex((range: any) => prohibit.intersectRanges(range)) === -1
          })
        ) {
          e.stopPropagation()
          e.preventDefault()
        }
      }
    )
    setKeyDownHandle(handle)
  }, [prohibited])

  // if editor loses focus, do form changes immediately
  useEffect(() => {
    editorRef.current.onDidBlurEditorWidget(() => {
      const editorHasFocus = !!document.querySelector('.monaco-editor.focused')
      const activeId = document.activeElement?.id as string
      if (!editorHasFocus && ['undo-button', 'redo-button'].indexOf(activeId) === -1) {
        setClickedOnFilteredLine(false)
        setEditorHasFocus(false)
      }
    })
  }, [setClickedOnFilteredLine, setEditorHasFocus])

  // react to changes from form
  useEffect(() => {
    // debounce changes from form
    const formChange = () => {
      if (editorHasFocus || editorHasErrors) {
        return
      }
      // parse/validate/secrets
      const model = editorRef.current?.getModel()
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
        monacoRef,
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
        model.getValue(),
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
      model.resources = cloneDeep(change.resources)
      const saveDecorations = getResourceEditorDecorations(editorRef, false)
      const viewState = editorRef.current?.saveViewState()
      model.setValue(yaml)
      editorRef.current?.restoreViewState(viewState)
      editorRef.current.deltaDecorations([], saveDecorations)
      setHasRedo(false)
      setHasUndo(false)

      // if there were remaining edits, report to form
      setStatusChanges(cloneDeep({ changes: remainingEdits, redactedChange: change, errors: allErrors }))

      // user edits that haven't been incorporated into form
      setLastUserEdits(remainingEdits)

      // decorate errors, changes
      const squigglyTooltips = decorate(
        false,
        editorHasFocus,
        editorRef,
        monacoRef,
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
    // if editor loses focus, update form immediately
    // otherwise if form already had focus, no need to call formChange
    let changeTimeoutId: NodeJS.Timeout
    // if editor didn't have focus before and now it does, ignore form change
    if (!editorHadFocus.current && editorHasFocus) {
      // ignore
    } else {
      // if form changed, and editor doesn't have focus (user isn't typing) process form change immediately
      // if form changed, and editor has focus (user is typing) process form with debounce of 1 s to allow user to type
      changeTimeoutId = setTimeout(formChange, !clickedOnFilteredLine && editorHasFocus ? 1000 : 100)
    }
    editorHadFocus.current = editorHasFocus

    return () => {
      clearTimeout(changeTimeoutId)
    }
  }, [
    JSON.stringify(resources),
    code,
    showSecrets,
    showFiltered,
    editorHasFocus,
    clickedOnFilteredLine,
    changeStack,
    JSON.stringify(immutables),
  ])

  // react to changes from user editing yaml
  const editorChanged = (value: string, e: { isFlush: any }) => {
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
        monacoRef,
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
        setResourceChanges(clonedUnredactedChange)
        customErrors = setFormValues(syncs, clonedUnredactedChange) || []
        setCustomValidationErrors(customErrors)
      }
      setEditorHasErrors(editorHasErrors)
      setStatusChanges(cloneDeep({ changes, redactedChange: change, errors: allErrors }))

      // decorate errors, changes
      const squigglyTooltips = decorate(
        true,
        editorHasFocus,
        editorRef,
        monacoRef,
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
      const model = editorRef.current?.getModel()
      const editStack = model['_commandManager']
      setHasRedo(editStack?.future.length > 0)
      setHasUndo(editStack?.currentOpenStackElement || editStack?.past.length > 0)
    }
  }

  const debouncedEditorChange = useMemo(() => debounce(editorChanged, 300), [lastChange, lastFormComparison, userEdits])

  useEffect(() => {
    return () => {
      debouncedEditorChange.cancel()
    }
  }, [])

  const editorChange = useCallback<ChangeHandler>(
    (value, e) => {
      debouncedEditorChange(value, e)
    },
    [debouncedEditorChange]
  )

  // report resource changes to form
  useEffect(() => {
    if (resourceChanges) {
      const isArr = Array.isArray(resources)
      let _resources = isArr ? resourceChanges.resources : resourceChanges.resources[0]
      _resources = isArr ? resources : [resources]
      if (onEditorChange && !isEqual(resourceChanges.resources, _resources)) {
        const editChanges = {
          resources: isArr ? resourceChanges.resources : resourceChanges.resources[0],
        }
        onEditorChange(editChanges)
      }
    }
  }, [resourceChanges])

  // report errors/user edits to form
  useEffect(() => {
    if (statusChanges && onStatusChange) {
      const { changes, errors, redactedChange } = statusChanges
      const editor = editorRef?.current
      const monaco = monacoRef?.current

      // report just errors and user changes
      onStatusChange({
        warnings: formatErrors(errors, ErrorType.warning),
        errors: formatErrors(errors, ErrorType.error),
        changes: formatChanges(editor, monaco, changes, redactedChange, syncs),
      })
    }
  }, [statusChanges])

  /* eslint-enable react-hooks/exhaustive-deps */
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
                editorRef?.current.trigger('source', 'undo')
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
                editorRef?.current.trigger('source', 'redo')
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
              editorRef?.current.trigger('source', 'actions.find')
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
              const selectedText = editorRef.current.getModel().getValueInRange(editorRef.current.getSelection())
              navigator.clipboard.writeText(selectedText.length === 0 ? lastUnredactedChange?.yaml : selectedText)
              setCopyHint(selectedText.length === 0 ? allCopiedCopy : copiedCopy)
              setTimeout(() => {
                setCopyHint(defaultCopy)
              }, 800)
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
    allCopiedCopy,
    copiedCopy,
    copyHint,
    editorTitle,
    defaultCopy,
    hasUndo,
    hasRedo,
    lastUnredactedChange,
    onClose,
    readonly,
    secrets,
    showSecrets,
    t,
  ])
  /* eslint-disable react-hooks/exhaustive-deps */

  useResizeObserver(pageRef, (entry) => {
    const { width } = entry.contentRect
    let { height } = entry.contentRect

    if (pageRef.current) {
      height = window.innerHeight - pageRef.current?.getBoundingClientRect().top
    }

    if (variant === 'toolbar') {
      height -= 36
    }
    if (editorHasErrors) {
      height -= 75
    }
    editorRef?.current?.layout({ width, height })
    setShowCondensed(width < 500)
  })

  return (
    <div ref={pageRef} className="sync-editor__container">
      {editorHasErrors && (
        <Alert variant="danger" title={t('Form edits will be ignored until YAML syntax errors are fixed.')} />
      )}
      <CodeEditor
        isLineNumbersVisible={true}
        isReadOnly={readonly}
        isMinimapVisible={true}
        onChange={editorChange}
        language={Language.yaml}
        customControls={variant === 'toolbar' ? toolbarControls : undefined}
        onEditorDidMount={onEditorDidMount}
        options={{
          theme: 'console',
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
            enabled: !showCondensed,
          },
        }}
      />
    </div>
  )
}
