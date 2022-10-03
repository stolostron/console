/* Copyright Contributors to the Open Cluster Management project */
'use strict'

import React from 'react'

let mockEditor
let mockMonaco
let mockChangeModelCallback

const MonacoEditor = (props) => {
    if (!mockEditor) {
        const model = {
            forceTokenization: () => {},
            getLineCount: () => {},
            getFullModelRange: () => {},
            canUndo: () => true,
            canRedo: () => true,
            findMatches: (find) => {
                return find === 'that'
                    ? [
                          { range: { startColumn: 0, startLineNumber: 0, endColumn: 0, endLineNumber: 1 } },
                          { range: { startColumn: 0, startLineNumber: 1, endColumn: 0, endLineNumber: 2 } },
                      ]
                    : []
            },
        }
        mockEditor = {
            layout: () => {},
            focus: () => {},
            trigger: () => {},
            onKeyDown: () => {},
            changeViewZones: () => {},
            getSelection: () => {},
            setSelection: () => {},
            setSelections: () => {},
            revealLineInCenter: () => {},
            onDidChangeModelContent: (cb) => {
                mockChangeModelCallback = cb
            },
            deltaDecorations: () => {},
            getModel: () => model,
        }
        mockMonaco = {
            editor: { setModelLanguage: () => {} },
            Range: () => {},
        }
        props.editorDidMount(mockEditor, mockMonaco)
    }
    return (
        <textarea
            aria-label="monaco"
            data-auto={props.wrapperClassName}
            onChange={(e) => {
                props.onChange(e.target.value)
                mockChangeModelCallback()
            }}
            value={props.value}
        ></textarea>
    )
}

export default MonacoEditor
