/* Copyright Contributors to the Open Cluster Management project */

import {
  STATUS_FAILURE_CLASS,
  STATUS_FAILURE_EMPHASIS_CLASS,
  STATUS_SUCCESS_CLASS,
  STATUS_SUCCESS_EMPHASIS_CLASS,
} from '~/components/SyncEditor/statusDecorations'
import { getSearchYamlStatusDecorations, registerSearchYamlStatusDecorations } from './statusYamlDecorations'

jest.mock('monaco-editor', () => ({
  Range: class Range {
    constructor(
      public startLineNumber: number,
      public startColumn: number,
      public endLineNumber: number,
      public endColumn: number
    ) {}
  },
}))

function createModel(yamlText: string) {
  return {
    getValue: () => yamlText,
    getPositionAt: (offset: number) => {
      const before = yamlText.slice(0, Math.max(0, offset))
      const lines = before.split('\n')
      return { lineNumber: lines.length, column: (lines.at(-1)?.length ?? 0) + 1 }
    },
  }
}

describe('getSearchYamlStatusDecorations', () => {
  it('returns empty decorations when yaml cannot be parsed', () => {
    const model = createModel('status: [\n  - broken')
    expect(getSearchYamlStatusDecorations(model as never)).toEqual([])
  })

  it('returns empty decorations when status is missing', () => {
    const model = createModel('apiVersion: v1\nkind: Pod\nmetadata:\n  name: x\n')
    expect(getSearchYamlStatusDecorations(model as never)).toEqual([])
  })

  it('decorates successful and failed conditions plus unavailableReplicas', () => {
    const yamlText = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: demo
status:
  unavailableReplicas: 2
  conditions:
    - type: Available
      status: 'True'
      reason: MinimumReplicasAvailable
      message: Deployment has minimum availability.
    - type: Degraded
      status: 'True'
      reason: ReplicaFailure
      message: Something failed
    - type: Ready
      status: Unknown
      reason: Pending
      message: Not yet known
`
    const decorations = getSearchYamlStatusDecorations(createModel(yamlText) as never)
    const classes = decorations.map((d) => d.options.inlineClassName)
    expect(classes).toContain(STATUS_SUCCESS_CLASS)
    expect(classes).toContain(STATUS_SUCCESS_EMPHASIS_CLASS)
    expect(classes).toContain(STATUS_FAILURE_CLASS)
    expect(classes).toContain(STATUS_FAILURE_EMPHASIS_CLASS)
    expect(classes.filter((c) => c === STATUS_FAILURE_CLASS).length).toBeGreaterThanOrEqual(2)
  })

  it('skips unavailableReplicas when zero', () => {
    const yamlText = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: demo
status:
  unavailableReplicas: 0
  conditions:
    - type: Available
      status: 'True'
      reason: MinimumReplicasAvailable
      message: ok
`
    const decorations = getSearchYamlStatusDecorations(createModel(yamlText) as never)
    const classes = decorations.map((d) => d.options.inlineClassName)
    expect(classes).toContain(STATUS_SUCCESS_CLASS)
    // only condition block + reason/message emphasis (no unavailable failure)
    expect(classes.filter((c) => c === STATUS_FAILURE_CLASS)).toEqual([])
  })

  it('decorates lastState terminated Error and OOMKilled', () => {
    const yamlText = `apiVersion: v1
kind: Pod
metadata:
  name: demo
status:
  containerStatuses:
    - name: app
      lastState:
        terminated:
          reason: Error
          exitCode: 1
    - name: sidec
      lastState:
        terminated:
          reason: OOMKilled
          exitCode: 137
    - name: done
      lastState:
        terminated:
          reason: Completed
          exitCode: 0
`
    const decorations = getSearchYamlStatusDecorations(createModel(yamlText) as never)
    const failureCount = decorations.filter((d) => d.options.inlineClassName === STATUS_FAILURE_CLASS).length
    expect(failureCount).toBe(2)
  })
})

describe('registerSearchYamlStatusDecorations', () => {
  it('applies decorations, refreshes on content change, and disposes cleanly', () => {
    const yamlText = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: demo
status:
  conditions:
    - type: Available
      status: 'False'
      reason: MinimumReplicasUnavailable
      message: not available
`
    const model = createModel(yamlText)
    const contentListeners: Array<() => void> = []
    const disposeListener = jest.fn()
    const deltaDecorations = jest.fn((_old: string[], next: unknown[]) => next.map((_, i) => `dec-${i}`))
    const editor = {
      getModel: jest.fn(() => model),
      deltaDecorations,
      onDidChangeModelContent: jest.fn((cb: () => void) => {
        contentListeners.push(cb)
        return { dispose: disposeListener }
      }),
    }

    const dispose = registerSearchYamlStatusDecorations(editor as never)
    expect(deltaDecorations).toHaveBeenCalled()
    expect(editor.onDidChangeModelContent).toHaveBeenCalled()
    expect(contentListeners).toHaveLength(1)

    deltaDecorations.mockClear()
    contentListeners[0]()
    expect(deltaDecorations).toHaveBeenCalled()

    dispose()
    expect(disposeListener).toHaveBeenCalled()
    expect(deltaDecorations).toHaveBeenCalledWith(expect.any(Array), [])
  })

  it('skips refresh when editor has no model', () => {
    const deltaDecorations = jest.fn()
    const editor = {
      getModel: jest.fn(() => null),
      deltaDecorations,
      onDidChangeModelContent: jest.fn(() => ({ dispose: jest.fn() })),
    }
    registerSearchYamlStatusDecorations(editor as never)
    expect(deltaDecorations).not.toHaveBeenCalled()
  })
})
