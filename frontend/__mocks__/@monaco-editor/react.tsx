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
  intersectRanges(other: Range) {
    if (
      (other.endLineNumber ?? 0) < (this.startLineNumber ?? 0) ||
      (other.startLineNumber ?? 0) > (this.endLineNumber ?? 0)
    ) {
      return null
    }
    return new Range(this.startLineNumber, this.startColumn, this.endLineNumber, this.endColumn)
  }
}

const mockDisposable = () => ({ dispose: () => {} })
class Selection {
  startLineNumber: number | undefined
  selectionStartLineNumber: number | undefined
  selectionStartColumn: number | undefined
  endLineNumber: number | undefined
  endColumn: number | undefined
  startColumn: number | undefined
  constructor(startLineNumber?: number, startColumn?: number, endLineNumber?: number, endColumn?: number) {
    this.endLineNumber = endLineNumber
    this.endColumn = endColumn
    this.startLineNumber = startLineNumber
    this.selectionStartLineNumber = startLineNumber
    this.startColumn = startColumn
    this.selectionStartColumn = startColumn
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
  getLineContent: (line: number) => string
  getAllDecorations: () => any[]
  getLineCount: () => number
  getLineMaxColumn: (lineNumber: number) => number
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
  getDomNode: () => HTMLElement
  getContainerDomNode: () => HTMLElement
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
  getValue: () => string
  executeEdits: (id: string, edits: [{ range: Range; text: string }]) => void
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
  onMount: (editor: MockEditor, monaco: MockMonaco) => void
  wrapperClassName: any
}) => {
  const editorMockRef = React.useRef<any | null>(null)
  if (!editorMockRef.current) {
    editorMockRef.current = { container: document.createElement('div') }
    editorMockRef.current.lastTypeInx = -1
    editorMockRef.current.undoStack = [props.value]
    editorMockRef.current.redoStack = []
    editorMockRef.current.editorContent = props.value
    const model: MockModel & { dispose: () => void } = {
      dispose: () => {},
      _commandManager: {
        future: ['future'],
        past: ['past'],
      },
      forceTokenization: () => {},
      getLineCount: () => {
        const text = editorMockRef.current.editorContent
        if (!text) {
          return 1
        }
        return text.split('\n').length
      },
      getLineMaxColumn: (lineNumber: number) => {
        const line = editorMockRef.current.editorContent.split('\n')[lineNumber - 1] ?? ''
        return line.length + 1
      },
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
      getLineContent: (line) => {
        return editorMockRef.current.editorContent.split('\n')[line]
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
        return mockDisposable()
      },
      onClick: () => {},
      onMouseDown: (handler) => {
        editorMockRef.current.onMouseDown = handler
        return mockDisposable()
      },
      onDidBlurEditorWidget: (handler) => {
        editorMockRef.current.onDidBlurEditorWidget = handler
        return mockDisposable()
      },
      onDidFocusEditorWidget: (handler: () => void) => {
        editorMockRef.current.onDidFocusEditorWidget = handler
        return mockDisposable()
      },
      onDidChangeModel: () => mockDisposable(),
      onDidChangeModelContent: () => mockDisposable(),
      getVisibleRanges: () => [],
      addCommand: () => {},
      changeViewZones: () => {},
      getDomNode: () => {
        return editorMockRef.current.textArea
      },
      getContainerDomNode: () => {
        return editorMockRef.current.container
      },
      getSelection: () => {
        const ta = editorMockRef.current.textArea
        const value = ta.value
        const startLines = value.slice(0, ta.selectionStart).split('\n')
        const startLineNumber = startLines.length
        const startColumn = startLines[startLines.length - 1].length + 1
        const endLines = value.slice(0, ta.selectionEnd).split('\n')
        const endLineNumber = endLines.length
        const endColumn = endLines[endLines.length - 1].length + 1
        return new Selection(startLineNumber, startColumn, endLineNumber, endColumn)
      },
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
      getValue: () => {
        return editorMockRef.current.editorContent
      },
      setModel: (nextModel: { getValue: () => string; dispose?: () => void }) => {
        editorMockRef.current.editorContent = nextModel.getValue()
        if (editorMockRef.current.textArea) {
          editorMockRef.current.textArea.value = editorMockRef.current.editorContent
        }
      },
      hasTextFocus: () => !!editorMockRef.current.textArea?.classList.contains('focused'),
      getPosition: () => ({ lineNumber: 1, column: 1 }),
      getSelections() {
        return [editorMockRef.current.mockEditor.getSelection()]
      },
      executeEdits: (id, edits) => {
        const { text } = edits[0]
        const ta = editorMockRef.current.textArea
        const v = editorMockRef.current.textArea.value
        const newValue = v.substring(0, ta.selectionStart) + text + v.substring(ta.selectionEnd, v.length)
        editorMockRef.current.editorContent = newValue
        if (ta) {
          ta.value = newValue
        }
        props.onChange(newValue, { target: { value: newValue } })
      },
    }
    editorMockRef.current.mockMonaco = {
      editor: {
        setModelLanguage: () => {},
        defineTheme: () => {},
        setTheme: () => {},
        createModel: (value: string) => ({
          dispose: () => {},
          getValue: () => value,
          setValue: jest.fn(),
        }),
        createDiffNavigator: () => ({
          dispose: () => {},
          previous: jest.fn(),
          next: jest.fn(),
        }),
      },
      languages: {
        registerHoverProvider: (_language: string, provider: { provideHover: (model: unknown, position: unknown) => unknown }) => {
          editorMockRef.current.hoverProvider = provider
          return { dispose: () => {} }
        },
      },
      KeyMod: {},
      KeyCode: {},
      Range: Range,
      Selection: Selection,
    }
    props.onMount(editorMockRef.current.mockEditor, editorMockRef.current.mockMonaco)
  }
  return (
    <div
      ref={(ref) => {
        if (ref) editorMockRef.current.container = ref
      }}
    >
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
      onKeyDown={(e) => {
        editorMockRef.current.onKeyDown?.({
          code: e.code,
          ctrlKey: e.ctrlKey,
          metaKey: e.metaKey,
          stopPropagation: () => e.stopPropagation(),
          preventDefault: () => e.preventDefault(),
        })
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
    </div>
  )
}

const buildMockEditor = (props: { onChange?: (value: string, e: any) => void; initialValue?: string }) => {
  const editorMockRef: { current: any } = { current: { container: document.createElement('div'), editorContent: props.initialValue ?? '' } }
  editorMockRef.current.lastTypeInx = -1
  editorMockRef.current.undoStack = [editorMockRef.current.editorContent]
  editorMockRef.current.redoStack = []
  const model: MockModel & { dispose: () => void } = {
    dispose: () => {},
    _commandManager: { future: ['future'], past: ['past'] },
    forceTokenization: () => {},
    getLineCount: () => {
      const text = editorMockRef.current.editorContent
      return text ? text.split('\n').length : 1
    },
    getLineMaxColumn: (lineNumber: number) => {
      const line = editorMockRef.current.editorContent.split('\n')[lineNumber - 1] ?? ''
      return line.length + 1
    },
    getFullModelRange: () => {},
    canUndo: () => true,
    canRedo: () => true,
    getValue: () => editorMockRef.current.editorContent,
    setValue: (value: string) => {
      editorMockRef.current.editorContent = value
      editorMockRef.current.undoStack = [value]
    },
    getLineContent: (line: number) => editorMockRef.current.editorContent.split('\n')[line],
    getAllDecorations: () => [],
    getValueInRange: () => '',
    onDidChangeContent: () => {},
    findMatches: () => [],
  }
  const mockEditor = {
    layout: () => {},
    focus: () => {},
    trigger: () => {},
    onKeyDown: (handler: (e: unknown) => void) => {
      editorMockRef.current.onKeyDown = handler
      return mockDisposable()
    },
    onClick: () => {},
    onMouseDown: (handler: (e: unknown) => void) => {
      editorMockRef.current.onMouseDown = handler
      return mockDisposable()
    },
    onDidBlurEditorWidget: (handler: () => void) => {
      editorMockRef.current.onDidBlurEditorWidget = handler
      return mockDisposable()
    },
    onDidFocusEditorWidget: (handler: () => void) => {
      editorMockRef.current.onDidFocusEditorWidget = handler
      return mockDisposable()
    },
    onDidChangeModel: () => mockDisposable(),
    getVisibleRanges: () => [],
    addCommand: () => {},
    changeViewZones: (fn: (accessor: { addZone: (zone: unknown) => void }) => void) => {
      fn({ addZone: () => {} })
    },
    getDomNode: () => editorMockRef.current.textArea,
    getContainerDomNode: () => editorMockRef.current.container,
    getSelection: () => {
      const ta = editorMockRef.current.textArea
      const value = ta?.value ?? editorMockRef.current.editorContent
      const startLines = value.slice(0, ta?.selectionStart ?? 0).split('\n')
      const startLineNumber = startLines.length
      const startColumn = startLines[startLines.length - 1].length + 1
      const endLines = value.slice(0, ta?.selectionEnd ?? value.length).split('\n')
      const endLineNumber = endLines.length
      const endColumn = endLines[endLines.length - 1].length + 1
      return new Selection(startLineNumber, startColumn, endLineNumber, endColumn)
    },
    setSelection: () => {},
    setSelections: () => {},
    saveViewState: () => null,
    setTheme: () => null,
    restoreViewState: () => {},
    revealLineInCenter: () => {},
    onDidChangeModelContent: (cb: (e: unknown) => void) => {
      editorMockRef.current.changeModelCallback = cb
      return mockDisposable()
    },
    deltaDecorations: (_old: string[], newDecorations: unknown[]) => {
      editorMockRef.current.newDecorations = JSON.stringify(newDecorations)
    },
    getModel: () => model,
    getValue: () => editorMockRef.current.editorContent,
    setModel: (nextModel: { getValue: () => string }) => {
      editorMockRef.current.editorContent = nextModel.getValue()
      if (editorMockRef.current.textArea) {
        editorMockRef.current.textArea.value = editorMockRef.current.editorContent
      }
    },
    executeEdits: (_id: string, edits: [{ text: string }]) => {
      const { text } = edits[0]
      const ta = editorMockRef.current.textArea
      const v = ta?.value ?? editorMockRef.current.editorContent
      const newValue = v.substring(0, ta?.selectionStart ?? 0) + text + v.substring(ta?.selectionEnd ?? v.length, v.length)
      editorMockRef.current.editorContent = newValue
      if (ta) ta.value = newValue
      props.onChange?.(newValue, { target: { value: newValue }, isFlush: false })
    },
    hasTextFocus: () => !!editorMockRef.current.textArea?.classList.contains('focused'),
    getPosition: () => ({ lineNumber: 1, column: 1 }),
    getSelections() {
      return [mockEditor.getSelection()]
    },
  }
  const mockMonaco = {
    editor: {
      setModelLanguage: () => {},
      defineTheme: () => {},
      setTheme: () => {},
      createModel: (value: string) => ({
        dispose: () => {},
        getValue: () => value,
        setValue: jest.fn(),
      }),
      createDiffNavigator: () => ({
        dispose: () => {},
        previous: jest.fn(),
        next: jest.fn(),
      }),
    },
    languages: {
      registerHoverProvider: (_language: string, provider: { provideHover: (model: unknown, position: unknown) => unknown }) => {
        editorMockRef.current.hoverProvider = provider
        return { dispose: () => {} }
      },
    },
    KeyMod: {},
    KeyCode: {},
    Range: Range,
    Selection: Selection,
  }
  return { editorMockRef, mockEditor, mockMonaco, model }
}

const MockDiffEditor = (props: {
  onMount?: (diffEditor: unknown, monaco: MockMonaco) => void
  beforeMount?: (monaco: MockMonaco) => void
  onChange?: (value: string, e: unknown) => void
}) => {
  const setupRef = React.useRef<ReturnType<typeof buildMockEditor> | null>(null)
  if (!setupRef.current) {
    const built = buildMockEditor({ onChange: props.onChange })
    props.beforeMount?.(built.mockMonaco)
    const diffEditor = {
      getOriginalEditor: () => built.mockEditor,
      getModifiedEditor: () => built.mockEditor,
      getModel: () => ({ original: built.model, modified: built.model }),
      setModel: jest.fn(),
      updateOptions: jest.fn(),
      layout: jest.fn(),
      focus: jest.fn(),
    }
    props.onMount?.(diffEditor, built.mockMonaco)
    setupRef.current = built
  }
  const { editorMockRef, mockEditor } = setupRef.current
  return (
    <div
      ref={(ref) => {
        if (ref) editorMockRef.current.container = ref
      }}
    >
      <textarea
        aria-label="monaco-diff"
        className="monaco-editor"
        ref={(ref) => {
          editorMockRef.current.textArea = ref
        }}
        onFocus={() => {
          editorMockRef.current.textArea?.classList.add('focused')
          editorMockRef.current.onDidFocusEditorWidget?.()
        }}
        onBlur={() => {
          editorMockRef.current.textArea?.classList.remove('focused')
          editorMockRef.current.onDidBlurEditorWidget?.()
        }}
        onChange={(e) => {
          editorMockRef.current.editorContent = e.target.value
          props.onChange?.(e.target.value, { isFlush: false })
          editorMockRef.current.changeModelCallback?.({ isFlush: false })
        }}
        value={editorMockRef.current.editorContent}
      />
    </div>
  )
}

export const Editor = MonacoEditor
export const DiffEditor = MockDiffEditor
export const loader = { config: () => undefined }
export const useMonaco = () => [null, () => undefined] as const

export default MonacoEditor
