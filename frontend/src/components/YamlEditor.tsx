/* Copyright Contributors to the Open Cluster Management project */
import { global_BackgroundColor_dark_100 } from '@patternfly/react-tokens'
import jsYaml from 'js-yaml'
import { debounce } from 'lodash'
import 'monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution.js'
import 'monaco-editor/esm/vs/editor/editor.all.js'
import * as monacoEditor from 'monaco-editor/esm/vs/editor/editor.api'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import MonacoEditor, { monaco } from 'react-monaco-editor'
import './YAMLEditor.css'

/**
 *
 * @param resourceYaml - JSON object of current resource
 * @param fieldPath  - path to field ex: /metadata/labels, /spec/tolerations
 */
export const findResourceFieldLineNumber = (resourceYaml: any, fieldPath: string) => {
    const fieldIndentation = (fieldPath.split('/').length - 2) * 2
    const field = fieldPath.split('/')[fieldPath.split('/').length - 1]
    const indentationStr = ''.padStart(fieldIndentation, ' ')
    const parsedYaml = jsYaml.dump(resourceYaml).split('\n')
    return parsedYaml.indexOf(`${indentationStr}${field}:`) + 1
}

export default function YAMLEditor(props: {
    resourceYAML: string
    readOnly: boolean
    height: number // in pixels - to be convested to string in memo hook
    setResourceYaml?: React.Dispatch<React.SetStateAction<string>>
    defaultScrollToLine?: number
}) {
    const { resourceYAML, readOnly, height, setResourceYaml, defaultScrollToLine } = props
    const editorRef = useRef<monacoEditor.editor.IStandaloneCodeEditor | null>(null)
    const monacoRef = useRef<typeof monacoEditor | null>(null)
    const [hasManagedFieldsFolded, setHasManagedFieldsFolded] = useState<boolean>(false)

    const editorHeight: string = useMemo(() => {
        return height < 100 ? '100px' : `${height}px`
    }, [height])

    useEffect(() => {
        if (process.env.NODE_ENV === 'test') return
        /* istanbul ignore if */
        if (resourceYAML && defaultScrollToLine) {
            editorRef.current?.revealLineNearTop(defaultScrollToLine)
        }
    }, [resourceYAML, defaultScrollToLine])

    // By default we will collapse the managedFields section
    useEffect(() => {
        let managedFieldsStart = 0
        let managedFieldsEnd = 0
        process.env.NODE_ENV !== 'test' && editorRef.current?.setSelection(new monaco.Range(1, 0, 1, 0))
        if (resourceYAML && !hasManagedFieldsFolded) {
            const resourceLines = resourceYAML.split('\n')
            resourceLines.forEach((line, i) => {
                if (line === '  managedFields:') {
                    managedFieldsStart = i + 1
                } else if (managedFieldsStart > 0 && managedFieldsEnd === 0 && (line[2] !== ' ' || line[0] !== ' ')) {
                    managedFieldsEnd = i
                }
            })
            /* istanbul ignore if */
            if (managedFieldsStart > 0 && managedFieldsEnd > 0) {
                if (process.env.NODE_ENV === 'test') return
                const top = editorRef.current?.getScrollTop()
                editorRef.current?.setSelection(new monaco.Range(managedFieldsStart, 0, managedFieldsEnd, 0))
                editorRef.current
                    ?.getAction('editor.fold')
                    .run()
                    .then(() => {
                        if (defaultScrollToLine) {
                            editorRef.current?.revealLineNearTop(defaultScrollToLine)
                        } else {
                            editorRef.current?.setScrollTop(Math.abs(top ?? 0))
                        }
                        setHasManagedFieldsFolded(true)
                    })
                    .catch(() => console.error('Encountered an error while trying to fold the ManagedFields section.'))
            }
        }
    }, [resourceYAML, defaultScrollToLine, hasManagedFieldsFolded])

    /* istanbul ignore next */
    function onEditorDidMount(editor: monacoEditor.editor.IStandaloneCodeEditor, monaco: typeof monacoEditor) {
        if (process.env.NODE_ENV !== 'test') {
            monaco.editor.defineTheme('console', {
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
                    'editor.background': global_BackgroundColor_dark_100.value,
                    'editorGutter.background': '#292e34', // no pf token defined
                    'editorLineNumber.activeForeground': '#fff',
                    'editorLineNumber.foreground': '#f0f0f0',
                },
            })
            monaco.editor.setTheme('console')
        }
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

    // react to changes from editing yaml
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const onChange = useCallback(
        debounce((value) => {
            setResourceYaml && setResourceYaml(value)
        }, 100),
        []
    )

    return (
        <div
            style={{
                minHeight: '100px',
                flex: 1,
                position: 'relative',
            }}
        >
            <MonacoEditor
                language="yaml"
                theme="console"
                height={editorHeight}
                value={resourceYAML}
                options={{
                    readOnly,
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
                editorDidMount={onEditorDidMount}
                onChange={onChange}
            />
        </div>
    )
}
