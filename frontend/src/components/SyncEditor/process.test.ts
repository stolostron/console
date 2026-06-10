/* Copyright Contributors to the Open Cluster Management project */

import { processForm, processUser, stringify, normalize, type CachedValuesType } from './process'
import { compileAjvSchemas } from './validation'
import type { ChangeType } from './changes'
import type { Monaco } from '@monaco-editor/react'

type ProcessUserOverrides = {
  secrets?: (string | string[])[]
  cachedSecrets?: CachedValuesType[]
  showFilters?: boolean
  filters?: (string | string[])[]
  cacheFiltered?: CachedValuesType[]
  immutables?: (string | string[])[]
  readonly?: boolean
  validators?: unknown
  currentEditorValue?: string
  editableUidSiblings?: boolean
}

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
}

function createMonaco(): Monaco {
  return { Range: MockRange as unknown as Monaco['Range'] } as Monaco
}

const policyYamlWithUid =
  'apiVersion: policy.open-cluster-management.io/v1\n' +
  'kind: Policy\n' +
  'metadata:\n' +
  '  name: foobar\n' +
  '  namespace: default\n' +
  '  uid: 9f7de1f1-b46f-47df-8ef4-0930aecc5902\n' +
  'spec:\n' +
  '  disabled: false\n'

const secretYaml =
  'apiVersion: v1\n' +
  'kind: Secret\n' +
  'metadata:\n' +
  '  name: cred\n' +
  '  namespace: default\n' +
  'stringData:\n' +
  '  password: supersecret\n'

describe('stringify', () => {
  it('sorts name and namespace before other keys and joins documents with ---', () => {
    const yaml = stringify([
      {
        apiVersion: 'v1',
        kind: 'ConfigMap',
        metadata: { name: 'n', namespace: 'ns', labels: { app: 'x' } },
        data: { key: 'value' },
      },
      {
        apiVersion: 'v1',
        kind: 'Secret',
        metadata: { name: 's', namespace: 'ns' },
      },
    ])
    const docs = yaml.split('---\n')
    expect(docs).toHaveLength(2)
    expect(docs[0].indexOf('name:')).toBeLessThan(docs[0].indexOf('labels:'))
    expect(docs[0]).toContain('namespace: ns')
  })

  it('skips empty resources and normalizes null values', () => {
    const yaml = stringify([{}, { apiVersion: 'v1', kind: 'Pod', metadata: { name: 'p' }, spec: { x: null } }])
    expect(yaml).not.toContain('---\n---')
    expect(yaml).toContain('kind: Pod')
    expect(yaml).not.toMatch(/:\s*null$/m)
  })

  it('formats sequence entries as YAML list items', () => {
    const yaml = stringify([
      {
        apiVersion: 'v1',
        kind: 'Pod',
        metadata: { name: 'p' },
        spec: { containers: [{ name: 'c1' }, { name: 'c2' }] },
      },
    ])
    expect(yaml).toMatch(/- name: c1/)
  })
})

describe('normalize', () => {
  it('removes managedFields from diff resources', () => {
    const original = [
      {
        metadata: {
          name: 'x',
          managedFields: [{ manager: 'kubectl' }],
        },
      },
    ]
    const current = [{ metadata: { name: 'x' } }]
    const { original: o, current: c } = normalize(original, current)
    expect(o[0].metadata.managedFields).toBeUndefined()
    expect(c[0].metadata.managedFields).toBeUndefined()
  })

  it('copies matching empty comparison placeholders from current onto original', () => {
    const original = [{ spec: { disabled: false } }]
    const current = [{ spec: { disabled: false } }]
    const { original: o } = normalize(original, current)
    expect(o[0].spec).toEqual({ disabled: false })
  })

  it('handles null and non-object resources safely', () => {
    const { original: o, current: c } = normalize([null as unknown as object], [undefined as unknown as object])
    expect(o[0]).toBeNull()
    expect(c[0]).toBeUndefined()
  })
})

describe('processUser', () => {
  const monaco = createMonaco()

  const processUserDefaults = (yaml: string, overrides: ProcessUserOverrides = {}) => {
    const {
      secrets = [],
      cachedSecrets = [],
      showFilters = false,
      filters = [],
      cacheFiltered = [],
      immutables = [],
      readonly = false,
      validators,
      currentEditorValue = yaml,
      editableUidSiblings,
    } = overrides
    return processUser(
      monaco,
      yaml,
      secrets,
      cachedSecrets,
      showFilters,
      filters,
      cacheFiltered,
      immutables,
      readonly,
      validators,
      currentEditorValue,
      editableUidSiblings
    )
  }

  it('should not have protected ranges when uid siblings are editable', () => {
    const { protectedRanges } = processUserDefaults(policyYamlWithUid, { editableUidSiblings: true })
    expect(protectedRanges).toEqual([])
  })

  it('should have protected ranges when uid siblings are not editable', () => {
    const { protectedRanges } = processUserDefaults(policyYamlWithUid, { editableUidSiblings: false })
    expect(protectedRanges).toHaveLength(3)
  })

  it('records hiddenSecretsValues when secrets paths match', () => {
    const { unredactedChange } = processUserDefaults(secretYaml, {
      secrets: ['*.stringData.password'],
    })
    expect(unredactedChange.hiddenSecretsValues).toEqual(
      expect.arrayContaining([expect.objectContaining({ value: 'supersecret' })])
    )
  })

  it('adds protected ranges for immutables', () => {
    const { protectedRanges } = processUserDefaults(policyYamlWithUid, {
      immutables: ['*.metadata.name'],
      editableUidSiblings: true,
    })
    expect(protectedRanges.length).toBeGreaterThan(0)
    expect(protectedRanges[0].startLineNumber).toBeGreaterThan(0)
  })

  it('restores cached secret values into parsed state before redacting', () => {
    const redacted = processUserDefaults(
      'apiVersion: v1\nkind: Secret\nmetadata:\n  name: c\nstringData:\n  password: "***"\n',
      {
        secrets: ['Secret.0.stringData.password'],
        cachedSecrets: [{ path: 'Secret.0.stringData.password', value: 'restored' }],
      }
    )
    expect(redacted.unredactedChange.hiddenSecretsValues?.[0]?.value).toBe('restored')
  })

  it('records hiddenFilteredValues and filtered rows when filters are hidden', () => {
    const withFields =
      'apiVersion: v1\n' +
      'kind: ConfigMap\n' +
      'metadata:\n' +
      '  name: cm\n' +
      '  managedFields:\n' +
      '    - manager: kubectl\n'
    const { filteredRows, unredactedChange } = processUserDefaults(withFields, {
      filters: ['*.metadata.managedFields'],
      showFilters: false,
    })
    expect(filteredRows.length).toBeGreaterThan(0)
    expect(unredactedChange.hiddenFilteredValues?.length).toBeGreaterThan(0)
  })

  it('keeps filtered paths visible when showFilters is true', () => {
    const withFields =
      'apiVersion: v1\n' +
      'kind: ConfigMap\n' +
      'metadata:\n' +
      '  name: cm\n' +
      '  managedFields:\n' +
      '    - manager: kubectl\n'
    const { yaml } = processUserDefaults(withFields, {
      filters: ['*.metadata.managedFields'],
      showFilters: true,
    })
    expect(yaml).toContain('managedFields')
  })

  it('returns empty protectedRanges when readonly', () => {
    const { protectedRanges } = processUserDefaults(policyYamlWithUid, {
      readonly: true,
      editableUidSiblings: false,
    })
    expect(protectedRanges).toEqual([])
  })

  it('uses currentEditorValue for yaml when editor has focus', () => {
    const customYaml = '# editor draft\n' + policyYamlWithUid
    const { yaml } = processUserDefaults(policyYamlWithUid, { currentEditorValue: customYaml })
    expect(yaml).toBe(customYaml)
  })

  it('restores cached secrets and filters when syntax or validation errors exist', () => {
    const invalidYaml = 'apiVersion: v1\nkind: Policy\nmetadata\n  name: broken'
    const cachedSecrets: CachedValuesType[] = [{ path: 'Secret.0.stringData.password', value: 'cached' }]
    const cacheFiltered: CachedValuesType[] = [{ path: 'ConfigMap.0.metadata.managedFields', value: '[]' }]
    const { unredactedChange, errors } = processUserDefaults(invalidYaml, {
      cachedSecrets,
      cacheFiltered,
    })
    expect(errors.syntax.length).toBeGreaterThan(0)
    expect(unredactedChange.hiddenSecretsValues).toBe(cachedSecrets)
    expect(unredactedChange.hiddenFilteredValues).toBe(cacheFiltered)
  })

  it('runs validation when validators are provided and yaml is valid', () => {
    const validators = compileAjvSchemas({
      type: 'object',
      properties: {
        kind: { const: 'Policy' },
        metadata: {
          type: 'object',
          properties: { name: { type: 'string' }, namespace: { type: 'string' } },
          required: ['name', 'namespace'],
        },
      },
      required: ['kind', 'metadata'],
    })
    const { errors } = processUserDefaults(policyYamlWithUid, { validators })
    expect(errors.syntax).toHaveLength(0)
    expect(errors.validation).toHaveLength(0)
  })

  it('returns comparison clone of parsed resources', () => {
    const { comparison, change } = processUserDefaults(policyYamlWithUid)
    expect(comparison).not.toBe(change.parsed)
    expect(comparison.Policy[0].metadata.name).toBe('foobar')
  })
})

describe('processForm', () => {
  const monaco = createMonaco()

  it('builds yaml from a single resource object', () => {
    const resource = {
      apiVersion: 'v1',
      kind: 'ConfigMap',
      metadata: { name: 'test', namespace: 'default' },
    }
    const result = processForm(
      monaco,
      undefined,
      resource,
      undefined,
      undefined,
      false,
      undefined,
      undefined,
      false,
      [],
      undefined,
      '',
      undefined
    )
    expect(result.yaml).toContain('kind: ConfigMap')
    expect(result.change.resources).toHaveLength(1)
    expect(result.comparison.ConfigMap[0].metadata.name).toBe('test')
  })

  it('builds yaml from resource array and includes cross references', () => {
    const resources = [
      { apiVersion: 'v1', kind: 'Pod', metadata: { name: 'p', namespace: 'ns' } },
      { apiVersion: 'v1', kind: 'Service', metadata: { name: 's', namespace: 'ns' } },
    ]
    const result = processForm(
      monaco,
      'ignored',
      resources,
      undefined,
      undefined,
      false,
      undefined,
      undefined,
      false,
      [],
      undefined,
      '',
      undefined
    )
    expect(result.yaml).toContain('kind: Pod')
    expect(result.yaml).toContain('kind: Service')
    expect(result.xreferences).toBeDefined()
  })

  it('reconciles user edits when changeStack and userEdits are provided', () => {
    const base = {
      apiVersion: 'v1',
      kind: 'ConfigMap',
      metadata: { name: 'cm', namespace: 'default' },
      data: { key: 'original' },
    }
    const changeStack = {
      baseResources: [cloneResource(base)],
      customResources: [cloneResource({ ...base, data: { key: 'user-edit' } })],
    }
    const userEdits: ChangeType[] = [
      {
        $t: 'E',
        $a: 'ConfigMap.0.data.key',
        $p: ['ConfigMap', '0', 'data', 'key'],
        $u: 'user-edit',
      },
    ]
    const result = processForm(
      monaco,
      undefined,
      [base],
      changeStack,
      undefined,
      false,
      undefined,
      undefined,
      false,
      userEdits,
      undefined,
      stringify([base]),
      undefined
    )
    expect(result.yaml).toContain('user-edit')
    expect(result.change.resources[0].data.key).toBe('user-edit')
  })

  it('records hidden secrets via processForm when editor does not have focus', () => {
    const resource = {
      apiVersion: 'v1',
      kind: 'Secret',
      metadata: { name: 'c', namespace: 'default' },
      stringData: { password: 'hush' },
    }
    const result = processForm(
      monaco,
      undefined,
      [resource],
      undefined,
      ['*.stringData.password'],
      false,
      undefined,
      undefined,
      false,
      [],
      undefined,
      stringify([resource]),
      undefined
    )
    expect(result.unredactedChange.hiddenSecretsValues).toEqual(
      expect.arrayContaining([expect.objectContaining({ value: 'hush' })])
    )
  })
})

function cloneResource<T>(resource: T): T {
  return JSON.parse(JSON.stringify(resource)) as T
}
