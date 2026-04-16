/* Copyright Contributors to the Open Cluster Management project */

import { logCreateErrors, logSourceErrors } from './logger'

describe('TemplateEditor logger utils', () => {
  const originalGroup = console.group
  const originalGroupCollapsed = console.groupCollapsed
  const originalGroupEnd = console.groupEnd
  const originalInfo = console.info

  beforeEach(() => {
    console.group = jest.fn()
    console.groupCollapsed = jest.fn()
    console.groupEnd = jest.fn()
    console.info = jest.fn()
  })

  afterEach(() => {
    console.group = originalGroup
    console.groupCollapsed = originalGroupCollapsed
    console.groupEnd = originalGroupEnd
    console.info = originalInfo
  })

  describe('logSourceErrors', () => {
    it('does nothing when logging is disabled', () => {
      logSourceErrors(false, 'a: 1', [], [], { '<<main>>': { exceptions: [{ row: 1, text: 'e' }] } })
      expect(console.group).not.toHaveBeenCalled()
    })

    it('groups and prints YAML diagnostics when logging is enabled', () => {
      const templateExceptionMap = {
        '<<main>>': {
          exceptions: [
            { row: 1, text: 'bad', tabInx: 0, controlId: 'c1' },
            { row: 1, text: 'also', tabInx: 0, controlId: 'c2' },
          ],
        },
      }
      logSourceErrors(true, 'a: 1\nb: 2', [], [], templateExceptionMap)
      expect(console.groupCollapsed).toHaveBeenCalled()
      expect(console.info).toHaveBeenCalled()
      expect(console.groupEnd).toHaveBeenCalled()
    })
  })

  describe('logCreateErrors', () => {
    it('does nothing when logging is disabled', () => {
      logCreateErrors(false, [{ message: 'x' }], { createResources: [] })
      expect(console.group).not.toHaveBeenCalled()
    })

    it('prints creation messages and resource JSON when logging is enabled', () => {
      logCreateErrors(true, [{ message: 'failed' }], {
        createResources: [{ kind: 'Pod', metadata: { name: 'n' } }],
      })
      expect(console.group).toHaveBeenCalled()
      expect(console.info).toHaveBeenCalled()
      expect(console.groupEnd).toHaveBeenCalled()
    })
  })
})
