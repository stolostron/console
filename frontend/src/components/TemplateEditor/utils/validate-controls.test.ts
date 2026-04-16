/* Copyright Contributors to the Open Cluster Management project */

import { validateControls, validateMultiTextControl } from './validate-controls'

const i18n = (key: string, args?: string[]) => (args && args.length ? `${key}:${args.join(',')}` : key)

function createMockEditor() {
  return {
    monaco: {
      Range: jest.fn((startLineNumber: number, startColumn: number, endLineNumber: number, endColumn: number) => ({
        startLineNumber,
        startColumn,
        endLineNumber,
        endColumn,
      })),
    },
    deltaDecorations: jest.fn(() => []),
    decorations: [] as unknown[],
    errorList: undefined as unknown,
    changeList: undefined as unknown,
    decorationList: undefined as unknown,
  }
}

describe('validate-controls', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('returns hasSyntaxExceptions when main YAML is invalid', () => {
    const editors = [createMockEditor()]
    const result = validateControls(editors, 'kind: [', [], '<<main>>', undefined, [], false, i18n)
    expect(result.hasSyntaxExceptions).toBe(true)
    expect(result.hasValidationExceptions).toBe(true)
    jest.runAllTimers()
    expect(editors[0].deltaDecorations).toHaveBeenCalled()
  })

  it('parses valid YAML and returns template maps without syntax errors', () => {
    const yaml = `apiVersion: v1
kind: Pod
metadata:
  name: p
`
    const editors = [createMockEditor()]
    const result = validateControls(editors, yaml, [], '<<main>>', undefined, [], false, i18n)
    expect(result.hasSyntaxExceptions).toBe(false)
    expect(result.parsedResources.length).toBeGreaterThan(0)
    expect(result.templateObjectMap['<<main>>']).toBeDefined()
    jest.runAllTimers()
  })
})

describe('validateMultiTextControl', () => {
  it('aggregates multitext cell exceptions onto the parent control', () => {
    const controlData: unknown[] = []
    const templateObjectMap = { '<<main>>': {} }
    const templateExceptionMap = {
      '<<main>>': { exceptions: [] as unknown[], controlValidation: undefined },
    }
    const multitextA: Record<string, unknown> = {
      id: 'a',
      active: 'bad',
    }
    const multitextB: Record<string, unknown> = {
      id: 'b',
      active: 'good',
    }
    const control: Record<string, unknown> = {
      type: 'multitext',
      id: 'mt',
      name: 'MultiField',
      template: '',
      controlData: [multitextA, multitextB],
      validation: { tester: /^good$/, notification: 'must be good' },
    }
    validateMultiTextControl(control, controlData, templateObjectMap, templateExceptionMap, true, i18n)
    expect(multitextB.exception).toBe('')
    expect(control.exception).toBe('must be good')
  })
})
