/* Copyright Contributors to the Open Cluster Management project */
/* eslint-disable react-hooks/exhaustive-deps */
import { ReactNode, useRef, useEffect, useState, useCallback, useMemo } from 'react'
import useResizeObserver from '@react-hook/resize-observer'
import { CodeEditor, CodeEditorControl, Language } from '@patternfly/react-code-editor'
import { global_BackgroundColor_dark_100 as editorBackground } from '@patternfly/react-tokens'
import { RedoIcon, UndoIcon, SearchIcon, EyeIcon, EyeSlashIcon, CloseIcon } from '@patternfly/react-icons/dist/js/icons'
import { ClipboardCopyButton } from '@patternfly/react-core'
import { debounce, noop, isEqual, cloneDeep } from 'lodash'
import { processForm, processUser, ProcessedType } from './process'
import { compileAjvSchemas, formatErrors } from './validation'
import { getFormChanges, getUserChanges, formatChanges } from './changes'
import { decorate, getResourceEditorDecorations } from './decorate'
import { setFormValues } from './synchronize'
import './SyncEditor.css'

export interface SyncEditorProps extends React.HTMLProps<HTMLPreElement> {
    variant?: string
    editorTitle?: string
    code?: string
    resources: unknown
    schema?: any
    secrets?: (string | string[])[]
    filters?: (string | string[])[]
    immutables?: (string | string[])[]
    syncs?: unknown
    readonly?: boolean
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
        code,
        syncs,
        filters,
        readonly,
        onStatusChange,
        onEditorChange,
        onClose,
    } = props
    const pageRef = useRef<HTMLDivElement>(null)
    const editorRef = useRef<any | null>(null)
    const monacoRef = useRef<any | null>(null)
    const editorHadFocus = useRef(false)
    const defaultCopy: ReactNode = <span style={{ wordBreak: 'keep-all' }}>Copy</span>
    const copiedCopy: ReactNode = <span style={{ wordBreak: 'keep-all' }}>Selection copied</span>
    const allCopiedCopy: ReactNode = <span style={{ wordBreak: 'keep-all' }}>All copied</span>
    const [copyHint, setCopyHint] = useState<ReactNode>(defaultCopy)
    const [prohibited, setProhibited] = useState<any>([])
    const [filteredRows, setFilteredRows] = useState<number[]>([])
    const [userEdits, setUserEdits] = useState<any>([])
    const [resourceChanges, setResourceChanges] = useState<{
        unredactedChange: {
            yaml: string
            mappings: { [name: string]: any[] }
            parsed: { [name: string]: any[] }
            resources: any[]
            hiddenSecretsValues: any[]
            hiddenFilteredValues: any[]
        }
    }>()
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
    const [customYaml, setCustomYaml] = useState<string>()
    const [lastChange, setLastChange] = useState<ProcessedType>()
    const [lastUnredactedChange, setLastUnredactedChange] = useState<ProcessedType>()
    const [lastFormComparison, setLastFormComparison] = useState<{
        [name: string]: any[]
    }>()
    const [changeStack, setChangeStack] = useState<{
        baseResources: any[]
        customResources: any[]
    }>()
    const [mouseDownHandle, setMouseDownHandle] = useState<any>()
    const [keyDownHandle, setKeyDownHandle] = useState<any>()
    const [hoverProviderHandle, setHoverProviderHandle] = useState<any>()
    const [showSecrets, setShowSecrets] = useState<boolean>(false)
    const [showFiltered, setShowFiltered] = useState<boolean>(false)
    const [clickedOnFilteredLine, setClickedOnFilteredLine] = useState<boolean>(false)
    const [editorHasFocus, setEditorHasFocus] = useState<boolean>(false)
    const [showCondensed, setShowCondensed] = useState<boolean>(false)
    const [hasUndo, setHasUndo] = useState<boolean>(false)
    const [hasRedo, setHasRedo] = useState<boolean>(false)

    // compile schema(s) just once
    const validationRef = useRef<unknown>()
    if (schema && !validationRef.current) {
        validationRef.current = compileAjvSchemas(schema)
    }

    function onEditorDidMount(editor: any, monaco: any) {
        // create 'resource-editor' theme
        monaco.editor.defineTheme('resource-editor', {
            base: 'vs-dark',
            inherit: true,
            rules: [
                { token: 'number', foreground: 'ace12e' },
                { token: 'type', foreground: '73bcf7' },
                { token: 'string', foreground: 'f0ab00' },
                { token: 'keyword', foreground: 'cbc0ff' },
            ],
            colors: {
                'editor.background': editorBackground.value,
                'editorGutter.background': '#292e34',
                'editorLineNumber.activeForeground': '#fff',
                'editorLineNumber.foreground': '#f0f0f0',
            },
        })

        // create 'readonly-resource-editor' theme
        monaco.editor.defineTheme('readonly-resource-editor', {
            base: 'vs',
            inherit: true,
            rules: [
                { background: 'e0e0e0' },
                { token: 'number', foreground: '000000' },
                { token: 'type', foreground: '000000' },
                { token: 'string', foreground: '000000' },
                { token: 'keyword', foreground: '0451a5' },
            ],
            colors: {
                'editor.background': '#e0e0e0',
                'editorGutter.background': '#e0e0e0',
                'editorLineNumber.activeForeground': '#000000',
                'editorLineNumber.foreground': '#000000',
            },
        })

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

    // clear our the getEditorValue method
    useEffect(() => {
        return () => {
            window.getEditorValue = undefined
        }
    }, [])

    useEffect(() => {
        monacoRef.current.editor.setTheme(readonly ? 'readonly-resource-editor' : 'resource-editor')
    }, [readonly])

    // prevent editor from flashing when typing in form
    useEffect(() => {
        const model = editorRef.current?.getModel()
        model.onDidChangeContent(() => {
            model?.forceTokenization(model?.getLineCount())
        })
    }, [])

    const onMouseDown = useCallback(
        debounce((e) => {
            // if clicking on a filtered row, toggle the
            // show filter state to "expand" filtered content
            setEditorHasFocus(true)
            const isClickOnFilteredLine = filteredRows.includes(e?.target?.position?.lineNumber)
            setClickedOnFilteredLine(isClickOnFilteredLine)
            if (isClickOnFilteredLine) {
                setShowFiltered(!showFiltered)
            }
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
                    squigglyTooltips.forEach(
                        (tip: { range: { containsPosition: (arg0: any) => any }; message: string }) => {
                            if (tip.range.containsPosition(position)) {
                                return resolve({ contents: [{ value: '```html\n' + tip.message + ' \n```' }] })
                            }
                        }
                    )
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
                // if user presses enter, add new key: below this line
                if (
                    // if user clicks on readonly area, ignore
                    !(e.code === 'KeyC' && (e.ctrlKey || e.metaKey)) &&
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
            const parent = document.getElementsByClassName('sync-editor__container')[0]
            if (!parent.contains(document.activeElement)) {
                setClickedOnFilteredLine(false)
                setEditorHasFocus(false)
            }
        })
    }, [setClickedOnFilteredLine, setEditorHasFocus])

    // react to changes from form
    useEffect(() => {
        // debounce changes from form
        const formChange = () => {
            // if form hasn't caught up with user edits, ignore this change
            const caughtUp = !customYaml || !editorRef.current.customYaml || editorRef.current.customYaml === customYaml
            if (!caughtUp) {
                return
            }
            setCustomYaml(undefined)
            // if editor has errors and still has focus, ignore form changes
            // as soon as form has focus it will fix all errors like an auto correct
            if (editorHasFocus && editorRef.current.customSyntaxErrors) {
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
            } = processForm(
                monacoRef,
                code,
                resources,
                changeStack,
                showSecrets ? undefined : secrets,
                showFiltered,
                filters,
                immutables,
                userEdits,
                validationRef.current
            )
            setProhibited(protectedRanges)
            setFilteredRows(filteredRows)
            setLastUnredactedChange(unredactedChange)

            const allErrors = [...errors.validation, ...errors.syntax]
            const { yamlChanges, remainingEdits } = getFormChanges(
                allErrors,
                change,
                userEdits,
                formComparison,
                lastChange,
                lastFormComparison
            )

            // only update yaml in editor if it changed syntactically changed
            // allows user to add spaces without this wiping them out
            const model = editorRef.current?.getModel()
            if (!isEqual(model.resources, change.resources) || editorRef.current.customSyntaxErrors) {
                editorRef.current.customSyntaxErrors = false
                model.resources = cloneDeep(change.resources)
                const saveDecorations = getResourceEditorDecorations(editorRef)
                const viewState = editorRef.current?.saveViewState()
                model.setValue(yaml)
                editorRef.current?.restoreViewState(viewState)
                editorRef.current.deltaDecorations([], saveDecorations)
                setHasRedo(false)
                setHasUndo(false)
            }

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
                allErrors,
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
        customYaml,
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
                validationRef.current
            )
            setLastUnredactedChange(unredactedChange)
            setProhibited(protectedRanges)
            setFilteredRows(filteredRows)

            // determine what changes were made by user so we can decorate
            // and know what form changes to block
            const allErrors = [...errors.validation, ...errors.syntax]
            const changes = getUserChanges(
                allErrors,
                change,
                lastUserEdits,
                userComparison,
                lastChange,
                lastChange?.parsed
            )

            // report new resources/errors/useredits to form
            // if there are validation errors still pass it to form
            editorRef.current.customSyntaxErrors = allErrors.length > 0
            if (errors.syntax.length === 0) {
                setResourceChanges(cloneDeep({ unredactedChange }))
            }
            setStatusChanges(cloneDeep({ changes, redactedChange: change, errors: allErrors }))

            // decorate errors, changes
            const squigglyTooltips = decorate(
                true,
                editorHasFocus,
                editorRef,
                monacoRef,
                allErrors,
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
            const editStacks = model?._undoRedoService._editStacks
            setHasRedo(editStacks?.values()?.next()?.value?.hasFutureElements())
            setHasUndo(editStacks?.values()?.next()?.value?.hasPastElements())
        }
    }

    const debouncedEditorChange = useMemo(
        () => debounce(editorChanged, 300),
        [lastChange, lastFormComparison, userEdits]
    )

    useEffect(() => {
        return () => {
            debouncedEditorChange.cancel()
        }
    }, [])

    const editorChange = useCallback(
        (value, e) => {
            editorRef.current.customYaml = value
            debouncedEditorChange(value, e)
        },
        [debouncedEditorChange]
    )

    // report resource changes to form
    useEffect(() => {
        if (resourceChanges) {
            const { unredactedChange } = resourceChanges
            const isArr = Array.isArray(resources)
            let _resources = isArr ? unredactedChange.resources : unredactedChange.resources[0]

            // if synceditor resources is different from form.wizard, report resources
            // if syncs defined, set values into form/wizard
            setFormValues(syncs, unredactedChange)
            _resources = isArr ? resources : [resources]
            if (onEditorChange && !isEqual(unredactedChange.resources, _resources)) {
                const editChanges = {
                    resources: isArr ? unredactedChange.resources : unredactedChange.resources[0],
                }
                setCustomYaml(editorRef.current.customYaml)
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
                warnings: formatErrors(errors, true),
                errors: formatErrors(errors),
                changes: formatChanges(editor, monaco, changes, redactedChange, syncs),
            })
        }
    }, [statusChanges])

    const toolbarControls = useMemo(() => {
        return (
            <>
                <div className="sy-c-code-editor__title">{editorTitle || 'YAML'}</div>
                <div style={{ display: 'flex' }}>
                    {/* undo */}
                    {!readonly && (
                        <CodeEditorControl
                            icon={<UndoIcon />}
                            aria-label="Undo"
                            toolTipText="Undo"
                            isDisabled={!hasUndo}
                            onClick={() => {
                                editorRef?.current.trigger('source', 'undo')
                            }}
                        />
                    )}
                    {/* redo */}
                    {!readonly && (
                        <CodeEditorControl
                            icon={<RedoIcon />}
                            aria-label="Redo"
                            toolTipText="Redo"
                            isDisabled={!hasRedo}
                            onClick={() => {
                                editorRef?.current.trigger('source', 'redo')
                            }}
                        />
                    )}
                    {/* search */}
                    <CodeEditorControl
                        icon={<SearchIcon />}
                        aria-label="Find"
                        toolTipText="Find"
                        onClick={() => {
                            editorRef?.current.trigger('source', 'actions.find')
                        }}
                    />
                    {/* secrets */}
                    {secrets && (
                        <CodeEditorControl
                            icon={showSecrets ? <EyeIcon /> : <EyeSlashIcon />}
                            aria-label="Show Secrets"
                            toolTipText="Show Secrets"
                            onClick={() => {
                                setShowSecrets(!showSecrets)
                            }}
                        />
                    )}
                    {/* copy */}
                    <ClipboardCopyButton
                        id="copy-button"
                        textId="code-content"
                        aria-label="Copy to clipboard"
                        disabled={false}
                        onClick={() => {
                            const selectedText = editorRef.current
                                .getModel()
                                .getValueInRange(editorRef.current.getSelection())
                            navigator.clipboard.writeText(
                                selectedText.length === 0 ? lastUnredactedChange?.yaml : selectedText
                            )
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
                            aria-label="Close"
                            toolTipText="Close"
                            onClick={onClose || noop}
                        />
                    )}
                </div>
            </>
        )
    }, [hasUndo, hasRedo, showSecrets, copyHint])

    useResizeObserver(pageRef, (entry) => {
        const { width } = entry.contentRect
        let { height } = entry.contentRect

        if (pageRef.current) {
            height = window.innerHeight - pageRef.current?.getBoundingClientRect().top
        }

        if (variant === 'toolbar') {
            height -= 36
        }
        editorRef?.current?.layout({ width, height })
        setShowCondensed(width < 500)
    })

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
