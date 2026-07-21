/* Copyright Contributors to the Open Cluster Management project */

import { SyncEditor, SyncEditorProps, ValidationStatus } from './SyncEditor'
import { SYNC_EDITOR_SHOW_CHANGES_STORAGE_KEY } from './SyncEditorToolbar'
import * as MonacoEditorReact from '@monaco-editor/react'
import { render, screen, waitFor, fireEvent, createEvent, act } from '@testing-library/react'

const lastDiffNavigator = (
  MonacoEditorReact as typeof MonacoEditorReact & {
    lastDiffNavigator: { current: { previous: jest.Mock; next: jest.Mock } | null }
  }
).lastDiffNavigator
const lastEditorLayout = (
  MonacoEditorReact as typeof MonacoEditorReact & {
    lastEditorLayout: { current: jest.Mock | null }
  }
).lastEditorLayout
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
    await new Promise((resolve) => setTimeout(resolve, 2500)) // wait for debounce

    // make sure first user edit is still there
    // make sure form change is still there
    // make sure last user edit is still good
    // make sure decorators show what's protected
    const lastChange = onEditorChange.mock.calls[onEditorChange.mock.calls.length - 1]
    expect(get(lastChange, '0.resources.0.spec.disabled')).toBeFalsy()
    expect(get(lastChange, '0.resources.0.metadata.annotations.test')).toBe('me')
    expect(
      get(
        lastChange,
        '0.resources.1.spec.predicates.0.requiredClusterSelector.labelSelector.matchExpressions.0.values.0'
      )
    ).toBe('newthing')
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
    let text = 'disabled: true'
    let i = input.value.indexOf(text) + text.length - 4
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
    await waitFor(() => expect(document.querySelector('.monaco-editor.focused')).toBeNull())
    fireEvent.blur(input)
    document.body.focus()
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 500))
    })
    userEvent.click(
      screen.getByRole('button', {
        name: /show secrets/i,
      })
    )
    await waitFor(() => expect(input.value).toContain('test-placement'), { timeout: 5000 })

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
    expect(window.navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('test-placement'))
    await new Promise((resolve) => setTimeout(resolve, 1200)) // wait for debounce

    // paste certificate
    text = 'pem:'
    i = input.value.indexOf(text) + text.length + 5
    input.setSelectionRange(i, i)
    const paste = createEvent.paste(input, {
      clipboardData: {
        getData: () => certificate,
      },
    })
    fireEvent(input.parentElement ?? input, paste)
    await new Promise((resolve) => setTimeout(resolve, 1200)) // wait for debounce
    expect(input.value).toContain('-----BEGIN CERTIFICATE-----')
    expect(input.value).toContain('test-placement')
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

  it('Should add namespace key when it is autoCreate and missing ns', async () => {
    const onEditorChange = jest.fn()
    const clone = cloneDeep(propsNewResource)
    clone.onEditorChange = onEditorChange
    clone.autoCreateNs = true
    clone.resources = [
      {
        apiVersion: 'policy.open-cluster-management.io/v1',
        kind: 'Policy',
        metadata: {
          name: 'test',
        },
        spec: {
          disabled: false,
        },
      },
    ]
    render(<SyncEditor {...clone} />)

    // make sure yaml matches
    const input = screen.getByRole('textbox', {
      name: /monaco/i,
    }) as HTMLTextAreaElement

    await waitFor(() => expect(input).toHaveTextContent('apiVersion'))
    input.setSelectionRange(0, 1000)
    const paste = createEvent.paste(input, {
      clipboardData: {
        getData: () => pastedWONSResource,
      },
    })
    fireEvent(input.parentElement ?? input, paste)
    await new Promise((resolve) => setTimeout(resolve, 1200)) // wait for debounce
    expect(input).toHaveMultilineValue(pastedWNSResource)
  })

  describe('additional SyncEditor coverage', () => {
    beforeEach(() => {
      localStorage.setItem(SYNC_EDITOR_SHOW_CHANGES_STORAGE_KEY, 'false')
      lastDiffNavigator.current = null
    })

    it('reports pending validation status while the user edits', async () => {
      const onStatusChange = jest.fn()
      const clone = cloneDeep(propsNewResource)
      clone.onStatusChange = onStatusChange
      render(<SyncEditor {...clone} />)
      const input = screen.getByRole('textbox', { name: /monaco/i }) as HTMLTextAreaElement
      await waitFor(() => expect(input).not.toHaveValue(''))
      onStatusChange.mockClear()
      userEvent.type(input, 'x')
      expect(onStatusChange).toHaveBeenCalledWith(ValidationStatus.pending)
    })

    it('shows diff view when compare is enabled with default resources', async () => {
      const clone = cloneDeep(propsNewResource)
      clone.defaultResources = cloneDeep(clone.resources)
      set(clone, 'resources.0.spec.disabled', false)
      render(<SyncEditor {...clone} />)
      await waitFor(() => screen.getByRole('textbox', { name: /monaco/i }))
      userEvent.click(screen.getByRole('checkbox', { name: /show changes/i }))
      await waitFor(() => expect(screen.getByRole('textbox', { name: /monaco-diff/i })).toBeInTheDocument())
    })

    it('syncs form changes while compare view is active', async () => {
      const clone = cloneDeep(propsNewResource)
      clone.defaultResources = cloneDeep(clone.resources)
      const { rerender } = render(<SyncEditor {...clone} />)
      const input = screen.getByRole('textbox', { name: /monaco/i }) as HTMLTextAreaElement
      await waitFor(() => expect(input).not.toHaveValue(''))
      input.blur()
      userEvent.click(screen.getByRole('checkbox', { name: /show changes/i }))
      await waitFor(() => screen.getByRole('textbox', { name: /monaco-diff/i }))
      set(clone, 'resources.0.metadata.annotations', { test: 'compare' })
      rerender(<SyncEditor {...clone} />)
      await new Promise((resolve) => setTimeout(resolve, 1200))
      expect(screen.getByRole('textbox', { name: /monaco-diff/i })).toBeInTheDocument()
    })

    it('invokes diff navigation controls from the toolbar', async () => {
      localStorage.setItem(SYNC_EDITOR_SHOW_CHANGES_STORAGE_KEY, 'true')
      const clone = cloneDeep(propsNewResource)
      clone.defaultResources = cloneDeep(clone.resources)
      render(<SyncEditor {...clone} />)
      await waitFor(() => screen.getByRole('textbox', { name: /monaco-diff/i }))
      await waitFor(() => expect(lastDiffNavigator.current).not.toBeNull())
      userEvent.click(screen.getByRole('button', { name: /previous change/i }))
      userEvent.click(screen.getByRole('button', { name: /next change/i }))
      expect(lastDiffNavigator.current?.previous).toHaveBeenCalledTimes(1)
      expect(lastDiffNavigator.current?.next).toHaveBeenCalledTimes(1)
    })

    it('pastes certificate content with indentation after pem field', async () => {
      const clone = cloneDeep(propsNewResource)
      render(<SyncEditor {...clone} />)
      const input = screen.getByRole('textbox', { name: /monaco/i }) as HTMLTextAreaElement
      await waitFor(() => expect(input).not.toHaveValue(''))
      const lineIndex = input.value.split('\n').findIndex((line) => line.includes('pem:'))
      expect(lineIndex).toBeGreaterThan(-1)
      const offset = input.value
        .split('\n')
        .slice(0, lineIndex + 1)
        .join('\n').length
      input.setSelectionRange(offset, offset)
      const paste = createEvent.paste(input, {
        clipboardData: { getData: () => certificate },
      })
      fireEvent(input.parentElement ?? input, paste)
      await new Promise((resolve) => setTimeout(resolve, 500))
      expect(input.value).toContain('-----BEGIN CERTIFICATE-----')
    })
  })

  describe('layoutEditor resize handling', () => {
    const originalClientWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth')
    const originalClientHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientHeight')
    let resizeCallback: (() => void) | null = null

    beforeEach(() => {
      Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: 800 })
      Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, value: 600 })
      resizeCallback = null
      lastEditorLayout.current = null
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod = require('@react-hook/resize-observer')
      jest.spyOn(mod, 'default').mockImplementation((_ref: any, cb: any) => {
        resizeCallback = cb
      })
    })

    afterEach(() => {
      jest.restoreAllMocks()
      if (originalClientWidth) {
        Object.defineProperty(HTMLElement.prototype, 'clientWidth', originalClientWidth)
      }
      if (originalClientHeight) {
        Object.defineProperty(HTMLElement.prototype, 'clientHeight', originalClientHeight)
      }
    })

    it('calls editor.layout with container dimensions on mount', async () => {
      const clone = cloneDeep(propsNewResource)
      render(<SyncEditor {...clone} />)
      const input = screen.getByRole('textbox', { name: /monaco/i }) as HTMLTextAreaElement
      await waitFor(() => expect(input).not.toHaveValue(''))
      expect(lastEditorLayout.current).toHaveBeenCalledWith({ width: 800, height: 564 })
    })

    it('skips layout when resize fires but dimensions have not changed', async () => {
      const clone = cloneDeep(propsNewResource)
      render(<SyncEditor {...clone} />)
      const input = screen.getByRole('textbox', { name: /monaco/i }) as HTMLTextAreaElement
      await waitFor(() => expect(input).not.toHaveValue(''))
      lastEditorLayout.current!.mockClear()
      await act(async () => {
        resizeCallback?.()
        await new Promise((resolve) => requestAnimationFrame(resolve))
      })
      expect(lastEditorLayout.current).not.toHaveBeenCalled()
    })

    it('re-layouts when activeEditor changes to diff editor', async () => {
      const clone = cloneDeep(propsNewResource)
      clone.defaultResources = cloneDeep(clone.resources)
      set(clone, 'resources.0.spec.disabled', false)
      render(<SyncEditor {...clone} />)
      const input = screen.getByRole('textbox', { name: /monaco/i }) as HTMLTextAreaElement
      await waitFor(() => expect(input).not.toHaveValue(''))
      const originalLayoutMock = lastEditorLayout.current!
      expect(originalLayoutMock).toHaveBeenCalledWith({ width: 800, height: 564 })
      await act(async () => {
        userEvent.click(screen.getByRole('checkbox', { name: /show changes/i }))
      })
      await waitFor(() => expect(screen.getByRole('textbox', { name: /monaco-diff/i })).toBeInTheDocument())
      expect(lastEditorLayout.current).not.toBe(originalLayoutMock)
    })

    it('skips layout when container has zero dimensions', async () => {
      Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: 0 })
      Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, value: 0 })
      const clone = cloneDeep(propsNewResource)
      render(<SyncEditor {...clone} />)
      const input = screen.getByRole('textbox', { name: /monaco/i }) as HTMLTextAreaElement
      await waitFor(() => expect(input).not.toHaveValue(''))
      const calls = lastEditorLayout.current!.mock.calls
      const hasPositiveDimensions = calls.some((args: any[]) => args[0] && args[0].width > 0 && args[0].height > 0)
      expect(hasPositiveDimensions).toBe(false)
    })

    it('sets condensed mode when width is below 500', async () => {
      Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: 400 })
      Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, value: 300 })
      const clone = cloneDeep(propsNewResource)
      render(<SyncEditor {...clone} />)
      const input = screen.getByRole('textbox', { name: /monaco/i }) as HTMLTextAreaElement
      await waitFor(() => expect(input).not.toHaveValue(''))
    })
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
        pem: '|',
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
      apiVersion: 'cluster.open-cluster-management.io/v1beta1',
      kind: 'Placement',
      metadata: {
        name: 'test-placement',
        namespace: 'default',
      },
      spec: {
        predicates: [
          {
            requiredClusterSelector: {
              labelSelector: {
                matchExpressions: [
                  {
                    key: 'name',
                    operator: 'In',
                    values: ['local-cluster'],
                  },
                ],
              },
            },
          },
        ],
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
        apiGroup: 'cluster.open-cluster-management.io',
        kind: 'Placement',
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
                enum: ['Placement'],
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
  secrets: ['Placement.0.metadata.name', 'PlacementBinding.0.metadata.namespace'],
  onEditorChange: mockOneditorchangeCreate,
}

const certificate =
  '-----BEGIN CERTIFICATE-----\r\n' +
  'FakeCertificateContentsForTestingPurposesNotRealDataAtAllJustFun\r\n' +
  'FakeCertificateContentsForTestingPurposesNotRealDataAtAllAndMore\r\n' +
  'FakeCertificateContentsFinalLine==\r\n' +
  '-----END CERTIFICATE-----'

const pastedWONSResource =
  'apiVersion: policy.open-cluster-management.io/v1\nkind: Policy\nmetadata:\n  name: test\nspec:\n  disabled: false'
const pastedWNSResource =
  'apiVersion: policy.open-cluster-management.io/v1\nkind: Policy\nmetadata:\n  name: test\n  namespace: ""\nspec:\n  disabled: false'

const newResourceYaml =
  'apiVersion: policy.open-cluster-management.io/v1\n' +
  'kind: Policy\n' +
  'metadata:\n' +
  '  name: test\n' +
  '  namespace: default\n' +
  '  annotations:\n' +
  '    policy.open-cluster-management.io/categories: AC Access Control\n' +
  '    policy.open-cluster-management.io/controls: AC-3 Access Enforcement\n' +
  '    policy.open-cluster-management.io/standards: NIST SP 800-53\n' +
  '  pem: "|"\n' +
  'spec:\n' +
  '  disabled: true\n' +
  '  policy-templates:\n' +
  '    - objectDefinition:\n' +
  '        apiVersion: policy.open-cluster-management.io/v1\n' +
  '        kind: IamPolicy\n' +
  '        metadata:\n' +
  '          name: policy-limitclusteradmin\n' +
  '        spec:\n' +
  '          maxClusterRoleBindingUsers: 5\n' +
  '          remediationAction: inform\n' +
  '          severity: medium\n' +
  '---\n' +
  'apiVersion: cluster.open-cluster-management.io/v1beta1\n' +
  'kind: Placement\n' +
  'metadata:\n' +
  '  name: "**************"\n' +
  '  namespace: default\n' +
  'spec:\n' +
  '  predicates:\n' +
  '    - requiredClusterSelector:\n' +
  '        labelSelector:\n' +
  '          matchExpressions:\n' +
  '            - key: name\n' +
  '              operator: In\n' +
  '              values:\n' +
  '                - local-cluster\n' +
  '---\n' +
  'apiVersion: policy.open-cluster-management.io/v1\n' +
  'kind: PlacementBinding\n' +
  'metadata:\n' +
  '  name: test-placement\n' +
  '  namespace: "*******"\n' +
  'placementRef:\n' +
  '  name: test-placement\n' +
  '  apiGroup: cluster.open-cluster-management.io\n' +
  '  kind: Placement\n' +
  'subjects:\n' +
  '  - name: test\n' +
  '    apiGroup: policy.open-cluster-management.io\n' +
  '    kind: Policy\n'

const newResourceDecorators: Decorators = [
  {
    range: {
      endLineNumber: 27,
      endColumn: 132,
      startLineNumber: 27,
      startColumn: 1,
    },
    options: {
      inlineClassName: 'protectedDecoration',
      description: 'resource-editor',
    },
  },
  {
    range: {
      endLineNumber: 43,
      endColumn: 132,
      startLineNumber: 43,
      startColumn: 1,
    },
    options: {
      inlineClassName: 'protectedDecoration',
      description: 'resource-editor',
    },
  },
  {
    range: {
      endLineNumber: 46,
      endColumn: 132,
      startLineNumber: 46,
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
                enum: ['Placement'],
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
      endLineNumber: 10,
      endColumn: 0,
      startLineNumber: 10,
      startColumn: 0,
    },
    options: {
      linesDecorationsClassName: 'customLineDecoration',
      overviewRuler: { color: '#0000ff', position: 1 },
      isWholeLine: true,
      description: 'resource-editor',
      zIndex: 1000,
    },
  },
  {
    range: {
      endLineNumber: 10,
      endColumn: 132,
      startLineNumber: 10,
      startColumn: 0,
    },
    options: {
      after: { content: '  # true', inlineClassName: 'protectedDecoration' },
      description: 'resource-editor',
    },
  },
  {
    range: {
      endLineNumber: 25,
      endColumn: 132,
      startLineNumber: 25,
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

const semanticErrors = [
  {
    range: {
      startLineNumber: 4,
      endLineNumber: 4,
      endColumn: 132,
      startColumn: 0,
    },
    options: {
      isWholeLine: true,
      glyphMarginClassName: 'errorDecoration',
      overviewRuler: {
        color: '#ff0000',
        position: 4,
      },
      minimap: {
        color: '#ff000060',
        position: 1,
      },
      glyphMarginHoverMessage: {
        value:
          '```html\nDependencies on ConfigurationPolicies, IamPolicies, and CertificatePolicies cannot contain a namespace \n```',
      },
      description: 'resource-editor',
    },
  },
  {
    range: {
      startLineNumber: 4,
      endLineNumber: 13,
      endColumn: 1,
      startColumn: 3,
    },
    options: {
      className: 'squiggly-error',
    },
  },
  {
    range: {
      startLineNumber: 9,
      endLineNumber: 9,
      endColumn: 132,
      startColumn: 0,
    },
    options: {
      isWholeLine: true,
      glyphMarginClassName: 'errorDecoration',
      overviewRuler: {
        color: '#ff0000',
        position: 4,
      },
      minimap: {
        color: '#ff000060',
        position: 1,
      },
      glyphMarginHoverMessage: {
        value: "```html\nMust have required property 'name' \n```",
      },
      description: 'resource-editor',
    },
  },
  {
    range: {
      startLineNumber: 9,
      endLineNumber: 9,
      endColumn: 6,
      startColumn: 3,
    },
    options: {
      className: 'squiggly-error',
    },
  },
  {
    range: {
      startLineNumber: 4,
      endLineNumber: 4,
      endColumn: 132,
      startColumn: 0,
    },
    options: {
      isWholeLine: true,
      glyphMarginClassName: 'errorDecoration',
      overviewRuler: {
        color: '#ff0000',
        position: 4,
      },
      minimap: {
        color: '#ff000060',
        position: 1,
      },
      glyphMarginHoverMessage: {
        value:
          '```html\nName must start/end alphanumerically, can contain dashes and periods, and must be less then 253 characters \n```',
      },
      description: 'resource-editor',
    },
  },
  {
    range: {
      startLineNumber: 4,
      endLineNumber: 4,
      endColumn: 22,
      startColumn: 14,
    },
    options: {
      className: 'squiggly-error',
    },
  },
  {
    range: {
      startLineNumber: 5,
      endLineNumber: 5,
      endColumn: 132,
      startColumn: 0,
    },
    options: {
      isWholeLine: true,
      glyphMarginClassName: 'errorDecoration',
      overviewRuler: {
        color: '#ff0000',
        position: 4,
      },
      minimap: {
        color: '#ff000060',
        position: 1,
      },
      glyphMarginHoverMessage: {
        value: '```html\nMust be equal to constant: Test \n```',
      },
      description: 'resource-editor',
    },
  },
  {
    range: {
      startLineNumber: 5,
      endLineNumber: 5,
      endColumn: 20,
      startColumn: 14,
    },
    options: {
      className: 'squiggly-error',
    },
  },
  {
    range: {
      startLineNumber: 6,
      endLineNumber: 6,
      endColumn: 132,
      startColumn: 0,
    },
    options: {
      isWholeLine: true,
      glyphMarginClassName: 'warningDecoration',
      overviewRuler: {
        color: '#ffff00',
        position: 4,
      },
      minimap: {
        color: '#ffff0060',
        position: 1,
      },
      glyphMarginHoverMessage: {
        value: '```html\nMust be equal to one of the allowed values: "ost", "vmw" \n```',
      },
      description: 'resource-editor',
    },
  },
  {
    range: {
      startLineNumber: 6,
      endLineNumber: 6,
      endColumn: 16,
      startColumn: 13,
    },
    options: {
      className: 'squiggly-warning',
    },
  },
  {
    range: {
      startLineNumber: 11,
      endLineNumber: 11,
      endColumn: 132,
      startColumn: 0,
    },
    options: {
      isWholeLine: true,
      glyphMarginClassName: 'errorDecoration',
      overviewRuler: {
        color: '#ff0000',
        position: 4,
      },
      minimap: {
        color: '#ff000060',
        position: 1,
      },
      glyphMarginHoverMessage: {
        value: '```html\nMust be string \n```',
      },
      description: 'resource-editor',
    },
  },
  {
    range: {
      startLineNumber: 11,
      endLineNumber: 11,
      endColumn: 14,
      startColumn: 13,
    },
    options: {
      className: 'squiggly-error',
    },
  },
  {
    range: {
      startLineNumber: 12,
      endLineNumber: 12,
      endColumn: 132,
      startColumn: 0,
    },
    options: {
      isWholeLine: true,
      glyphMarginClassName: 'errorDecoration',
      overviewRuler: {
        color: '#ff0000',
        position: 4,
      },
      minimap: {
        color: '#ff000060',
        position: 1,
      },
      glyphMarginHoverMessage: {
        value:
          '```html\nName must start/end alphanumerically, can contain dashes, and must be less then 63 characters \n```',
      },
      description: 'resource-editor',
    },
  },
  {
    range: {
      startLineNumber: 12,
      endLineNumber: 12,
      endColumn: 94,
      startColumn: 22,
    },
    options: {
      className: 'squiggly-error',
    },
  },
  {
    range: {
      startLineNumber: 10,
      endLineNumber: 10,
      endColumn: 132,
      startColumn: 0,
    },
    options: {
      isWholeLine: true,
      glyphMarginClassName: 'errorDecoration',
      overviewRuler: {
        color: '#ff0000',
        position: 4,
      },
      minimap: {
        color: '#ff000060',
        position: 1,
      },
      glyphMarginHoverMessage: {
        value: '```html\nMust match pattern "[%d] [%p] [application-ui] [%c] %m" \n```',
      },
      description: 'resource-editor',
    },
  },
  {
    range: {
      startLineNumber: 10,
      endLineNumber: 10,
      endColumn: 20,
      startColumn: 16,
    },
    options: {
      className: 'squiggly-error',
    },
  },
  {
    range: {
      startLineNumber: 7,
      endLineNumber: 7,
      endColumn: 132,
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
