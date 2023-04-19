/* Copyright Contributors to the Open Cluster Management project */

import { SyncEditor, SyncEditorProps } from './SyncEditor'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import get from 'lodash/get'
import set from 'lodash/set'
import cloneDeep from 'lodash/cloneDeep'
//import util from 'util'

const mockOneditorchangeCreate = jest.fn()
const mockOneditorchangeEdit = jest.fn()
type Decorators =
  | {
      range: { endLineNumber: number; endColumn: number; startLineNumber: number; startColumn: number }
      options: { inlineClassName: string; description: string; after?: undefined }
    }
  | {
      range: { endLineNumber: number; endColumn: number; startLineNumber: number; startColumn: number }
      options: {
        after?: { content: string; inlineClassName: string }
        description: string
        inlineClassName?: string
      }
    }[]

describe('SyncEditor component', () => {
  afterAll(() => {
    jest.resetAllMocks()
  })

  it('validation', async () => {
    const clone = cloneDeep(propsNewResource)

    // case 'required':
    // case 'const':
    // case 'pattern':
    // case 'validateName':
    // case 'validateDep':
    // case 'validateLabel':
    // case 'enum':
    // case 'type':

    clone.resources = [
      {
        apiVersion: 'policy.open-cluster-management.io/v1',
        kind: 'Policy',
        metadata: {
          nam: '-test', //required-- must have 'name' not 'nam'
          namespace: '-default', // validateName --must not start with -
          constTest: 'Testee', // const test -- must be Test
          enumTest: 'xst', // enum test -- must be ['ost', 'vmw']
          typeTest: 3, //type test--must be string
          validateLabelTest: '1234567890123456789012345678901234567890123456789012345678901234567890', //validateLabel--must be less then 63 chars
          kind: 'IamPolicy', // 'validateDep' --IamPolicy cannot have namespace
          patternTest: 'abcd', // must match pattern
          immutableTest: 1234, // sematxci errors ignored on immutable lines
        },
      },
    ]
    clone.schema = {
      type: 'object',
      properties: {
        apiVersion: {
          type: 'string',
        },
        kind: {
          const: 'Policy',
        },
        metadata: {
          type: 'object',
          properties: {
            name: {
              validateName: true,
            },
            namespace: {
              validateName: true,
            },
            constTest: {
              const: 'Test',
            },
            enumTest: {
              enum: ['ost', 'vmw'],
            },
            typeTest: {
              type: 'string',
            },
            validateLabelTest: {
              validateLabel: true,
            },
            validateDepTest: {
              validateDep: true,
            },
            patternTest: {
              pattern: '[%d] [%p] [application-ui] [%c] %m',
            },
          },
          validateDep: true,
          required: ['name', 'namespace'],
        },
      },
      required: ['apiVersion', 'metadata', 'kind'],
    }
    clone.immutables = ['*.metadata.immutableTest']
    render(<SyncEditor {...clone} />)

    // make sure yaml matches
    const input = screen.getByRole('textbox', {
      name: /monaco/i,
    }) as HTMLTextAreaElement
    await waitFor(() => expect(input).not.toHaveValue(''))

    // >>>SEMANTIC ERRORS
    let decorators = JSON.parse(input.dataset['decorators'] || '')
    //console.log(util.inspect(decorators, { depth: null }))
    expect(decorators).toEqual(semanticErrors)

    // >>>SYNTAX ERROR--type 'abc' over colon in 'kind:'
    const text = 'kind:'
    const i = input.value.indexOf(text) + text.length - 1
    input.setSelectionRange(i, i + 1)
    userEvent.type(input, 'abc')
    await new Promise((resolve) => setTimeout(resolve, 500)) // wait for debounce
    decorators = JSON.parse(input.dataset['decorators'] || '')
    //console.log(util.inspect(decorators, { depth: null }))
    expect(decorators).toEqual(syntaxError)
  })

  it('render new resource', async () => {
    const clone = cloneDeep(propsNewResource)
    render(<SyncEditor {...clone} />)

    // make sure yaml matches
    const input = screen.getByRole('textbox', {
      name: /monaco/i,
    }) as HTMLTextAreaElement
    await waitFor(() => expect(input).not.toHaveValue(''))
    expect(input).toHaveMultilineValue(newResourceYaml)

    // make sure decorators match
    // console.log(util.inspect(decorators, { depth: null }))
    const decorators = JSON.parse(input.dataset['decorators'] || '')
    expect(decorators).toEqual(newResourceDecorators)
  })

  // filtered manageFilters
  // immutable uid siblings
  it('render existing resource', async () => {
    render(<SyncEditor {...propsExistingResource} />)

    // make sure yaml matches
    const input = screen.getByRole('textbox', {
      name: /monaco/i,
    }) as HTMLTextAreaElement
    await waitFor(() => expect(input).not.toHaveValue(''))
    expect(input).toHaveMultilineValue(existingResourceYaml)

    // make sure decorators match
    // console.log(util.inspect(decorators, { depth: null }))
    const decorators = JSON.parse(input.dataset['decorators'] || '')
    expect(decorators).toEqual(existingResourceDecorators)
  })

  it('yaml/form edit syncing', async () => {
    const onEditorChange = jest.fn()
    const clone = cloneDeep(propsNewResource)
    clone.onEditorChange = onEditorChange
    const { rerender } = render(<SyncEditor {...clone} />)

    // make sure yaml matches
    const input = screen.getByRole('textbox', {
      name: /monaco/i,
    }) as HTMLTextAreaElement
    await waitFor(() => expect(input).not.toHaveValue(''))
    expect(input).toHaveMultilineValue(newResourceYaml)

    // >>>USER EDIT: change 'disabled: true' to 'false'
    // ensure resource has disabled==false
    let text = 'disabled: true'
    let i = input.value.indexOf(text) + text.length - 4
    input.setSelectionRange(i, i + 4)
    userEvent.type(input, 'false')
    await new Promise((resolve) => setTimeout(resolve, 500)) // wait for debounce
    expect(clone.onEditorChange).toHaveBeenCalledTimes(1)
    expect(get(onEditorChange.mock.calls, '0.0.resources.0.spec.disabled')).toBeFalsy()

    // >>>FORM: change annotations to { test: 'me' }
    input.blur()
    set(clone, 'resources.0.metadata.annotations', { test: 'me' })
    rerender(<SyncEditor {...clone} />)
    await new Promise((resolve) => setTimeout(resolve, 500)) // wait for debounce

    // >>>USER: change local-cluster to newthing
    text = 'local-cluster'
    i = input.value.indexOf(text)
    input.setSelectionRange(i, i + text.length)
    userEvent.type(input, 'newthing')
    await new Promise((resolve) => setTimeout(resolve, 500)) // wait for debounce

    // make sure first user edit is still there
    // make sure form change is still there
    // make sure last user edit is still good
    // make sure decorators show what's protected
    expect(get(onEditorChange.mock.calls, '1.0.resources.0.spec.disabled')).toBeFalsy()
    expect(get(onEditorChange.mock.calls, '1.0.resources.0.metadata.annotations.test')).toBe('me')
    expect(get(onEditorChange.mock.calls, '1.0.resources.1.spec.clusterSelector.matchExpressions.0.values.0')).toBe(
      'newthing'
    )
    const decorators = JSON.parse(input.dataset['decorators'] || '')
    expect(decorators).toEqual(protectedDecorators)
  })

  it('editor toolbar', async () => {
    const onEditorChange = jest.fn()
    const clone = cloneDeep(propsNewResource)
    clone.onEditorChange = onEditorChange
    render(<SyncEditor {...clone} />)

    // make sure yaml matches
    const input = screen.getByRole('textbox', {
      name: /monaco/i,
    }) as HTMLTextAreaElement
    await waitFor(() => expect(input).not.toHaveValue(''))
    expect(input).toHaveMultilineValue(newResourceYaml)

    // >>>EDIT CHANGE: 'disabled: true' to 'false'
    // ensure resource has disabled==false
    const text = 'disabled: true'
    const i = input.value.indexOf(text) + text.length - 4
    input.setSelectionRange(i, i + 4)
    userEvent.type(input, 'false')
    await new Promise((resolve) => setTimeout(resolve, 500)) // wait for debounce
    expect(clone.onEditorChange).toHaveBeenCalledTimes(1)
    expect(get(onEditorChange.mock.calls, '0.0.resources.spec.disabled')).toBeFalsy()

    // >>>UNDO--make sure 'disabled: true' is true again
    userEvent.click(
      screen.getByRole('button', {
        name: /undo/i,
      })
    )
    await new Promise((resolve) => setTimeout(resolve, 500)) // wait for debounce
    expect(clone.onEditorChange).toHaveBeenCalledTimes(1)

    // // >>>REDO--make sure 'disabled: true' is false again
    userEvent.click(
      screen.getByRole('button', {
        name: /redo/i,
      })
    )
    await new Promise((resolve) => setTimeout(resolve, 500)) // wait for debounce
    expect(clone.onEditorChange).toHaveBeenCalledTimes(1)

    // >>>SHOW SECRETS
    // expect secrets to be redacted in yaml
    expect(input.value.indexOf('*****') !== -1).toBeTruthy()
    userEvent.click(
      screen.getByRole('button', {
        name: /show secrets/i,
      })
    )
    await new Promise((resolve) => setTimeout(resolve, 1200)) // wait for debounce
    // expect secrets to be shown in yaml
    expect(input.value.indexOf('*****') === -1).toBeTruthy()

    // >>> COPY YAML
    Object.assign(window.navigator, {
      clipboard: {
        writeText: jest.fn().mockImplementation(() => Promise.resolve()),
      },
    })
    userEvent.click(
      screen.getByRole('button', {
        name: /copy to clipboard/i,
      })
    )
    expect(window.navigator.clipboard.writeText).toHaveBeenCalledWith(input.value)
  })

  it('synchronize', async () => {
    const clone = cloneDeep(propsNewResource)
    const onEditorChange = jest.fn()
    clone.onEditorChange = onEditorChange
    const setAwsS3Region = jest.fn()
    const setAwsAccessKeyID = jest.fn()
    const setInstallTimeout = jest.fn()
    function getValue(path: string, template: any) {
      return get(template, path, '') as string
    }
    clone.syncs = [
      { path: 'Policy[0].spec.policy-templates[0].objectDefinition.spec.severity', setState: setAwsS3Region },
      {
        getter: getValue.bind(null, 'Policy[0].spec.policy-templates[0].objectDefinition.spec.severity'),
        setState: setAwsAccessKeyID,
      },
      {
        path: `ClusterCurator[0].spec.install.jobMonitorTimeout}`,
        setter: ((value: any) => {
          const errors: any[] = []
          const path = `ClusterCurator[0].spec.prehook`
          errors.push({ path, message: 'Must be Job or Workflow' })
          setInstallTimeout(value)
          return errors
        }).bind(null),
      },
    ]
    render(<SyncEditor {...clone} />)

    // make sure yaml matches
    const input = screen.getByRole('textbox', {
      name: /monaco/i,
    }) as HTMLTextAreaElement
    await waitFor(() => expect(input).not.toHaveValue(''))
    expect(input).toHaveMultilineValue(newResourceYaml)

    // make any change in editor
    const text = 'disabled: true'
    const i = input.value.indexOf(text) + text.length - 4
    input.setSelectionRange(i, i + 4)
    userEvent.type(input, 'false')
    await new Promise((resolve) => setTimeout(resolve, 500)) // wait for debounce
    expect(clone.onEditorChange).toHaveBeenCalledTimes(1)
    expect(get(onEditorChange.mock.calls, '0.0.resources.spec.disabled')).toBeFalsy()

    // make sure syncs get called
    await new Promise((resolve) => setTimeout(resolve, 500)) // wait for debounce
    expect(clone.onEditorChange).toHaveBeenCalledTimes(1)
    expect(setAwsS3Region).toHaveBeenCalledWith('medium')
    expect(setAwsAccessKeyID).toHaveBeenCalledWith('medium')
  })

  it.skip('keyboard', async () => {
    render(<SyncEditor {...propsExistingResource} />)

    // make sure yaml matches
    const input = screen.getByRole('textbox', {
      name: /monaco/i,
    }) as HTMLTextAreaElement
    await waitFor(() => expect(input).not.toHaveValue(''))
    expect(input).toHaveMultilineValue(existingResourceYaml)

    // try typing on immutable
    const text = 'name: test'
    const i = input.value.indexOf(text)
    input.setSelectionRange(i, i)
    fireEvent.keyDown(input, { key: 'A', code: 'KeyA' })
    // userEvent.type(input, 'newthing')
  })
})

const propsNewResource: SyncEditorProps = {
  editorTitle: 'Policy YAML',
  variant: 'toolbar',
  resources: [
    {
      apiVersion: 'policy.open-cluster-management.io/v1',
      kind: 'Policy',
      metadata: {
        name: 'test',
        namespace: 'default',
        annotations: {
          'policy.open-cluster-management.io/categories': 'AC Access Control',
          'policy.open-cluster-management.io/standards': 'NIST SP 800-53',
          'policy.open-cluster-management.io/controls': 'AC-3 Access Enforcement',
        },
      },
      spec: {
        disabled: true,
        'policy-templates': [
          {
            objectDefinition: {
              apiVersion: 'policy.open-cluster-management.io/v1',
              kind: 'IamPolicy',
              metadata: {
                name: 'policy-limitclusteradmin',
              },
              spec: {
                severity: 'medium',
                remediationAction: 'inform',
                maxClusterRoleBindingUsers: 5,
              },
            },
          },
        ],
      },
    },
    {
      apiVersion: 'apps.open-cluster-management.io/v1',
      kind: 'PlacementRule',
      metadata: {
        name: 'test-placement',
        namespace: 'default',
      },
      spec: {
        clusterSelector: {
          matchExpressions: [
            {
              key: 'name',
              operator: 'In',
              values: ['local-cluster'],
            },
          ],
        },
        clusterConditions: [],
      },
    },
    {
      apiVersion: 'policy.open-cluster-management.io/v1',
      kind: 'PlacementBinding',
      metadata: {
        name: 'test-placement',
        namespace: 'default',
      },
      placementRef: {
        apiGroup: 'apps.open-cluster-management.io',
        kind: 'PlacementRule',
        name: 'test-placement',
      },
      subjects: [
        {
          apiGroup: 'policy.open-cluster-management.io',
          kind: 'Policy',
          name: 'test',
        },
      ],
    },
  ],
  schema: [
    {
      type: 'Policy',
      required: 1,
      schema: {
        type: 'object',
        properties: {
          apiVersion: {
            type: 'string',
          },
          kind: {
            const: 'Policy',
          },
          metadata: {
            type: 'object',
            properties: {
              name: {
                validateName: true,
              },
              namespace: {
                validateName: true,
              },
            },
            required: ['name', 'namespace'],
          },
          spec: {
            type: 'object',
            properties: {
              disabled: {
                type: 'boolean',
              },
              remediationAction: {
                enum: ['inform', 'enforce'],
              },
              dependencies: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    compliance: {
                      enum: ['Compliant', 'NonCompliant', 'Pending'],
                    },
                  },
                  validateDep: true,
                },
              },
              'policy-templates': {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    extraDependencies: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          compliance: {
                            enum: ['Compliant', 'NonCompliant', 'Pending'],
                          },
                        },
                        validateDep: true,
                      },
                    },
                  },
                },
              },
            },
            required: ['disabled'],
          },
        },
        required: ['apiVersion', 'metadata', 'kind', 'spec'],
      },
    },
    {
      type: 'Placement',
      schema: {
        type: 'object',
        properties: {
          apiVersion: {
            type: 'string',
          },
          kind: {
            type: 'string',
            const: 'Placement',
          },
          metadata: {
            type: 'object',
            properties: {
              name: {
                validateName: true,
              },
              namespace: {
                validateName: true,
              },
            },
            required: ['name', 'namespace'],
          },
          spec: {
            type: 'object',
            properties: {
              clusterSets: {
                type: 'array',
              },
              numberOfClusters: {
                type: 'number',
              },
              predicates: {
                type: 'array',
              },
            },
          },
        },
        required: ['apiVersion', 'kind', 'metadata', 'spec'],
      },
    },
    {
      type: 'PlacementRule',
      schema: {
        type: 'object',
        properties: {
          apiVersion: {
            type: 'string',
          },
          kind: {
            type: 'string',
            const: 'PlacementRule',
          },
          metadata: {
            type: 'object',
            properties: {
              name: {
                validateName: true,
              },
              namespace: {
                validateName: true,
              },
            },
            required: ['name', 'namespace'],
          },
          spec: {
            type: 'object',
            properties: {
              clusterSelector: {
                type: 'object',
                properties: {
                  matchExpressions: {
                    type: 'array',
                  },
                },
                required: ['matchExpressions'],
              },
            },
            required: ['clusterSelector'],
          },
        },
        required: ['apiVersion', 'kind', 'metadata', 'spec'],
      },
    },
    {
      type: 'PlacementBinding',
      schema: {
        type: 'object',
        properties: {
          apiVersion: {
            type: 'string',
          },
          kind: {
            type: 'string',
            const: 'PlacementBinding',
          },
          metadata: {
            type: 'object',
            properties: {
              name: {
                validateName: true,
              },
              namespace: {
                validateName: true,
              },
            },
            required: ['name', 'namespace'],
          },
          placementRef: {
            type: 'object',
            properties: {
              name: {
                validateName: true,
              },
              apiGroup: {
                type: 'string',
              },
              kind: {
                type: 'string',
                enum: ['Placement', 'PlacementRule'],
              },
            },
            required: ['name', 'apiGroup', 'kind'],
          },
          subjects: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                apiGroup: {
                  type: 'string',
                },
                kind: {
                  const: 'Policy',
                },
                name: {
                  validateName: true,
                },
              },
              required: ['apiGroup', 'kind', 'name'],
            },
          },
        },
        required: ['apiVersion', 'kind', 'metadata', 'placementRef', 'subjects'],
      },
    },
  ],
  immutables: ['*.placementRef.apiGroup'],
  secrets: ['PlacementRule.0.metadata.name', 'PlacementBinding.0.metadata.namespace'],
  onEditorChange: mockOneditorchangeCreate,
}
const newResourceYaml =
  'apiVersion: policy.open-cluster-management.io/v1\n' +
  'kind: Policy\n' +
  'metadata:\n' +
  '  name: test\n' +
  '  namespace: default\n' +
  '  annotations:\n' +
  '    policy.open-cluster-management.io/categories: AC Access Control\n' +
  '    policy.open-cluster-management.io/standards: NIST SP 800-53\n' +
  '    policy.open-cluster-management.io/controls: AC-3 Access Enforcement\n' +
  'spec:\n' +
  '  disabled: true\n' +
  '  policy-templates:\n' +
  '    - objectDefinition:\n' +
  '        apiVersion: policy.open-cluster-management.io/v1\n' +
  '        kind: IamPolicy\n' +
  '        metadata:\n' +
  '          name: policy-limitclusteradmin\n' +
  '        spec:\n' +
  '          severity: medium\n' +
  '          remediationAction: inform\n' +
  '          maxClusterRoleBindingUsers: 5\n' +
  '---\n' +
  'apiVersion: apps.open-cluster-management.io/v1\n' +
  'kind: PlacementRule\n' +
  'metadata:\n' +
  '  name: "**************"\n' +
  '  namespace: default\n' +
  'spec:\n' +
  '  clusterSelector:\n' +
  '    matchExpressions:\n' +
  '      - key: name\n' +
  '        operator: In\n' +
  '        values:\n' +
  '          - local-cluster\n' +
  '  clusterConditions: []\n' +
  '---\n' +
  'apiVersion: policy.open-cluster-management.io/v1\n' +
  'kind: PlacementBinding\n' +
  'metadata:\n' +
  '  name: test-placement\n' +
  '  namespace: "*******"\n' +
  'placementRef:\n' +
  '  name: test-placement\n' +
  '  apiGroup: apps.open-cluster-management.io\n' +
  '  kind: PlacementRule\n' +
  'subjects:\n' +
  '  - name: test\n' +
  '    apiGroup: policy.open-cluster-management.io\n' +
  '    kind: Policy\n' +
  '\n'

const newResourceDecorators: Decorators = [
  {
    range: {
      endLineNumber: 26,
      endColumn: 132,
      startLineNumber: 26,
      startColumn: 1,
    },
    options: {
      inlineClassName: 'protectedDecoration',
      description: 'resource-editor',
    },
  },
  {
    range: {
      endLineNumber: 41,
      endColumn: 132,
      startLineNumber: 41,
      startColumn: 1,
    },
    options: {
      inlineClassName: 'protectedDecoration',
      description: 'resource-editor',
    },
  },
  {
    range: {
      endLineNumber: 44,
      endColumn: 132,
      startLineNumber: 44,
      startColumn: 1,
    },
    options: {
      inlineClassName: 'protectedDecoration',
      description: 'resource-editor',
    },
  },
]

const propsExistingResource: SyncEditorProps = {
  editorTitle: 'Policy YAML',
  variant: 'toolbar',
  resources: [
    {
      apiVersion: 'policy.open-cluster-management.io/v1',
      kind: 'Policy',
      metadata: {
        annotations: {
          'policy.open-cluster-management.io/categories': 'SC System and Communications Protection',
          'policy.open-cluster-management.io/controls': 'SC-6 Resource Availability',
          'policy.open-cluster-management.io/standards': 'NIST SP 800-53',
        },
        creationTimestamp: '2023-01-16T20:23:45Z',
        generation: 1,
        managedFields: [
          {
            apiVersion: 'policy.open-cluster-management.io/v1',
            fieldsType: 'FieldsV1',
            fieldsV1: {
              'f:metadata': {
                'f:annotations': {
                  '.': {},
                  'f:policy.open-cluster-management.io/categories': {},
                  'f:policy.open-cluster-management.io/controls': {},
                  'f:policy.open-cluster-management.io/standards': {},
                },
              },
              'f:spec': {
                '.': {},
                'f:disabled': {},
                'f:policy-templates': {},
              },
            },
            manager: 'unknown',
            operation: 'Update',
            time: '2023-01-16T20:23:45Z',
          },
          {
            apiVersion: 'policy.open-cluster-management.io/v1',
            fieldsType: 'FieldsV1',
            fieldsV1: {
              'f:status': {
                '.': {},
                'f:placement': {},
              },
            },
            manager: 'governance-policy-propagator',
            operation: 'Update',
            subresource: 'status',
            time: '2023-01-16T20:23:46Z',
          },
        ],
        name: 'test',
        namespace: 'default',
        resourceVersion: '1234229',
        uid: '9fa81d44-8b3e-4341-8c48-3b72bd2b1c11',
      },
      spec: {
        disabled: false,
        'policy-templates': [
          {
            objectDefinition: {
              apiVersion: 'policy.open-cluster-management.io/v1',
              kind: 'ConfigurationPolicy',
              metadata: {
                name: 'policy-limitrange',
              },
              spec: {
                namespaceSelector: {
                  exclude: ['kube-*'],
                  include: ['default'],
                },
                'object-templates': [
                  {
                    complianceType: 'mustonlyhave',
                    objectDefinition: {
                      apiVersion: 'v1',
                      kind: 'LimitRange',
                      metadata: {
                        name: 'mem-limit-range',
                      },
                      spec: {
                        limits: [
                          {
                            default: {
                              memory: '512Mi',
                            },
                            defaultRequest: {
                              memory: '256Mi',
                            },
                            type: 'Container',
                          },
                        ],
                      },
                    },
                  },
                ],
                remediationAction: 'inform',
                severity: 'medium',
              },
            },
          },
        ],
      },
    },
  ],
  schema: [
    {
      type: 'Policy',
      required: 1,
      schema: {
        type: 'object',
        properties: {
          apiVersion: {
            type: 'string',
          },
          kind: {
            const: 'Policy',
          },
          metadata: {
            type: 'object',
            properties: {
              name: {
                validateName: true,
              },
              namespace: {
                validateName: true,
              },
            },
            required: ['name', 'namespace'],
          },
          spec: {
            type: 'object',
            properties: {
              disabled: {
                type: 'boolean',
              },
              remediationAction: {
                enum: ['inform', 'enforce'],
              },
              dependencies: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    compliance: {
                      enum: ['Compliant', 'NonCompliant', 'Pending'],
                    },
                  },
                  validateDep: true,
                },
              },
              'policy-templates': {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    extraDependencies: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          compliance: {
                            enum: ['Compliant', 'NonCompliant', 'Pending'],
                          },
                        },
                        validateDep: true,
                      },
                    },
                  },
                },
              },
            },
            required: ['disabled'],
          },
        },
        required: ['apiVersion', 'metadata', 'kind', 'spec'],
      },
    },
    {
      type: 'Placement',
      schema: {
        type: 'object',
        properties: {
          apiVersion: {
            type: 'string',
          },
          kind: {
            type: 'string',
            const: 'Placement',
          },
          metadata: {
            type: 'object',
            properties: {
              name: {
                validateName: true,
              },
              namespace: {
                validateName: true,
              },
            },
            required: ['name', 'namespace'],
          },
          spec: {
            type: 'object',
            properties: {
              clusterSets: {
                type: 'array',
              },
              numberOfClusters: {
                type: 'number',
              },
              predicates: {
                type: 'array',
              },
            },
          },
        },
        required: ['apiVersion', 'kind', 'metadata', 'spec'],
      },
    },
    {
      type: 'PlacementRule',
      schema: {
        type: 'object',
        properties: {
          apiVersion: {
            type: 'string',
          },
          kind: {
            type: 'string',
            const: 'PlacementRule',
          },
          metadata: {
            type: 'object',
            properties: {
              name: {
                validateName: true,
              },
              namespace: {
                validateName: true,
              },
            },
            required: ['name', 'namespace'],
          },
          spec: {
            type: 'object',
            properties: {
              clusterSelector: {
                type: 'object',
                properties: {
                  matchExpressions: {
                    type: 'array',
                  },
                },
                required: ['matchExpressions'],
              },
            },
            required: ['clusterSelector'],
          },
        },
        required: ['apiVersion', 'kind', 'metadata', 'spec'],
      },
    },
    {
      type: 'PlacementBinding',
      schema: {
        type: 'object',
        properties: {
          apiVersion: {
            type: 'string',
          },
          kind: {
            type: 'string',
            const: 'PlacementBinding',
          },
          metadata: {
            type: 'object',
            properties: {
              name: {
                validateName: true,
              },
              namespace: {
                validateName: true,
              },
            },
            required: ['name', 'namespace'],
          },
          placementRef: {
            type: 'object',
            properties: {
              name: {
                validateName: true,
              },
              apiGroup: {
                type: 'string',
              },
              kind: {
                type: 'string',
                enum: ['Placement', 'PlacementRule'],
              },
            },
            required: ['name', 'apiGroup', 'kind'],
          },
          subjects: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                apiGroup: {
                  type: 'string',
                },
                kind: {
                  const: 'Policy',
                },
                name: {
                  validateName: true,
                },
              },
              required: ['apiGroup', 'kind', 'name'],
            },
          },
        },
        required: ['apiVersion', 'kind', 'metadata', 'placementRef', 'subjects'],
      },
    },
  ],
  filters: ['*.metadata.managedFields'],
  onEditorChange: mockOneditorchangeEdit,
}

const existingResourceYaml =
  'apiVersion: policy.open-cluster-management.io/v1\n' +
  'kind: Policy\n' +
  'metadata:\n' +
  '  name: test\n' +
  '  namespace: default\n' +
  '  annotations:\n' +
  '    policy.open-cluster-management.io/categories: SC System and Communications Protection\n' +
  '    policy.open-cluster-management.io/controls: SC-6 Resource Availability\n' +
  '    policy.open-cluster-management.io/standards: NIST SP 800-53\n' +
  '  creationTimestamp: 2023-01-16T20:23:45Z\n' +
  '  generation: 1\n' +
  '  managedFields:\n' +
  '  resourceVersion: "1234229"\n' +
  '  uid: 9fa81d44-8b3e-4341-8c48-3b72bd2b1c11\n' +
  'spec:\n' +
  '  disabled: false\n' +
  '  policy-templates:\n' +
  '    - objectDefinition:\n' +
  '        apiVersion: policy.open-cluster-management.io/v1\n' +
  '        kind: ConfigurationPolicy\n' +
  '        metadata:\n' +
  '          name: policy-limitrange\n' +
  '        spec:\n' +
  '          namespaceSelector:\n' +
  '            exclude:\n' +
  '              - kube-*\n' +
  '            include:\n' +
  '              - default\n' +
  '          object-templates:\n' +
  '            - complianceType: mustonlyhave\n' +
  '              objectDefinition:\n' +
  '                apiVersion: v1\n' +
  '                kind: LimitRange\n' +
  '                metadata:\n' +
  '                  name: mem-limit-range\n' +
  '                spec:\n' +
  '                  limits:\n' +
  '                    - default:\n' +
  '                        memory: 512Mi\n' +
  '                      defaultRequest:\n' +
  '                        memory: 256Mi\n' +
  '                      type: Container\n' +
  '          remediationAction: inform\n' +
  '          severity: medium\n'

const existingResourceDecorators: Decorators = [
  {
    range: {
      endLineNumber: 4,
      endColumn: 132,
      startLineNumber: 4,
      startColumn: 1,
    },
    options: {
      inlineClassName: 'protectedDecoration',
      description: 'resource-editor',
    },
  },
  {
    range: {
      endLineNumber: 5,
      endColumn: 132,
      startLineNumber: 5,
      startColumn: 1,
    },
    options: {
      inlineClassName: 'protectedDecoration',
      description: 'resource-editor',
    },
  },
  {
    range: {
      endLineNumber: 10,
      endColumn: 132,
      startLineNumber: 10,
      startColumn: 1,
    },
    options: {
      inlineClassName: 'protectedDecoration',
      description: 'resource-editor',
    },
  },
  {
    range: {
      endLineNumber: 11,
      endColumn: 132,
      startLineNumber: 11,
      startColumn: 1,
    },
    options: {
      inlineClassName: 'protectedDecoration',
      description: 'resource-editor',
    },
  },
  {
    range: {
      endLineNumber: 12,
      endColumn: 132,
      startLineNumber: 12,
      startColumn: 1,
    },
    options: {
      inlineClassName: 'protectedDecoration',
      description: 'resource-editor',
    },
  },
  {
    range: {
      endLineNumber: 13,
      endColumn: 132,
      startLineNumber: 13,
      startColumn: 1,
    },
    options: {
      inlineClassName: 'protectedDecoration',
      description: 'resource-editor',
    },
  },
  {
    range: {
      endLineNumber: 14,
      endColumn: 132,
      startLineNumber: 14,
      startColumn: 1,
    },
    options: {
      inlineClassName: 'protectedDecoration',
      description: 'resource-editor',
    },
  },
  {
    range: {
      endLineNumber: 12,
      endColumn: 132,
      startLineNumber: 12,
      startColumn: 0,
    },
    options: {
      after: {
        content: '​',
        inlineClassName: 'inline-folded',
      },
      description: 'resource-editor',
    },
  },
]

const protectedDecorators = [
  {
    range: {
      endLineNumber: 9,
      endColumn: 0,
      startLineNumber: 9,
      startColumn: 0,
    },
    options: {
      isWholeLine: true,
      linesDecorationsClassName: 'customLineDecoration',
      overviewRuler: { color: '#0000ff', position: 1 },
      minimap: { color: '#0000ff', position: 2 },
      description: 'resource-editor',
    },
  },
  {
    range: {
      endLineNumber: 9,
      endColumn: 132,
      startLineNumber: 9,
      startColumn: 0,
    },
    options: {
      after: { content: '  # true', inlineClassName: 'protectedDecoration' },
      description: 'resource-editor',
    },
  },
  {
    range: {
      endLineNumber: 24,
      endColumn: 132,
      startLineNumber: 24,
      startColumn: 1,
    },
    options: {
      inlineClassName: 'protectedDecoration',
      description: 'resource-editor',
    },
  },
  {
    range: {
      endLineNumber: 39,
      endColumn: 132,
      startLineNumber: 39,
      startColumn: 1,
    },
    options: {
      inlineClassName: 'protectedDecoration',
      description: 'resource-editor',
    },
  },
  {
    range: {
      endLineNumber: 42,
      endColumn: 132,
      startLineNumber: 42,
      startColumn: 1,
    },
    options: {
      inlineClassName: 'protectedDecoration',
      description: 'resource-editor',
    },
  },
]

const semanticErrors = [
  {
    range: {
      endLineNumber: 4,
      endColumn: 132,
      startLineNumber: 4,
      startColumn: 0,
    },
    options: {
      isWholeLine: true,
      glyphMarginClassName: 'errorDecoration',
      glyphMarginHoverMessage: {
        value:
          '```html\n' +
          'Dependencies on ConfigurationPolicies, IamPolicies, and CertificatePolicies cannot contain a namespace \n' +
          '```',
      },
      overviewRuler: { color: '#ff0000', position: 4 },
      minimap: { color: '#ff000060', position: 1 },
      description: 'resource-editor',
    },
  },
  {
    range: {
      endLineNumber: 13,
      endColumn: 1,
      startLineNumber: 4,
      startColumn: 3,
    },
    options: { className: 'squiggly-error' },
  },
  {
    range: {
      endLineNumber: 5,
      endColumn: 132,
      startLineNumber: 5,
      startColumn: 0,
    },
    options: {
      isWholeLine: true,
      glyphMarginClassName: 'errorDecoration',
      glyphMarginHoverMessage: { value: "```html\nMust have required property 'name' \n```" },
      overviewRuler: { color: '#ff0000', position: 4 },
      minimap: { color: '#ff000060', position: 1 },
      description: 'resource-editor',
    },
  },
  {
    range: {
      endLineNumber: 5,
      endColumn: 6,
      startLineNumber: 5,
      startColumn: 3,
    },
    options: { className: 'squiggly-error' },
  },
  {
    range: {
      endLineNumber: 4,
      endColumn: 132,
      startLineNumber: 4,
      startColumn: 0,
    },
    options: {
      isWholeLine: true,
      glyphMarginClassName: 'errorDecoration',
      glyphMarginHoverMessage: {
        value:
          '```html\n' +
          'Name must start/end alphanumerically, can contain dashes and periods, and must be less then 253 characters \n' +
          '```',
      },
      overviewRuler: { color: '#ff0000', position: 4 },
      minimap: { color: '#ff000060', position: 1 },
      description: 'resource-editor',
    },
  },
  {
    range: {
      endLineNumber: 4,
      endColumn: 22,
      startLineNumber: 4,
      startColumn: 14,
    },
    options: { className: 'squiggly-error' },
  },
  {
    range: {
      endLineNumber: 6,
      endColumn: 132,
      startLineNumber: 6,
      startColumn: 0,
    },
    options: {
      isWholeLine: true,
      glyphMarginClassName: 'errorDecoration',
      glyphMarginHoverMessage: { value: '```html\nMust be equal to constant: Test \n```' },
      overviewRuler: { color: '#ff0000', position: 4 },
      minimap: { color: '#ff000060', position: 1 },
      description: 'resource-editor',
    },
  },
  {
    range: {
      endLineNumber: 6,
      endColumn: 20,
      startLineNumber: 6,
      startColumn: 14,
    },
    options: { className: 'squiggly-error' },
  },
  {
    range: {
      endLineNumber: 7,
      endColumn: 132,
      startLineNumber: 7,
      startColumn: 0,
    },
    options: {
      isWholeLine: true,
      glyphMarginClassName: 'warningDecoration',
      glyphMarginHoverMessage: {
        value: '```html\n' + 'Must be equal to one of the allowed values: "ost", "vmw" \n' + '```',
      },
      overviewRuler: { color: '#ffff00', position: 4 },
      minimap: { color: '#ffff0060', position: 1 },
      description: 'resource-editor',
    },
  },
  {
    range: {
      endLineNumber: 7,
      endColumn: 16,
      startLineNumber: 7,
      startColumn: 13,
    },
    options: { className: 'squiggly-warning' },
  },
  {
    range: {
      endLineNumber: 8,
      endColumn: 132,
      startLineNumber: 8,
      startColumn: 0,
    },
    options: {
      isWholeLine: true,
      glyphMarginClassName: 'errorDecoration',
      glyphMarginHoverMessage: { value: '```html\nMust be string \n```' },
      overviewRuler: { color: '#ff0000', position: 4 },
      minimap: { color: '#ff000060', position: 1 },
      description: 'resource-editor',
    },
  },
  {
    range: {
      endLineNumber: 8,
      endColumn: 14,
      startLineNumber: 8,
      startColumn: 13,
    },
    options: { className: 'squiggly-error' },
  },
  {
    range: {
      endLineNumber: 9,
      endColumn: 132,
      startLineNumber: 9,
      startColumn: 0,
    },
    options: {
      isWholeLine: true,
      glyphMarginClassName: 'errorDecoration',
      glyphMarginHoverMessage: {
        value:
          '```html\n' +
          'Name must start/end alphanumerically, can contain dashes, and must be less then 63 characters \n' +
          '```',
      },
      overviewRuler: { color: '#ff0000', position: 4 },
      minimap: { color: '#ff000060', position: 1 },
      description: 'resource-editor',
    },
  },
  {
    range: {
      endLineNumber: 9,
      endColumn: 94,
      startLineNumber: 9,
      startColumn: 22,
    },
    options: { className: 'squiggly-error' },
  },
  {
    range: {
      endLineNumber: 11,
      endColumn: 132,
      startLineNumber: 11,
      startColumn: 0,
    },
    options: {
      isWholeLine: true,
      glyphMarginClassName: 'errorDecoration',
      glyphMarginHoverMessage: {
        value: '```html\nMust match pattern "[%d] [%p] [application-ui] [%c] %m" \n```',
      },
      overviewRuler: { color: '#ff0000', position: 4 },
      minimap: { color: '#ff000060', position: 1 },
      description: 'resource-editor',
    },
  },
  {
    range: {
      endLineNumber: 11,
      endColumn: 20,
      startLineNumber: 11,
      startColumn: 16,
    },
    options: { className: 'squiggly-error' },
  },
  {
    range: {
      endLineNumber: 12,
      endColumn: 132,
      startLineNumber: 12,
      startColumn: 1,
    },
    options: {
      inlineClassName: 'protectedDecoration',
      description: 'resource-editor',
    },
  },
]
const syntaxError = [
  {
    range: {
      endLineNumber: 2,
      endColumn: 132,
      startLineNumber: 2,
      startColumn: 0,
    },
    options: {
      isWholeLine: true,
      glyphMarginClassName: 'errorDecoration',
      glyphMarginHoverMessage: {
        value:
          '```html\n' +
          'Implicit map keys need to be followed by map values at line 2, column 1:\n' +
          '\n' +
          'kindabc Policy\n' +
          '^^^^^^^^^^^^^^\n' +
          ' \n' +
          '```',
      },
      overviewRuler: { color: '#ff0000', position: 4 },
      minimap: { color: '#ff000060', position: 1 },
      description: 'resource-editor',
    },
  },
  {
    range: {
      endLineNumber: 2,
      endColumn: 15,
      startLineNumber: 2,
      startColumn: 1,
    },
    options: { className: 'squiggly-error' },
  },
]
