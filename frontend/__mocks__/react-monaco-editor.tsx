/* Copyright Contributors to the Open Cluster Management project */
import React from 'react'
import { fireEvent } from '@testing-library/react'

class Range {
  startLineNumber: number | undefined
  endLineNumber: number | undefined
  endColumn: number | undefined
  startColumn: number | undefined
  constructor(startLineNumber?: number, startColumn?: number, endLineNumber?: number, endColumn?: number) {
    this.endLineNumber = endLineNumber
    this.endColumn = endColumn
    this.startLineNumber = startLineNumber
    this.startColumn = startColumn
  }
  containsPosition(position) {
    return Range.containsPosition(this, position)
  }
  static containsPosition(range, position) {
    if (position.lineNumber < range.startLineNumber || position.lineNumber > range.endLineNumber) {
      return false
    }
    if (position.lineNumber === range.startLineNumber && position.column < range.startColumn) {
      return false
    }
    if (position.lineNumber === range.endLineNumber && position.column > range.endColumn) {
      return false
    }
    return true
  }
}
class Selection {
  startLineNumber: number | undefined
  endLineNumber: number | undefined
  endColumn: number | undefined
  startColumn: number | undefined
  constructor(startLineNumber?: number, startColumn?: number, endLineNumber?: number, endColumn?: number) {
    this.endLineNumber = endLineNumber
    this.endColumn = endColumn
    this.startLineNumber = startLineNumber
    this.startColumn = startColumn
  }
}

interface MockModel {
  _commandManager: {
    future: any[]
    past: any[]
  }
  forceTokenization: () => void
  getValue: () => string
  setValue: (value: string) => void
  getAllDecorations: () => any[]
  getLineCount: () => void
  getFullModelRange: () => void
  getValueInRange: () => string
  canUndo: () => boolean
  canRedo: () => boolean
  onDidChangeContent: () => void
  findMatches: (find: string) => { range: Range }[]
}

interface MockEditor {
  layout: () => void
  focus: () => void
  trigger: () => void
  onKeyDown: () => void
  onMouseDown: () => void
  getVisibleRanges: () => any[]
  onDidBlurEditorWidget: () => void
  changeViewZones: () => void
  addCommand: () => void
  getSelection: () => void
  setSelection: () => void
  setSelections: () => void
  setTheme: (theme: any) => void
  saveViewState: () => void
  restoreViewState: () => any
  revealLineInCenter: () => void
  onDidChangeModelContent: (cb: any) => void
  deltaDecorations: () => void
  getModel: () => MockModel
}

interface MockMonaco {
  editor: { setModelLanguage: () => void; defineTheme: () => void; setTheme: () => void }
  languages: { registerHoverProvider: () => void }
  KeyMod: any
  KeyCode: any
  Range: Range
  Selection: Selection
}

const MonacoEditor = (props: {
  value: string
  onChange(value: string, e: any): unknown
  editorDidMount: (editor: MockEditor, monaco: MockMonaco) => void
  wrapperClassName: any
}) => {
  const editorMockRef = React.useRef<any | null>(null)
  if (!editorMockRef.current) {
    editorMockRef.current = {}
    editorMockRef.current.lastTypeInx = -1
    editorMockRef.current.undoStack = [props.value]
    editorMockRef.current.redoStack = []
    editorMockRef.current.editorContent = props.value
    const model: MockModel = {
      _commandManager: {
        future: ['future'],
        past: ['past'],
      },
      forceTokenization: () => {},
      getLineCount: () => {},
      getFullModelRange: () => {},
      canUndo: () => true,
      canRedo: () => true,
      getValue: () => {
        return editorMockRef.current.editorContent
      },
      setValue: (value: string) => {
        editorMockRef.current.editorContent = value
        editorMockRef.current.undoStack = [value]
      },
      getAllDecorations: () => [],
      getValueInRange: () => '',
      onDidChangeContent: () => {},
      findMatches: (find: string) => {
        return find === 'that' ? [{ range: new Range(0, 0, 0, 1) }, { range: new Range(0, 1, 0, 2) }] : []
      },
    }
    editorMockRef.current.mockEditor = {
      layout: () => {},
      focus: () => {},
      trigger: (_source, action) => {
        switch (action) {
          case 'undo':
            editorMockRef.current.undoRedo = true
            editorMockRef.current.redoStack.push(editorMockRef.current.undoStack.pop())
            fireEvent.change(editorMockRef.current.textArea, {
              target: {
                value: editorMockRef.current.undoStack[editorMockRef.current.undoStack.length - 1],
              },
            })
            break
          case 'redo':
            editorMockRef.current.undoRedo = true
            const value = editorMockRef.current.redoStack.pop()
            editorMockRef.current.undoStack.push(value)
            fireEvent.change(editorMockRef.current.textArea, {
              target: { value },
            })
            break
        }
      },
      onKeyDown: (handler) => {
        editorMockRef.current.onKeyDown = handler
      },
      onClick: () => {},
      onMouseDown: (handler) => {
        editorMockRef.current.onMouseDown = handler
      },
      onDidBlurEditorWidget: (handler) => {
        editorMockRef.current.onDidBlurEditorWidget = handler
      },
      getVisibleRanges: () => [],
      addCommand: () => {},
      changeViewZones: () => {},
      getSelection: () => {},
      setSelection: () => {},
      setSelections: () => {},
      saveViewState: () => null,
      setTheme: () => null,
      restoreViewState: () => {},
      revealLineInCenter: () => {},
      onDidChangeModelContent: (cb: any) => {
        editorMockRef.current.changeModelCallback = cb
      },
      deltaDecorations: (_oldDecorations: string[], newDecorations: any[]) => {
        editorMockRef.current.newDecorations = JSON.stringify(newDecorations)
      },
      getModel: () => model,
    }
    editorMockRef.current.mockMonaco = {
      editor: { setModelLanguage: () => {}, defineTheme: () => {}, setTheme: () => {} },
      languages: { registerHoverProvider: () => {} },
      KeyMod: {},
      KeyCode: {},
      Range: Range,
      Selection: Selection,
    }
    props.editorDidMount(editorMockRef.current.mockEditor, editorMockRef.current.mockMonaco)
  }
  return (
    <textarea
      aria-label="monaco"
      data-auto={props.wrapperClassName}
      data-decorators={editorMockRef.current.newDecorations}
      className="monaco-editor"
      ref={(ref) => {
        editorMockRef.current.textArea = ref
      }}
      onClick={(e) => {}}
      onMouseDown={(e) => {
        const editorEvent = {
          target: {
            position: {
              lineNumber: 12,
              column: 12,
            },
          },
        }
        editorMockRef.current.onMouseDown(editorEvent)
      }}
      onFocus={() => {
        editorMockRef.current.textArea.classList.add('focused')
      }}
      onBlur={() => {
        editorMockRef.current.textArea.classList.remove('focused')
        editorMockRef.current.onDidBlurEditorWidget()
      }}
      onChange={(e) => {
        if (editorMockRef.current.undoRedo === true) {
          editorMockRef.current.undoRedo = false
        } else {
          if (editorMockRef.current.textArea.selectionEnd !== editorMockRef.current.lastTypeInx + 1) {
            editorMockRef.current.undoStack.push(e.target.value)
          } else {
            editorMockRef.current.undoStack[editorMockRef.current.undoStack.length - 1] = e.target.value
          }
          editorMockRef.current.lastTypeInx = editorMockRef.current.textArea.selectionEnd
        }
        editorMockRef.current.editorContent = e.target.value
        props.onChange(editorMockRef.current.editorContent, e)
        //editorMockRef.current.changeModelCallback()
      }}
      value={editorMockRef.current.editorContent}
    ></textarea>
  )
}

export default MonacoEditor
