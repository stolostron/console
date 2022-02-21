/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
import { global_BackgroundColor_dark_100 as editorBackground } from '@patternfly/react-tokens'
import jsYaml from 'js-yaml'
import 'monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution.js'
import 'monaco-editor/esm/vs/editor/editor.all.js'
import { useEffect, useState } from 'react'
import MonacoEditor, { monaco } from 'react-monaco-editor'
import './YAMLEditor.css'

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
        'editor.background': editorBackground.value,
        'editorGutter.background': '#292e34', // no pf token defined
        'editorLineNumber.activeForeground': '#fff',
        'editorLineNumber.foreground': '#f0f0f0',
    },
})
monaco.editor.setTheme('console')

export default function YAMLPage(props: { resource: any; editMode: boolean; width: string; height?: string }) {
    const { resource, editMode, width, height } = props
    const [editedResourceYaml, setEditedResourceYaml] = useState<string>('')

    useEffect(() => {
        if (resource) {
            setEditedResourceYaml(jsYaml.dump(resource, { indent: 2 }))
        }
    }, [resource])

    return (
        <MonacoEditor
            theme={'console'}
            width={width}
            height={height ?? '100%'}
            value={editedResourceYaml !== '' ? editedResourceYaml : jsYaml.dump(resource, { indent: 2 })}
            onChange={(value) => {
                setEditedResourceYaml(value)
            }}
            language={'yaml'}
            options={{
                colorDecorators: true,
                readOnly: !editMode,
                fontSize: 12,
                wordWrap: 'wordWrapColumn',
                wordWrapColumn: 132,
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                glyphMargin: true,
                tabSize: 2,
                // renderIndentGuides: false,
                scrollbar: {
                    verticalScrollbarSize: 17,
                    horizontalScrollbarSize: 17,
                },
            }}
        />
    )
}
