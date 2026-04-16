/* Copyright Contributors to the Open Cluster Management project */

import {
  cacheUserData,
  cloneControlData,
  ControlMode,
  DecorationType,
  discoverControls,
  escapeYAML,
  generateSource,
  getDecorationData,
  getDecorationRows,
  getInsideObject,
  getResourceID,
  getSourcePath,
  getUniqueName,
  getValue,
  parseYAML,
  removeVs,
  reverseTemplate,
  setEditingMode,
  setImmutableValues,
} from './source-utils'

describe('TemplateEditor source-utils', () => {
  describe('ControlMode / DecorationType', () => {
    it('exposes frozen control mode constants', () => {
      expect(ControlMode.TABLE_ONLY).toBe('TABLE_ONLY')
      expect(ControlMode.PROMPT_ONLY).toBe('PROMPT_ONLY')
      expect(Object.isFrozen(ControlMode)).toBe(true)
    })

    it('exposes frozen decoration type constants', () => {
      expect(DecorationType.IMMUTABLE).toBe('IMMUTABLE')
      expect(DecorationType.DEPRECATED).toBe('DEPRECATED')
    })
  })

  describe('getSourcePath', () => {
    it('maps a single-segment path to .$synced root', () => {
      expect(getSourcePath('Pod')).toBe('Pod.$synced')
    })

    it('maps dotted paths with .$v between segments and bracket indices', () => {
      expect(getSourcePath('Kind.metadata.name')).toBe('Kind.$synced.metadata.$v.name')
      expect(getSourcePath('PlacementRule[0].spec.clusterConditions[0].type')).toBe(
        'PlacementRule[0].$synced.spec.$v.clusterConditions.$v[0].$v.type'
      )
    })
  })

  describe('removeVs / escapeYAML / getValue', () => {
    it('unwraps nested $v markers', () => {
      expect(removeVs({ $v: { a: { $v: 1 } } })).toEqual({ a: 1 })
      expect(removeVs([{ $v: 'x' }, { b: 2 }])).toEqual(['x', { b: 2 }])
    })

    it('returns the input for nullish values', () => {
      expect(removeVs(null)).toBe(null)
      expect(removeVs(undefined)).toBe(undefined)
    })

    it('strips single quotes from strings recursively', () => {
      expect(escapeYAML("it's")).toBe('its')
      expect(escapeYAML({ k: "a'b" })).toEqual({ k: 'ab' })
      expect(escapeYAML(["o'k", 1])).toEqual(['ok', 1])
    })

    it('reads a synced path and strips $v wrappers', () => {
      const templateObject = {
        Kind: {
          $synced: {
            metadata: { $v: { name: { $v: 'hello' } } },
          },
        },
      }
      expect(getValue(templateObject, 'Kind.metadata.name')).toBe('hello')
      expect(getValue(templateObject, 'Kind.missing', 'def')).toBe('def')
    })
  })

  describe('parseYAML', () => {
    it('parses valid single-document YAML into resources and synced structure', () => {
      const yaml = `apiVersion: v1
kind: Pod
metadata:
  name: test-pod
`
      const { parsed, resources, exceptions } = parseYAML(yaml)
      expect(exceptions).toHaveLength(0)
      expect(resources).toHaveLength(1)
      expect(resources[0]).toMatchObject({ kind: 'Pod', metadata: { name: 'test-pod' } })
      const podDocs = (parsed as Record<string, Array<{ $raw: unknown; $synced: unknown }>>).Pod
      expect(podDocs).toBeDefined()
      expect(podDocs[0].$raw).toMatchObject({ kind: 'Pod' })
      expect(podDocs[0].$synced).toBeDefined()
    })

    it('records an exception for invalid YAML', () => {
      const { exceptions, resources } = parseYAML('kind: [')
      expect(resources).toHaveLength(0)
      expect(exceptions.length).toBeGreaterThan(0)
      expect(exceptions[0].type).toBe('error')
      expect(exceptions[0]).toHaveProperty('row')
    })

    it('splits multi-document YAML on document separators', () => {
      const yaml = `kind: ConfigMap
metadata:
  name: a
---
kind: Secret
metadata:
  name: b
`
      const { resources, exceptions } = parseYAML(yaml)
      expect(exceptions).toHaveLength(0)
      expect(resources).toHaveLength(2)
      expect(resources.map((r: { kind: string }) => r.kind)).toEqual(['ConfigMap', 'Secret'])
    })
  })

  describe('getInsideObject', () => {
    it('collects nested keys from each top-level kind bucket', () => {
      const parsed = {
        Pod: [{ $raw: { a: 1 }, $synced: { x: true } }],
        Service: [{ $raw: { a: 2 }, $synced: { x: false } }],
      }
      expect(getInsideObject('$raw', parsed)).toEqual({ Pod: [{ a: 1 }], Service: [{ a: 2 }] })
      expect(getInsideObject('$synced', parsed)).toEqual({ Pod: [{ x: true }], Service: [{ x: false }] })
    })
  })

  describe('getResourceID', () => {
    it('prefers metadata.selfLink when present', () => {
      expect(
        getResourceID({
          kind: 'Pod',
          metadata: { name: 'n', namespace: 'ns', selfLink: '/api/v1/namespaces/ns/pods/n' },
        })
      ).toBe('/api/v1/namespaces/ns/pods/n')
    })

    it('builds a lowercase synthetic path when selfLink is absent', () => {
      expect(getResourceID({ kind: 'Pod', metadata: { name: 'n', namespace: 'ns' } })).toBe(
        '/namespaces/ns/pods/n'
      )
      expect(getResourceID({ kind: 'Pod', metadata: { name: 'n' } })).toBe('/namespaces/none/pods/n')
    })
  })

  describe('getUniqueName', () => {
    it('returns the name unchanged when not taken', () => {
      expect(getUniqueName('my-name', new Set(['other']))).toBe('my-name')
    })

    it('appends a numeric suffix when the base name collides', () => {
      expect(getUniqueName('my-name', new Set(['my-name']))).toBe('my-name-1')
      expect(getUniqueName('my-name', new Set(['my-name', 'my-name-1']))).toBe('my-name-2')
    })
  })

  describe('cloneControlData', () => {
    it('deep-clones controls but preserves the original component reference', () => {
      const Cmp = () => null
      const controlData = [{ id: '1', nested: { a: 1 }, component: Cmp }]
      const cloned = cloneControlData(controlData)
      expect(cloned[0].component).toBe(Cmp)
      expect(cloned[0].nested).not.toBe(controlData[0].nested)
      expect(cloned[0].nested).toEqual({ a: 1 })
    })
  })

  describe('cacheUserData', () => {
    it('writes sessionStorage when cache key and userData are set', () => {
      const setItem = jest.spyOn(Storage.prototype, 'setItem')
      const data = [{ x: 1 }]
      cacheUserData([
        {
          cacheUserValueKey: 'my-key',
          userData: data,
        },
      ])
      expect(setItem).toHaveBeenCalledWith(
        expect.stringMatching(/^my-key--/),
        JSON.stringify(data)
      )
      setItem.mockRestore()
    })

    it('does nothing when userData is empty', () => {
      const setItem = jest.spyOn(Storage.prototype, 'setItem')
      cacheUserData([{ cacheUserValueKey: 'k', userData: [] }])
      expect(setItem).not.toHaveBeenCalled()
      setItem.mockRestore()
    })
  })

  describe('getDecorationData', () => {
    it('collects immutable and deprecated entries from nested groups', () => {
      const controlData = [
        {
          type: 'group',
          active: [
            [
              {
                type: 'text',
                immutable: { path: 'a', value: 1 },
              },
              {
                type: 'text',
                deprecated: { path: 'b', message: 'm' },
              },
            ],
          ],
        },
      ]
      const rows = getDecorationData(controlData, [])
      expect(rows).toEqual([
        { path: 'a', value: 1, decorationType: DecorationType.IMMUTABLE },
        { path: 'b', message: 'm', decorationType: DecorationType.DEPRECATED },
      ])
    })
  })

  describe('setImmutableValues', () => {
    it('applies immutable value paths onto parsed resources grouped by kind', () => {
      const resources = [{ kind: 'Pod', metadata: { name: 'p' } }]
      const decorationData = [
        { decorationType: DecorationType.IMMUTABLE, path: 'Pod[0].metadata.labels.app', value: 'fixed' },
      ]
      setImmutableValues(decorationData, resources)
      expect(
        (resources[0] as unknown as { metadata: { labels: { app: string } } }).metadata.labels.app
      ).toBe('fixed')
    })
  })

  describe('getDecorationRows', () => {
    it('resolves decoration paths to row metadata from template objects', () => {
      const templateObjects = {
        Pod: {
          $synced: {
            metadata: { $v: { name: { $r: 4, $l: 1 } } },
          },
        },
      }
      const rows = getDecorationRows(
        [{ path: 'Pod.metadata.name', decorationType: DecorationType.IMMUTABLE }],
        templateObjects
      )
      expect(rows).toEqual([{ $r: 4, $l: 1, decorationType: DecorationType.IMMUTABLE }])
    })
  })

  describe('reverseTemplate', () => {
    it('invokes reverse callbacks with a cloned template object', () => {
      const reverse = jest.fn()
      const templateObject = { kind: 'Pod' }
      const controlData = [{ type: 'text', reverse, active: '' }]
      reverseTemplate(controlData, templateObject, '<<main>>')
      expect(reverse).toHaveBeenCalledTimes(1)
      const [ctrl, tmpl] = reverse.mock.calls[0]
      expect(ctrl).toBe(controlData[0])
      expect(tmpl).toEqual(templateObject)
      expect(tmpl).not.toBe(templateObject)
    })
  })

  describe('setEditingMode', () => {
    it('applies editing constraints to controls and nested group rows', () => {
      const inner: Record<string, unknown> = {
        type: 'text',
        active: 'v',
        path: 'p',
        hidden: true,
        editing: { hidden: true, disabled: true, collapsed: true, editMode: true },
      }
      const controlData = [
        {
          type: 'group',
          active: [[inner]],
          hidden: false,
        },
      ]
      setEditingMode(controlData)
      expect(inner.hidden).toBe(true)
      expect(inner.disabled).toBe(true)
      expect(inner.collapsed).toBe(true)
      expect(inner.editMode).toBe(true)
      expect(inner.immutable).toEqual({ value: 'v', path: 'p' })
    })

    it('uses hidden control type when editing.hidden is set but the field is visible', () => {
      const inner = { type: 'text', editing: { hidden: true }, hidden: false }
      const controlData = [{ type: 'group', active: [[inner]] }]
      setEditingMode(controlData)
      expect(inner.type).toBe('hidden')
    })
  })

  describe('discoverControls', () => {
    it('runs discover hooks for each control', () => {
      const discover = jest.fn()
      const controlData = [{ type: 'text', discover }]
      const templateObject = { kind: 'Pod' }
      discoverControls(controlData, templateObject, undefined, undefined, jest.fn())
      expect(discover).toHaveBeenCalledTimes(1)
      const tmpl = discover.mock.calls[0][2]
      expect(tmpl).toEqual(templateObject)
      expect(tmpl).not.toBe(templateObject)
    })
  })

  describe('generateSource', () => {
    it('delegates to template generation when edit stack is empty', () => {
      const template = jest.fn().mockReturnValue(`apiVersion: v1
kind: Pod
metadata:
  name: test
`)
      const result = generateSource(template, [], [], [])
      expect(template).toHaveBeenCalled()
      expect(result).toMatchObject({
        templateYAML: expect.any(String),
        templateObject: expect.any(Object),
        templateResources: expect.any(Array),
        decorationRows: expect.any(Array),
      })
    })
  })
})
