/* Copyright Contributors to the Open Cluster Management project */
'use strict'

import React from 'react'

class Range {
    constructor(startLineNumber?: number, startColumn?: number, endLineNumber?: number, endColumn?: number) {}
}

let mockEditor: {
    layout: () => void
    focus: () => void
    trigger: () => void
    onKeyDown: () => void
    changeViewZones: () => void
    getSelection: () => void
    setSelection: () => void
    setSelections: () => void
    revealLineInCenter: () => void
    onDidChangeModelContent: (cb: any) => void
    deltaDecorations: () => void
    getModel: () => {
        forceTokenization: () => void
        getLineCount: () => void
        getFullModelRange: () => void
        canUndo: () => boolean
        canRedo: () => boolean
        findMatches: (
            find: any
        ) => { range: { startColumn: number; startLineNumber: number; endColumn: number; endLineNumber: number } }[]
    }
}
let mockMonaco: { editor: { setModelLanguage: () => void }; Range: Range }
let mockChangeModelCallback: () => void

const MonacoEditor = (props: {
    value: string | number | readonly string[] | undefined
    onChange(value: string): unknown
    editorDidMount: (
        editor: {
            layout: () => void
            focus: () => void
            trigger: () => void
            onKeyDown: () => void
            changeViewZones: () => void
            getSelection: () => void
            setSelection: () => void
            setSelections: () => void
            revealLineInCenter: () => void
            onDidChangeModelContent: (cb: any) => void
            deltaDecorations: () => void
            getModel: () => {
                forceTokenization: () => void
                getLineCount: () => void
                getFullModelRange: () => void
                canUndo: () => boolean
                canRedo: () => boolean
                findMatches: (find: any) => {
                    range: { startColumn: number; startLineNumber: number; endColumn: number; endLineNumber: number }
                }[]
            }
        },
        monaco: { editor: { setModelLanguage: () => void }; Range: Range }
    ) => void
    wrapperClassName: any
}) => {
    if (!mockEditor) {
        const model = {
            forceTokenization: () => {},
            getLineCount: () => {},
            getFullModelRange: () => {},
            canUndo: () => true,
            canRedo: () => true,
            findMatches: (find: string) => {
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
            Range: Range,
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
