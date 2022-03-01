/* Copyright Contributors to the Open Cluster Management project */
import { ReactNode, useRef, useEffect, useState, useCallback } from 'react'
import useResizeObserver from '@react-hook/resize-observer'
import { CodeEditor, CodeEditorControl, Language } from '@patternfly/react-code-editor'
import { global_BackgroundColor_dark_100 as editorBackground } from '@patternfly/react-tokens'
import { RedoIcon, UndoIcon, SearchIcon, EyeIcon, EyeSlashIcon, CloseIcon } from '@patternfly/react-icons/dist/js/icons'
import { ClipboardCopyButton } from '@patternfly/react-core'
import Ajv from 'ajv'
import { debounce } from 'lodash'
import { processForm, processUser, formatErrors, ProcessedType } from './process'
import { getFormChanges, getUserChanges, formatChanges } from './changes'
import { decorate, getResourceEditorDecorations } from './decorate'
import { SyncDiffType } from './SyncDiff'
import './SyncEditor.css'

export interface SyncEditorProps extends React.HTMLProps<HTMLPreElement> {
    variant?: string
    editorTitle?: string
    code?: string
    resources: unknown
    schema?: any
    secrets?: (string | string[])[]
    immutables?: (string | string[])[]
    readonly?: boolean
    onClose: () => void
    onEditorChange?: (editorResources: any) => void
}

export function SyncEditor(props: SyncEditorProps): JSX.Element {
    const { variant, editorTitle, resources, schema, secrets, immutables, code, readonly, onEditorChange, onClose } =
        props
    const pageRef = useRef(null)
    const editorRef = useRef<any | null>(null)
    const monacoRef = useRef<any | null>(null)
    const defaultCopy: ReactNode = <span style={{ wordBreak: 'keep-all' }}>Copy to clipboard</span>
    const copiedCopy: ReactNode = <span style={{ wordBreak: 'keep-all' }}>Successfully copied to clipboard!</span>
    const [copyHint, setCopyHint] = useState<ReactNode>(defaultCopy)
    const [prohibited, setProhibited] = useState<any>([])
    const [showsFormChanges, setShowsFormChanges] = useState<boolean>(false)
    const [userEdits, setUserEdits] = useState<any>([])
    const [editorChanges, setEditorChanges] = useState<SyncDiffType>()
    const [lastUserEdits, setLastUserEdits] = useState<any>([])
    const [squigglyTooltips, setSquigglyTooltips] = useState<any>([])
    const [lastChange, setLastChange] = useState<ProcessedType>()
    const [lastChangeWithSecrets, setLastChangeWithSecrets] = useState<ProcessedType>()
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
    const [hasUndo, setHasUndo] = useState<boolean>(false)
    const [hasRedo, setHasRedo] = useState<boolean>(false)

    // compile schema(s) just once
    const validationRef = useRef<unknown>()
    if (schema && !validationRef.current) {
        try {
            const ajv = new Ajv({ allErrors: true, verbose: true })
            if (!Array.isArray(schema)) {
                validationRef.current = [{ validator: ajv.compile(schema) }]
            } else {
                const schemas: any = []
                schema.forEach(({ type, required, schema }) => {
                    schemas.push({
                        type,
                        required,
                        validator: ajv.compile(schema),
                    })
                })
                validationRef.current = schemas
            }
        } catch (e) {}
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

    useResizeObserver(pageRef, (entry) => {
        const { width } = entry.contentRect
        let { height } = entry.contentRect
        if (variant === 'toolbar') {
            height -= 36
        }
        editorRef?.current?.layout({ width, height })
    })

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
            (e: { code: string; stopPropagation: () => void; preventDefault: () => void }) => {
                const selections = editorRef.current.getSelections()

                if (e.code === 'Enter') {
                    const editor = editorRef.current
                    const model = editor.getModel()
                    const pos = editor.getPosition()
                    const thisLine = model.getLineContent(pos.lineNumber)
                    const nextLine = model.getLineContent(pos.lineNumber + 1)
                    const times = Math.max(thisLine.search(/\S/), nextLine.search(/\S/))
                    const random = `${Math.floor(Math.random() * 1000)}`.padStart(4, '0')
                    const newLine = `${' '.repeat(times)}key${random}:  \n`
                    let range = new monacoRef.current.Range(pos.lineNumber + 1, 0, pos.lineNumber + 1, 0)
                    editor.executeEdits('new-key', [{ identifier: 'new-key', range, text: newLine }])
                    range = new monacoRef.current.Range(pos.lineNumber + 1, times + 1, pos.lineNumber + 1, times + 8)
                    editor.setSelection(range)
                    e.stopPropagation()
                    e.preventDefault()
                } else if (
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

    const onReportChange = (
        changes: any[],
        changeWithSecrets: {
            yaml: string
            mappings: { [name: string]: any[] }
            parsed: { [name: string]: any[] }
            resources: any[]
            hiddenSecretsValues: any[]
        },
        changeWithoutSecrets: {
            mappings: { [name: string]: any[] }
            parsed: { [name: string]: any[] }
            resources: any[]
        },
        errors: any[]
    ) => {
        if (changes.length || errors.length) {
            const editor = editorRef?.current
            const monaco = monacoRef?.current
            setEditorChanges({
                resources: changeWithSecrets.resources,
                warnings: formatErrors(errors, true),
                errors: formatErrors(errors),
                changes: formatChanges(editor, monaco, changes, changeWithoutSecrets),
            })
        } else {
            setEditorChanges(undefined)
        }
    }
    useEffect(() => {
        if (onEditorChange) {
            onEditorChange(editorChanges)
        }
    }, [editorChanges])

    // react to changes from form
    useEffect(() => {
        // parse/validate/secrets
        const {
            yaml,
            protectedRanges,
            errors,
            comparison: formComparison,
            change,
            changeWithSecrets,
        } = processForm(
            monacoRef,
            code,
            resources,
            changeStack,
            showSecrets ? undefined : secrets,
            immutables,
            userEdits,
            validationRef.current
        )
        let timeoutID: NodeJS.Timeout
        setLastUserEdits(userEdits)
        if (yaml.length) {
            setProhibited(protectedRanges)

            // using monaco editor setValue blows away undo/redo and decorations
            // but the design decision is the editor is agnostic of its form
            // so form changes aren't articulated into individual line changes
            const model = editorRef.current?.getModel()
            const saveDecorations = getResourceEditorDecorations(editorRef)
            model.setValue(yaml)
            editorRef.current.deltaDecorations([], saveDecorations)
            setLastChangeWithSecrets(changeWithSecrets)

            // determine what changes were made by form so we can decorate
            const { changes, userEdits: edits } = getFormChanges(
                errors,
                change,
                userEdits,
                formComparison,
                lastChange,
                lastFormComparison
            )

            // report to form
            onReportChange(edits, changeWithSecrets, change, errors)

            timeoutID = setTimeout(() => {
                // decorate errors, changes
                const squigglyTooltips = decorate(
                    false,
                    editorRef,
                    monacoRef,
                    errors,
                    changes,
                    change,
                    edits,
                    protectedRanges
                )
                setShowsFormChanges(!!lastChange)
                setSquigglyTooltips(squigglyTooltips)
                setLastFormComparison(formComparison)
                setLastChange(change)
                setUserEdits(edits)
            }, 0)
        }
        setHasRedo(false)
        setHasUndo(false)
        return () => clearInterval(timeoutID)
    }, [JSON.stringify(resources), code, showSecrets, immutables])

    // react to changes from editing yaml
    const onChange = useCallback(
        debounce((value, e) => {
            // ignore if setValue()
            if (!e.isFlush) {
                // parse/validate/secrets
                const {
                    protectedRanges,
                    errors,
                    comparison: userComparison,
                    change,
                    changeWithSecrets,
                } = processUser(
                    monacoRef,
                    value,
                    showSecrets ? undefined : secrets,
                    lastChangeWithSecrets?.hiddenSecretsValues,
                    immutables,
                    validationRef.current
                )
                setLastChangeWithSecrets(changeWithSecrets)
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
                onReportChange(changes, changeWithSecrets, change, errors)

                // decorate errors, changes
                const squigglyTooltips = decorate(
                    true,
                    editorRef,
                    monacoRef,
                    errors,
                    changes,
                    change,
                    userEdits,
                    protectedRanges
                )
                setSquigglyTooltips(squigglyTooltips)
                setUserEdits(changes)
                setShowsFormChanges(false)
                // don't set last change here--always comparing against last form
                //setLastChange(change)

                // set up a change stack that can be used to reconcile user changes typed here and if/when form changes occur
                setChangeStack({
                    baseResources: changeStack?.baseResources ?? changeWithSecrets?.resources ?? [],
                    customResources: changeWithSecrets.resources,
                })

                // undo/redo disable
                //TODO when multiple editors set for each
                const model = editorRef.current?.getModel()
                const editStacks = model?._undoRedoService._editStacks
                setHasRedo(editStacks?.values()?.next()?.value?.hasFutureElements())
                setHasUndo(editStacks?.values()?.next()?.value?.hasPastElements())
            }
        }, 100),
        [lastChange, lastFormComparison, userEdits]
    )

    const toolbarControls = (
        <>
            <div className="sy-c-code-editor__title">{editorTitle || 'YAML'}</div>
            <div>
                {/* undo */}
                <CodeEditorControl
                    icon={<UndoIcon />}
                    aria-label="Undo"
                    toolTipText="Undo"
                    isDisabled={!hasUndo}
                    onClick={() => {
                        editorRef?.current.trigger('source', 'undo')
                    }}
                />
                {/* redo */}
                <CodeEditorControl
                    icon={<RedoIcon />}
                    aria-label="Redo"
                    toolTipText="Redo"
                    isDisabled={!hasRedo}
                    onClick={() => {
                        editorRef?.current.trigger('source', 'redo')
                    }}
                />
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
                            selectedText.length === 0 ? lastChangeWithSecrets?.yaml : selectedText
                        )
                        setCopyHint(copiedCopy)
                        setTimeout(() => {
                            setCopyHint(defaultCopy)
                        }, 800)
                    }}
                    exitDelay={600}
                    variant="plain"
                >
                    {copyHint}
                </ClipboardCopyButton>
            </div>
            <div>
                <CodeEditorControl icon={<CloseIcon />} aria-label="Close" toolTipText="Close" onClick={onClose} />
            </div>
        </>
    )

    return (
        <div ref={pageRef} className="sync-editor__container">
            <CodeEditor
                isLineNumbersVisible={true}
                isReadOnly={readonly}
                isMinimapVisible={true}
                onChange={onChange}
                language={Language.yaml}
                customControls={variant === 'toolbar' ? toolbarControls : undefined}
                onEditorDidMount={onEditorDidMount}
                options={{
                    wordWrap: 'wordWrapColumn',
                    wordWrapColumn: 132,
                    scrollBeyondLastLine: true,
                    smoothScrolling: true,
                    glyphMargin: true,
                    tabSize: 2,
                    scrollbar: {
                        verticalScrollbarSize: 17,
                        horizontalScrollbarSize: 17,
                    },
                }}
            />
        </div>
    )
}
