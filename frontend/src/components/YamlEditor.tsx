/* Copyright Contributors to the Open Cluster Management project */
import { CodeEditor, Language } from '@patternfly/react-code-editor'
import { global_BackgroundColor_dark_100 } from '@patternfly/react-tokens'
import useResizeObserver from '@react-hook/resize-observer'
import { debounce } from 'lodash'
import 'monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution.js'
import 'monaco-editor/esm/vs/editor/editor.all.js'
import { useCallback, useRef } from 'react'
import './YAMLEditor.css'

export default function YAMLEditor(props: {
    resourceYAML: any
    editMode: boolean
    width: string
    height?: string
    setEditedResourceYaml?: React.Dispatch<React.SetStateAction<string>>
}) {
    const { resourceYAML, editMode, setEditedResourceYaml, width, height } = props
    const pageRef = useRef(null)
    const editorRef = useRef<any | null>(null)
    const monacoRef = useRef<any | null>(null)

    useResizeObserver(pageRef, (entry) => {
        const { width } = entry.contentRect
        const { height } = entry.contentRect
        editorRef?.current?.layout({ width, height })
    })

    function onEditorDidMount(editor: any, monaco: any) {
        // create 'console' theme
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
        monaco.editor.setTheme('console')
        editorRef.current = editor
        monacoRef.current = monaco
    }

    // react to changes from editing yaml
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const onChange = useCallback(
        debounce((value) => {
            setEditedResourceYaml && setEditedResourceYaml(value)
        }, 100),
        []
    )

    return (
        <div ref={pageRef}>
            <CodeEditor
                width={width}
                height={height ?? '100%'}
                code={resourceYAML}
                onChange={onChange}
                language={Language.yaml}
                onEditorDidMount={onEditorDidMount}
                isReadOnly={!editMode}
                isLineNumbersVisible={true}
                isMinimapVisible={true}
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
