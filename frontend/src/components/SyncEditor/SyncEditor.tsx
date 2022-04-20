/* Copyright Contributors to the Open Cluster Management project */
/* eslint-disable react-hooks/exhaustive-deps */
import { ReactNode, useRef, useEffect, useState, useCallback, useMemo } from 'react'
import useResizeObserver from '@react-hook/resize-observer'
import { CodeEditor, CodeEditorControl, Language } from '@patternfly/react-code-editor'
import { global_BackgroundColor_dark_100 as editorBackground } from '@patternfly/react-tokens'
import {
    RedoIcon,
    UndoIcon,
    SearchIcon,
    EyeIcon,
    EyeSlashIcon,
    FilterIcon,
    CloseIcon,
} from '@patternfly/react-icons/dist/js/icons'
import { ClipboardCopyButton } from '@patternfly/react-core'
import { debounce, noop, isEqual, cloneDeep } from 'lodash'
import { processForm, processUser, ProcessedType } from './process'
import { compileAjvSchemas, formatErrors } from './validation'
import { getFormChanges, getUserChanges, formatChanges } from './changes'
import { decorate, getResourceEditorDecorations } from './decorate'
import { setFormStates } from './synchronize'
import { SyncDiffType } from './SyncDiff'
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
        onEditorChange,
        onClose,
    } = props
    const pageRef = useRef<HTMLDivElement>(null)
    const editorRef = useRef<any | null>(null)
    const monacoRef = useRef<any | null>(null)
    const defaultCopy: ReactNode = <span style={{ wordBreak: 'keep-all' }}>Copy</span>
    const copiedCopy: ReactNode = <span style={{ wordBreak: 'keep-all' }}>Selection copied</span>
    const allCopiedCopy: ReactNode = <span style={{ wordBreak: 'keep-all' }}>All copied</span>
    const [copyHint, setCopyHint] = useState<ReactNode>(defaultCopy)
    const [prohibited, setProhibited] = useState<any>([])
    const [newKeyCount, setNewKeyCount] = useState<number>(1)
    const [showsFormChanges, setShowsFormChanges] = useState<boolean>(false)
    const [userEdits, setUserEdits] = useState<any>([])
    const [editorChanges, setEditorChanges] = useState<SyncDiffType>()
    const [reportChanges, setReportChanges] = useState<{
        changes: any[]
        unredactedChange: {
            yaml: string
            mappings: { [name: string]: any[] }
            parsed: { [name: string]: any[] }
            resources: any[]
            hiddenSecretsValues: any[]
            hiddenFilteredValues: any[]
        }
        redactedChange: {
            mappings: { [name: string]: any[] }
            parsed: { [name: string]: any[] }
            resources: any[]
        }
        errors: any[]
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
    const [lastValidResources, setLastValidResources] = useState<any>()
    const [mouseDownHandle, setMouseDownHandle] = useState<any>()
    const [keyDownHandle, setKeyDownHandle] = useState<any>()
    const [hoverProviderHandle, setHoverProviderHandle] = useState<any>()
    const [showSecrets, setShowSecrets] = useState<boolean>(false)
    const [showFiltered, setShowFiltered] = useState<boolean>(false)
    const [lastShowSecrets, setLastShowSecrets] = useState<boolean>(false)
    const [lastShowFiltered, setLastShowFiltered] = useState<boolean>(false)
    const [showCondensed, setShowCondensed] = useState<boolean>(false)
    const [hasUndo, setHasUndo] = useState<boolean>(false)
    const [hasRedo, setHasRedo] = useState<boolean>(false)
    const formChangeRef = useRef<any>({})

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
        monacoRef.current = monaco
    }

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

    // clear any form change decorations if user clicks on editor
    const onMouseDown = useCallback(
        debounce(() => {
            if (showsFormChanges) {
                setShowsFormChanges(false)
            }
        }, 100),
        [showsFormChanges]
    )
    useEffect(() => {
        if (mouseDownHandle) {
            mouseDownHandle.dispose()
        }
        const handle = editorRef.current.onMouseDown(onMouseDown)
        setMouseDownHandle(handle)
    }, [showsFormChanges])

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
                if (e.code === 'Enter') {
                    const editor = editorRef.current
                    const model = editor.getModel()
                    const pos = editor.getPosition()
                    const lines = model.getLineCount()
                    const thisLine = model.getLineContent(pos.lineNumber)
                    let times
                    const isLastLine = lines <= pos.lineNumber + 1
                    if (isLastLine) {
                        times = thisLine.search(/\S/)
                    } else {
                        const nextLine = model.getLineContent(pos.lineNumber + 1)
                        times = Math.max(thisLine.search(/\S/), nextLine.search(/\S/))
                    }
                    const count = `${newKeyCount}`.padStart(4, '0')
                    const newLine = `${isLastLine ? '\n' : ''}${' '.repeat(times)}key${count}:  ${
                        !isLastLine ? '\n' : ''
                    }`
                    let range = new monacoRef.current.Range(pos.lineNumber + 1, 0, pos.lineNumber + 1, 0)
                    editor.executeEdits('new-key', [{ identifier: 'new-key', range, text: newLine }])
                    range = new monacoRef.current.Range(pos.lineNumber + 1, times + 1, pos.lineNumber + 1, times + 8)
                    editor.setSelection(range)
                    setNewKeyCount(newKeyCount + 1)
                    e.stopPropagation()
                    e.preventDefault()
                } else if (
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
                clearTimeout(formChangeRef.current.changeTimeoutId)
                formChangeRef.current.formChange()
            }
        })
    }, [])

    // react to changes from form
    useEffect(() => {
        // debounce changes from form
        formChangeRef.current.formChange = () => {
            // ignore echo from form
            // (user types, form is updated, form change comes here)
            let isEcho = isEqual(Array.isArray(resources) ? resources : [resources], editorChanges?.resources)
            isEcho = isEcho && showSecrets === lastShowSecrets && showFiltered === lastShowFiltered
            setLastShowSecrets(showSecrets)
            setLastShowFiltered(showFiltered)
            // parse/validate/secrets
            const {
                yaml,
                protectedRanges,
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
                showFiltered ? undefined : filters,
                immutables,
                userEdits,
                validationRef.current
            )
            setLastUserEdits(userEdits)
            setProhibited(protectedRanges)

            if (!isEcho) {
                // using monaco editor setValue blows away undo/redo and decorations
                // but the design decision is the editor is agnostic of its form
                // so form changes aren't articulated into individual line changes
                const model = editorRef.current?.getModel()
                const saveDecorations = getResourceEditorDecorations(editorRef)
                const savePosition = editorRef.current?.getPosition()
                model.setValue(yaml)
                editorRef.current?.setPosition(savePosition)
                editorRef.current.deltaDecorations([], saveDecorations)
            }

            setLastUnredactedChange(unredactedChange)

            // determine what changes were made by form so we can decorate
            const { changes, userEdits: edits } = getFormChanges(
                errors,
                change,
                userEdits,
                formComparison,
                lastChange,
                lastFormComparison
            )

            // report to form since we may have merged form resources with custom edits
            setReportChanges(cloneDeep({ changes: edits, unredactedChange, redactedChange: change, errors }))

            // decorate errors, changes
            if (!isEcho || changes.length > 1) {
                const squigglyTooltips = decorate(false, editorRef, monacoRef, errors, changes, change, protectedRanges)
                setSquigglyTooltips(squigglyTooltips)
            }
            setShowsFormChanges(!!lastChange)
            setLastFormComparison(formComparison)
            setLastChange(change)
            setUserEdits(edits)

            if (!isEcho) {
                setHasRedo(false)
                setHasUndo(false)
            }
        }
        formChangeRef.current.changeTimeoutId = setTimeout(
            formChangeRef.current.formChange,
            editorRef.current.hasTextFocus() ? 1000 : 100
        )

        return () => {
            clearTimeout(formChangeRef.current.changeTimeoutId)
        }
    }, [JSON.stringify(resources), code, showSecrets, showFiltered, changeStack, JSON.stringify(immutables)])

    // react to changes from user editing yaml
    const editorChanged = (value: string, e: { isFlush: any }) => {
        if (!e.isFlush) {
            // parse/validate/secrets
            const {
                protectedRanges,
                errors,
                comparison: userComparison,
                change,
                unredactedChange,
            } = processUser(
                monacoRef,
                value,
                showSecrets ? undefined : secrets,
                lastUnredactedChange?.hiddenSecretsValues,
                showFiltered ? undefined : filters,
                lastUnredactedChange?.hiddenFilteredValues,
                immutables,
                validationRef.current
            )
            setLastUnredactedChange(unredactedChange)
            setProhibited(protectedRanges)

            // determine what changes were made by user so we can decorate
            // and know what form changes to block
            const changes = getUserChanges(
                errors,
                change,
                lastUserEdits,
                userComparison,
                lastChange,
                lastChange?.parsed
            )

            // report to form
            setReportChanges(cloneDeep({ changes, unredactedChange, redactedChange: change, errors }))

            // decorate errors, changes
            const squigglyTooltips = decorate(
                true,
                editorRef,
                monacoRef,
                errors,
                [], //changes,
                change,
                protectedRanges
            )
            setSquigglyTooltips(squigglyTooltips)
            setUserEdits(changes)
            setShowsFormChanges(false)
            // don't set last change here--always comparing against last form
            //setLastChange(change)

            // set up a change stack that can be used to reconcile user changes typed here and if/when form changes occur
            setChangeStack({
                baseResources: changeStack?.baseResources ?? unredactedChange?.resources ?? [],
                customResources: unredactedChange.resources,
            })

            // undo/redo disable
            //TODO when multiple editors set for each
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

    // report changes to form
    useEffect(() => {
        // debounce report of changes to form
        const changeTimeoutId = setTimeout(() => {
            if (reportChanges) {
                const { changes, unredactedChange, redactedChange, errors } = reportChanges
                const editor = editorRef?.current
                const monaco = monacoRef?.current
                const isArr = Array.isArray(resources)
                let _resources = isArr ? resources : [resources]
                _resources = lastValidResources || _resources
                if (errors.length || unredactedChange.resources.length === 0) {
                    // if errors, use last valid resources
                    setEditorChanges({
                        resources: isArr ? _resources : _resources[0],
                        warnings: formatErrors(errors, true),
                        errors: formatErrors(errors),
                        changes: formatChanges(editor, monaco, changes, redactedChange, syncs),
                    })
                } else if (!isEqual(unredactedChange.resources, _resources) || !editorChanges) {
                    // only report if resources changed
                    setEditorChanges({
                        resources: unredactedChange.resources,
                        warnings: formatErrors(errors, true),
                        errors: formatErrors(errors),
                        changes: formatChanges(editor, monaco, changes, redactedChange, syncs),
                    })
                    setLastValidResources(cloneDeep(isArr ? unredactedChange.resources : unredactedChange.resources[0]))
                    setFormStates(syncs, unredactedChange)
                }
            }
        }, 500)
        return () => {
            clearTimeout(changeTimeoutId)
        }
    }, [reportChanges])

    useEffect(() => {
        if (onEditorChange && editorChanges) {
            onEditorChange(editorChanges)
        }
    }, [editorChanges])

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
                    {!!filters && (
                        <CodeEditorControl
                            icon={<FilterIcon />}
                            aria-label="Filter YAML"
                            toolTipText={showFiltered ? 'Filter YAML' : 'Unfilter YAML'}
                            onClick={() => {
                                setShowFiltered(!showFiltered)
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
    }, [hasUndo, hasRedo, showSecrets, showFiltered, copyHint])

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
                onChange={debouncedEditorChange}
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
