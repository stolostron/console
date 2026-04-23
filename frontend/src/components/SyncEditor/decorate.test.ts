/* Copyright Contributors to the Open Cluster Management project */

import { decorate, getResourceEditorDecorations, rangeForHighlightPath } from './decorate'
import { ErrorType } from './validation'
import type { Monaco } from '@monaco-editor/react'
import type { editor as editorTypes } from 'monaco-editor'

class MockRange {
  startLineNumber: number
  startColumn: number
  endLineNumber: number
  endColumn: number

  constructor(startLineNumber: number, startColumn: number, endLineNumber: number, endColumn: number) {
    this.startLineNumber = startLineNumber
    this.startColumn = startColumn
    this.endLineNumber = endLineNumber
    this.endColumn = endColumn
  }

  getStartPosition() {
    return { lineNumber: this.startLineNumber, column: this.startColumn }
  }
}

function createMonaco(): Monaco {
  return { Range: MockRange as unknown as Monaco['Range'] } as Monaco
}

function createEditor(visibleRange?: { containsPosition: (p: { lineNumber: number; column: number }) => boolean }) {
  const deltaDecorations = jest.fn().mockReturnValue([])
  const revealLineInCenter = jest.fn()
  const decorations: { id: string; options: Record<string, unknown> }[] = []
  const getAllDecorations = jest.fn(() => decorations)
  const containsPosition = visibleRange?.containsPosition ?? jest.fn().mockReturnValue(false)
  const getVisibleRanges = jest.fn(() => [{ containsPosition }])

  const editor = {
    deltaDecorations,
    revealLineInCenter,
    getVisibleRanges,
    getModel: jest.fn(() => ({
      getAllDecorations,
    })),
  } as unknown as editorTypes.IStandaloneCodeEditor

  return { editor, deltaDecorations, revealLineInCenter, getVisibleRanges, getAllDecorations, decorations }
}

const baseChange = {
  parsed: {},
  mappings: {} as Record<string, unknown[]>,
  paths: {} as Record<string, unknown>,
}

describe('rangeForHighlightPath', () => {
  const monaco = createMonaco()

  it('returns null for empty path or missing mappings', () => {
    expect(rangeForHighlightPath(monaco, {}, { Pod: [] }, '')).toBeNull()
    expect(rangeForHighlightPath(monaco, {}, { Pod: [] }, '   ')).toBeNull()
    expect(rangeForHighlightPath(monaco, {}, undefined, 'Pod.spec')).toBeNull()
  })

  it('strips ;id= suffix and resolves path after normalizing escaped dots in the first segment', () => {
    const mappings = {
      'foo.bar': [
        {
          $gv: { start: { line: 2, column: 3 }, end: { line: 2, column: 10 } },
        },
      ],
    }
    // `foo.bar.baz` → kind `foo`, suffix `bar.baz`; fallback tryKind(`foo.bar`, [`bar.baz`]) → pathKey `foo.bar.0.bar.baz`
    const paths = { 'foo.bar.0.bar.baz': mappings['foo.bar'][0] }
    const r = rangeForHighlightPath(monaco, paths, mappings as never, 'foo\\.bar.baz;id=xyz')
    expect(r).not.toBeNull()
    expect(r!.startLineNumber).toBe(2)
    expect(r!.startColumn).toBe(3)
    expect(r!.endLineNumber).toBe(2)
    expect(r!.endColumn).toBe(10)
  })

  it('resolves kind-only path using first mapping key', () => {
    const mappings = {
      Secret: [{ $r: 5, $l: 2 }],
    }
    const paths = { 'Secret.0': mappings.Secret[0] }
    const r = rangeForHighlightPath(monaco, paths as never, mappings as never, 'Secret')
    expect(r).not.toBeNull()
    expect(r!.startLineNumber).toBe(5)
    expect(r!.endLineNumber).toBe(6)
  })

  it('falls back to other mapping keys when kind not found', () => {
    const mappings = {
      A: [{ $r: 1, $l: 1 }],
      B: [{ $r: 9, $l: 1 }],
    }
    const paths = { 'B.0': mappings.B[0] }
    const r = rangeForHighlightPath(monaco, paths as never, mappings as never, 'B')
    expect(r!.startLineNumber).toBe(9)
  })

  it('resolves path with # array selector via paths.$v', () => {
    const leaf = { $r: 3, $l: 1 }
    const mappings = {
      Pod: [{}, leaf],
    }
    const paths = {
      'Pod.0.spec': { $v: [{ $v: 'item-a' }, { $v: 'item-b', ...leaf }] },
    }
    // pathKey becomes Pod.0.spec#item-b → array lookup on Pod.0.spec
    const r = rangeForHighlightPath(monaco, paths as never, mappings as never, 'Pod.spec#item-b')
    expect(r!.startLineNumber).toBe(3)
  })

  it('uses $gv with col when column absent', () => {
    const mappings = {
      X: [{ $gv: { start: { line: 1, col: 2 }, end: { line: 1, col: 8 } } }],
    }
    const paths = { 'X.0': mappings.X[0] }
    const r = rangeForHighlightPath(monaco, paths as never, mappings as never, 'X')
    expect(r!.startColumn).toBe(2)
    expect(r!.endColumn).toBe(8)
  })

  it('returns null when mapping leaf has no range data', () => {
    const mappings = { Z: [{}] }
    const paths = { 'Z.0': {} }
    expect(rangeForHighlightPath(monaco, paths as never, mappings as never, 'Z')).toBeNull()
  })
})

describe('getResourceEditorDecorations', () => {
  it('returns empty when editor has no model', () => {
    const editor = { getModel: () => null } as unknown as editorTypes.IStandaloneCodeEditor
    expect(getResourceEditorDecorations(editor, false)).toEqual([])
  })

  it('keeps squiggly, yaml highlight, line decorations, and glyph margin except protected when no errors', () => {
    const decorations = [
      { options: { className: 'squiggly-error' } },
      { options: { className: 'syncEditorYamlHighlight' } },
      { options: { linesDecorationsClassName: 'insertedLineDecoration' } },
      { options: { linesDecorationsClassName: 'customLineDecoration' } },
      { options: { glyphMarginClassName: 'errorDecoration', inlineClassName: 'other' } },
      { options: { inlineClassName: 'protectedDecoration' } },
    ]
    const editor = {
      getModel: () => ({
        getAllDecorations: () => decorations,
      }),
    } as unknown as editorTypes.IStandaloneCodeEditor
    const result = getResourceEditorDecorations(editor, false)
    expect(result).toHaveLength(5)
  })

  it('does not match standalone protected inline (filter requires squiggly, lines, highlight, or glyph rule)', () => {
    const decorations = [{ options: { inlineClassName: 'protectedDecoration' } }]
    const editor = {
      getModel: () => ({
        getAllDecorations: () => decorations,
      }),
    } as unknown as editorTypes.IStandaloneCodeEditor
    expect(getResourceEditorDecorations(editor, true)).toHaveLength(0)
  })
})

type DecorateChangeArg = Parameters<typeof decorate>[6]

describe('decorate', () => {
  const monaco = createMonaco()

  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('applies deltaDecorations and returns squiggly tooltips for validation errors', () => {
    const { editor, deltaDecorations } = createEditor()
    const errors = [
      {
        linePos: { start: { line: 2, col: 1 }, end: { line: 2, col: 5 } },
        message: 'bad^value',
        errorType: ErrorType.error,
      },
    ]
    const squiggly = decorate(false, true, editor, monaco, errors, [], baseChange, [], [], [], '')
    expect(deltaDecorations).toHaveBeenCalled()
    expect(squiggly.length).toBeGreaterThan(0)
    expect(squiggly[0].message).toContain('Bad')
  })

  it('uses warning styling for ErrorType.warning', () => {
    const { editor, deltaDecorations } = createEditor()
    decorate(
      false,
      true,
      editor,
      monaco,
      [
        {
          linePos: { start: { line: 1, col: 1 }, end: { line: 1, col: 3 } },
          message: 'w',
          errorType: ErrorType.warning,
        },
      ],
      [],
      baseChange,
      [],
      [],
      [],
      ''
    )
    const applied = deltaDecorations.mock.calls[0][1] as { options: { glyphMarginClassName?: string } }[]
    expect(applied.some((d) => d.options.glyphMarginClassName === 'warningDecoration')).toBe(true)
  })

  it('uses info styling for ErrorType.info', () => {
    const { editor, deltaDecorations } = createEditor()
    decorate(
      false,
      true,
      editor,
      monaco,
      [
        {
          linePos: { start: { line: 1, col: 1 }, end: { line: 1, col: 2 } },
          message: 'i',
          errorType: ErrorType.info,
        },
      ],
      [],
      baseChange,
      [],
      [],
      [],
      ''
    )
    const applied = deltaDecorations.mock.calls[0][1] as { options: { glyphMarginClassName?: string } }[]
    expect(applied.some((d) => d.options.glyphMarginClassName === 'infoDecoration')).toBe(true)
  })

  it('adds change decorations from mappings', () => {
    const { editor, deltaDecorations } = createEditor()
    const change = {
      parsed: {},
      mappings: { 'metadata.name': { $r: 4, $l: 1, $s: false } },
    } as unknown as DecorateChangeArg
    decorate(false, true, editor, monaco, [], [{ $t: 'C', $a: 'metadata.name', $f: 'short' }], change, [], [], [], '')
    const applied = deltaDecorations.mock.calls[0][1] as { options: { linesDecorationsClassName?: string } }[]
    expect(applied.some((d) => d.options.linesDecorationsClassName === 'insertedLineDecoration')).toBe(true)
  })

  it('adds preserved user edits as custom line decorations', () => {
    const { editor, deltaDecorations } = createEditor()
    const change = {
      parsed: {},
      mappings: { x: { $r: 2, $l: 1 } },
    } as unknown as DecorateChangeArg
    decorate(false, true, editor, monaco, [], [], change, [{ $t: 'N', $a: 'x', $f: null }], [], [], '')
    const applied = deltaDecorations.mock.calls[0][1] as { options: { linesDecorationsClassName?: string } }[]
    expect(applied.some((d) => d.options.linesDecorationsClassName === 'customLineDecoration')).toBe(true)
  })

  it('adds protected and filtered row decorations', () => {
    const { editor, deltaDecorations } = createEditor()
    decorate(false, true, editor, monaco, [], [], baseChange, [], [{ startLineNumber: 2, endLineNumber: 4 }], [7], '')
    const applied = deltaDecorations.mock.calls[0][1] as { options: { inlineClassName?: string; after?: unknown } }[]
    expect(applied.some((d) => d.options.inlineClassName === 'protectedDecoration')).toBe(true)
    expect(applied.some((d) => d.options.after)).toBe(true)
  })

  it('adds highlight decoration when path resolves', () => {
    const { editor, deltaDecorations } = createEditor()
    const change = {
      parsed: {},
      mappings: { CM: [{ $r: 10, $l: 1 }] },
      paths: { 'CM.0': { $r: 10, $l: 1 } },
    }
    decorate(false, true, editor, monaco, [], [], change, [], [], [], 'CM')
    const applied = deltaDecorations.mock.calls[0][1] as { options: { className?: string } }[]
    expect(applied.some((d) => d.options.className === 'syncEditorYamlHighlight')).toBe(true)
  })

  it('skips highlight when isCustomEdit or changes non-empty', () => {
    const { editor, deltaDecorations } = createEditor()
    const change = {
      parsed: {},
      mappings: { CM: [{ $r: 10, $l: 1 }] },
      paths: { 'CM.0': { $r: 10, $l: 1 } },
    }
    decorate(true, true, editor, monaco, [], [], change, [], [], [], 'CM')
    let applied = deltaDecorations.mock.calls[0][1] as { options: { className?: string } }[]
    expect(applied.some((d) => d.options.className === 'syncEditorYamlHighlight')).toBe(false)

    deltaDecorations.mockClear()
    decorate(false, true, editor, monaco, [], [{ $t: 'C', $a: 'x' }], change, [], [], [], 'CM')
    applied = deltaDecorations.mock.calls[0][1] as { options: { className?: string } }[]
    expect(applied.some((d) => d.options.className === 'syncEditorYamlHighlight')).toBe(false)
  })

  it('reveals first inserted line when not visible and editor lacks focus', () => {
    const containsPosition = jest.fn().mockReturnValue(false)
    const { editor, revealLineInCenter } = createEditor({ containsPosition })
    const change = {
      parsed: {},
      mappings: { k: { $r: 8, $l: 1 } },
    } as unknown as DecorateChangeArg
    decorate(false, false, editor, monaco, [], [{ $t: 'C', $a: 'k', $f: null }], change, [], [], [], '')
    jest.runAllTimers()
    expect(revealLineInCenter).toHaveBeenCalledWith(8)
  })
})
