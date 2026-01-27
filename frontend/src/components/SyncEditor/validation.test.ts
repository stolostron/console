/* Copyright Contributors to the Open Cluster Management project */

import Ajv from 'ajv'
import {
  compileAjvSchemas,
  addAjvKeywords,
  getErrors,
  validate,
  validateResource,
  validateTemplateSyntax,
  formatErrors,
  ErrorType,
  ErrorMessageType,
} from './validation'

describe('validation', () => {
  describe('compileAjvSchemas', () => {
    it('should compile a single schema', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
      }
      const result = compileAjvSchemas(schema) as any[]
      expect(result).toHaveLength(1)
      expect(result[0].validator).toBeDefined()
    })

    it('should compile an array of schemas', () => {
      const schema = [
        {
          type: 'Policy',
          required: 1,
          schema: {
            type: 'object',
            properties: {
              kind: { const: 'Policy' },
            },
          },
        },
        {
          type: 'Placement',
          schema: {
            type: 'object',
            properties: {
              kind: { const: 'Placement' },
            },
          },
        },
      ]
      const result = compileAjvSchemas(schema) as any[]
      expect(result).toHaveLength(2)
      expect(result[0].type).toBe('Policy')
      expect(result[0].required).toBe(1)
      expect(result[0].validator).toBeDefined()
      expect(result[1].type).toBe('Placement')
      expect(result[1].validator).toBeDefined()
    })

    it('should handle invalid schema gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      const invalidSchema = {
        type: 'invalid-type-that-does-not-exist',
      }
      compileAjvSchemas(invalidSchema)
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('addAjvKeywords', () => {
    let ajv: Ajv

    beforeEach(() => {
      ajv = new Ajv({ allErrors: true, verbose: true })
      addAjvKeywords(ajv)
    })

    describe('validateName', () => {
      it('should validate valid names', () => {
        const validate = ajv.compile({ validateName: true })
        expect(validate('my-resource')).toBe(true)
        expect(validate('my-resource.example')).toBe(true)
        expect(validate('my123resource')).toBe(true)
        expect(validate('a')).toBe(true)
        expect(validate('')).toBe(true)
        expect(validate(null)).toBe(true)
        expect(validate(undefined)).toBe(true)
      })

      it('should reject invalid names', () => {
        const validate = ajv.compile({ validateName: true })
        expect(validate('-starts-with-dash')).toBe(false)
        expect(validate('ends-with-dash-')).toBe(false)
        expect(validate('UPPERCASE')).toBe(false)
        expect(validate('has spaces')).toBe(false)
        expect(validate('has_underscore')).toBe(false)
        expect(validate('a'.repeat(254))).toBe(false) // exceeds 253 chars
      })
    })

    describe('validateTemplateName', () => {
      it('should validate valid template names', () => {
        const validate = ajv.compile({ validateTemplateName: true })
        expect(validate('my-resource')).toBe(true)
        expect(validate('{{my-template}}')).toBe(true)
        expect(validate('')).toBe(true)
        expect(validate(null)).toBe(true)
        expect(validate(undefined)).toBe(true)
      })

      it('should reject invalid template names', () => {
        const validate = ajv.compile({ validateTemplateName: true })
        expect(validate('UPPERCASE')).toBe(false)
        expect(validate('{invalid-template}')).toBe(false) // single brace
        expect(validate('a'.repeat(64))).toBe(false) // exceeds 63 chars
      })
    })

    describe('validateDep', () => {
      it('should allow dependencies without namespace', () => {
        const validate = ajv.compile({ validateDep: true })
        expect(validate({ kind: 'ConfigurationPolicy' })).toBe(true)
        expect(validate({ kind: 'IamPolicy' })).toBe(true)
        expect(validate({ kind: 'CertificatePolicy' })).toBe(true)
        expect(validate({ kind: 'OtherKind', namespace: 'test' })).toBe(true)
      })

      it('should reject ConfigurationPolicy, IamPolicy, CertificatePolicy with namespace', () => {
        const validate = ajv.compile({ validateDep: true })
        expect(validate({ kind: 'ConfigurationPolicy', namespace: 'test' })).toBe(false)
        expect(validate({ kind: 'IamPolicy', namespace: 'test' })).toBe(false)
        expect(validate({ kind: 'CertificatePolicy', namespace: 'test' })).toBe(false)
      })
    })

    describe('validateLabel', () => {
      it('should validate valid labels', () => {
        const validate = ajv.compile({ validateLabel: true })
        expect(validate('my-label')).toBe(true)
        expect(validate('label123')).toBe(true)
        expect(validate('')).toBe(true)
        expect(validate(null)).toBe(true)
      })

      it('should reject invalid labels', () => {
        const validate = ajv.compile({ validateLabel: true })
        expect(validate('a'.repeat(64))).toBe(false) // exceeds 63 chars
        expect(validate('-starts-with-dash')).toBe(false)
      })
    })

    describe('deprecatedKind', () => {
      it('should always return false for deprecated kinds', () => {
        const validate = ajv.compile({ deprecatedKind: 'OldKind' })
        expect(validate('anything')).toBe(false)
        expect(validate(null)).toBe(false)
      })
    })

    describe('validateGenerator', () => {
      it('should validate valid generators', () => {
        const validate = ajv.compile({ validateGenerator: true })
        expect(validate({ clusterDecisionResource: {} })).toBe(true)
        expect(validate({ git: {} })).toBe(true)
        expect(validate({ list: {} })).toBe(true)
        expect(validate({ clusters: {} })).toBe(true)
        expect(validate({ merge: {} })).toBe(true)
        expect(validate({ scmProvider: {} })).toBe(true)
        expect(validate({ pullRequest: {} })).toBe(true)
        expect(validate({ plugin: {} })).toBe(true)
        expect(validate(null)).toBe(true)
        expect(validate(undefined)).toBe(true)
      })

      it('should validate array of generators', () => {
        const validate = ajv.compile({ validateGenerator: true })
        expect(validate([{ git: {} }, { list: {} }])).toBe(true)
        expect(validate([{ git: {} }, { invalid: {} }])).toBe(false)
      })

      it('should reject invalid generators', () => {
        const validate = ajv.compile({ validateGenerator: true })
        expect(validate({ invalidGenerator: {} })).toBe(false)
        expect(validate({ helm: {} })).toBe(false)
      })
    })
  })

  describe('getErrors', () => {
    it('should extract errors from documents', () => {
      const documents = [
        {
          errors: [
            { linePos: { start: { line: 1, col: 1 }, end: { line: 1, col: 10 } }, message: 'Error 1' },
            { linePos: { start: { line: 2, col: 1 }, end: { line: 2, col: 10 } }, message: 'Error 2' },
          ],
        },
        {
          errors: [{ linePos: { start: { line: 3, col: 1 }, end: { line: 3, col: 10 } }, message: 'Error 3' }],
        },
      ]
      const errors = getErrors(documents)
      expect(errors).toHaveLength(3)
      expect(errors[0].message).toBe('Error 1')
      expect(errors[1].message).toBe('Error 2')
      expect(errors[2].message).toBe('Error 3')
    })

    it('should handle documents with no errors', () => {
      const documents = [{ errors: [] }, { errors: [] }]
      const errors = getErrors(documents)
      expect(errors).toHaveLength(0)
    })

    it('should handle undefined documents', () => {
      const documents = [undefined, { errors: [] }]
      const errors = getErrors(documents as any)
      expect(errors).toHaveLength(0)
    })
  })

  describe('validate', () => {
    it('should validate resources against schema', () => {
      const validators = compileAjvSchemas({
        type: 'object',
        properties: {
          kind: { const: 'Policy' },
          metadata: {
            type: 'object',
            properties: {
              name: { validateName: true },
            },
            required: ['name'],
          },
        },
        required: ['kind', 'metadata'],
      })
      const resources = [
        {
          kind: 'Policy',
          metadata: { name: 'test-policy' },
        },
      ]
      const mappings = {
        Policy: [
          {
            kind: { $r: 1, $v: 'Policy', $gv: { start: { col: 7 }, end: { col: 13 } } },
            metadata: {
              $r: 2,
              $v: { name: 'test-policy' },
              name: { $r: 3, $v: 'test-policy', $gv: { start: { col: 9 }, end: { col: 21 } } },
            },
          },
        ],
      }
      const errors: any[] = []
      const syntaxErrors: any[] = []
      const protectedRanges: any[] = []

      validate(validators, mappings, resources, errors, syntaxErrors, protectedRanges)
      expect(errors).toHaveLength(0)
    })

    it('should detect missing required properties', () => {
      const validators = compileAjvSchemas({
        type: 'object',
        properties: {
          kind: { const: 'Policy' },
          metadata: {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
            required: ['name'],
          },
        },
        required: ['kind', 'metadata'],
      })
      const resources = [
        {
          kind: 'Policy',
          metadata: {},
        },
      ]
      const mappings = {
        Policy: [
          {
            kind: { $r: 1, $v: 'Policy', $gv: { start: { col: 7 }, end: { col: 13 } } },
            metadata: {
              $r: 2,
              $v: {},
            },
          },
        ],
      }
      const errors: any[] = []
      const syntaxErrors: any[] = []
      const protectedRanges: any[] = []

      validate(validators, mappings, resources, errors, syntaxErrors, protectedRanges)
      expect(errors.length).toBeGreaterThan(0)
    })

    it('should track required types', () => {
      const validators = [
        {
          type: 'Policy',
          required: 2,
          validator: new Ajv().compile({ type: 'object' }),
        },
      ]
      const resources = [{ kind: 'Policy' }]
      const mappings = { Policy: [{ $r: 1 }] }
      const errors: any[] = []
      const syntaxErrors: any[] = []
      const protectedRanges: any[] = []

      validate(validators, mappings, resources, errors, syntaxErrors, protectedRanges)
      expect(syntaxErrors.length).toBeGreaterThan(0)
      expect(syntaxErrors[0].message).toContain('Requires 2 Policy')
    })

    it('should match resources to validators by kind with fuzzy matching', () => {
      const validators = [
        {
          type: 'Policy',
          validator: new Ajv().compile({ type: 'object', properties: { kind: { const: 'Policy' } } }),
        },
        {
          type: 'Placement',
          validator: new Ajv().compile({ type: 'object', properties: { kind: { const: 'Placement' } } }),
        },
      ]
      // "Polcy" is close enough to "Policy" (>0.7 similarity)
      const resources = [{ kind: 'Polcy' }]
      const mappings = { Polcy: [{ kind: { $r: 1, $v: 'Polcy' } }] }
      const errors: any[] = []
      const syntaxErrors: any[] = []
      const protectedRanges: any[] = []

      validate(validators, mappings, resources, errors, syntaxErrors, protectedRanges)
      // Should find a matching validator via fuzzy matching
    })
  })

  describe('validateResource', () => {
    it('should handle enum validation errors', () => {
      const ajv = new Ajv({ allErrors: true, verbose: true })
      const validator = ajv.compile({
        type: 'object',
        properties: {
          status: { enum: ['active', 'inactive'] },
        },
      })
      const resource = { status: 'invalid' }
      const mappings = {
        Policy: [
          {
            $r: 1,
            status: {
              $r: 2,
              $v: 'invalid',
              $gv: { start: { col: 10 }, end: { col: 17 } },
            },
          },
        ],
      }
      const errors: any[] = []
      const protectedRanges: any[] = []

      validateResource(validator, mappings, ['Policy', '0'], resource, errors, protectedRanges)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].errorType).toBe(ErrorType.warning)
    })

    it('should skip validation on protected ranges', () => {
      const ajv = new Ajv({ allErrors: true, verbose: true })
      const validator = ajv.compile({
        type: 'object',
        properties: {
          name: { type: 'number' },
        },
      })
      const resource = { name: 'not-a-number' }
      const mappings = {
        Policy: [
          {
            $r: 1,
            name: {
              $r: 5,
              $v: 'not-a-number',
              $gv: { start: { col: 7 }, end: { col: 20 } },
            },
          },
        ],
      }
      const errors: any[] = []
      const protectedRanges = [
        {
          containsPosition: ({ lineNumber }: { lineNumber: number }) => lineNumber === 5,
        },
      ]

      validateResource(validator, mappings, ['Policy', '0'], resource, errors, protectedRanges)
      expect(errors).toHaveLength(0)
    })

    it('should handle const validation errors', () => {
      const ajv = new Ajv({ allErrors: true, verbose: true })
      const validator = ajv.compile({
        type: 'object',
        properties: {
          kind: { const: 'Policy' },
        },
      })
      const resource = { kind: 'WrongKind' }
      const mappings = {
        Test: [
          {
            $r: 1,
            kind: {
              $r: 1,
              $v: 'WrongKind',
              $gv: { start: { col: 7 }, end: { col: 16 } },
            },
          },
        ],
      }
      const errors: any[] = []
      const protectedRanges: any[] = []

      validateResource(validator, mappings, ['Test', '0'], resource, errors, protectedRanges)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].message).toContain('Policy')
    })

    it('should handle validateName keyword errors', () => {
      const ajv = new Ajv({ allErrors: true, verbose: true })
      addAjvKeywords(ajv)
      const validator = ajv.compile({
        type: 'object',
        properties: {
          name: { validateName: true },
        },
      })
      const resource = { name: '-invalid-name' }
      const mappings = {
        Test: [
          {
            $r: 1,
            name: {
              $r: 2,
              $v: '-invalid-name',
              $gv: { start: { col: 7 }, end: { col: 20 } },
            },
          },
        ],
      }
      const errors: any[] = []
      const protectedRanges: any[] = []

      validateResource(validator, mappings, ['Test', '0'], resource, errors, protectedRanges)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].message).toContain('alphanumerically')
    })

    it('should handle validateLabel keyword errors', () => {
      const ajv = new Ajv({ allErrors: true, verbose: true })
      addAjvKeywords(ajv)
      const validator = ajv.compile({
        type: 'object',
        properties: {
          label: { validateLabel: true },
        },
      })
      const resource = { label: 'a'.repeat(64) }
      const mappings = {
        Test: [
          {
            $r: 1,
            label: {
              $r: 2,
              $v: 'a'.repeat(64),
              $gv: { start: { col: 8 }, end: { col: 72 } },
            },
          },
        ],
      }
      const errors: any[] = []
      const protectedRanges: any[] = []

      validateResource(validator, mappings, ['Test', '0'], resource, errors, protectedRanges)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].message).toContain('63 characters')
    })

    it('should handle validateDep keyword errors', () => {
      const ajv = new Ajv({ allErrors: true, verbose: true })
      addAjvKeywords(ajv)
      const validator = ajv.compile({
        type: 'object',
        validateDep: true,
      })
      const resource = { kind: 'ConfigurationPolicy', namespace: 'test' }
      const mappings = {
        Test: [
          {
            $r: 1,
            $gv: { start: { line: 1, col: 1 }, end: { line: 2, col: 10 } },
            $v: { kind: 'ConfigurationPolicy', namespace: 'test' },
          },
        ],
      }
      const errors: any[] = []
      const protectedRanges: any[] = []

      validateResource(validator, mappings, ['Test', '0'], resource, errors, protectedRanges)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].message).toContain('ConfigurationPolicies')
    })

    it('should handle validateGenerator keyword errors', () => {
      const ajv = new Ajv({ allErrors: true, verbose: true })
      addAjvKeywords(ajv)
      const validator = ajv.compile({
        type: 'object',
        properties: {
          generators: { validateGenerator: true },
        },
      })
      const resource = { generators: { invalidGen: {} } }
      const mappings = {
        Test: [
          {
            $r: 1,
            generators: {
              $r: 2,
              $v: { invalidGen: {} },
              $gv: { start: { col: 13 }, end: { col: 30 } },
            },
          },
        ],
      }
      const errors: any[] = []
      const protectedRanges: any[] = []

      validateResource(validator, mappings, ['Test', '0'], resource, errors, protectedRanges)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].errorType).toBe(ErrorType.warning)
      expect(errors[0].message).toContain('Generator must be one of')
    })

    it('should handle deprecatedKind keyword', () => {
      const ajv = new Ajv({ allErrors: true, verbose: true })
      addAjvKeywords(ajv)
      const validator = ajv.compile({
        type: 'object',
        properties: {
          kind: { deprecatedKind: 'OldKind' },
        },
      })
      const resource = { kind: 'OldKind' }
      const mappings = {
        Test: [
          {
            $r: 1,
            kind: {
              $r: 1,
              $v: 'OldKind',
              $gv: { start: { col: 7 }, end: { col: 14 } },
            },
          },
        ],
      }
      const errors: any[] = []
      const protectedRanges: any[] = []

      validateResource(validator, mappings, ['Test', '0'], resource, errors, protectedRanges)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].errorType).toBe(ErrorType.info)
      expect(errors[0].message).toContain('deprecated')
    })

    it('should handle pattern validation errors', () => {
      const ajv = new Ajv({ allErrors: true, verbose: true })
      const validator = ajv.compile({
        type: 'object',
        properties: {
          format: { type: 'string', pattern: '^[a-z]+$' },
        },
      })
      const resource = { format: '123invalid' }
      const mappings = {
        Test: [
          {
            $r: 1,
            format: {
              $r: 2,
              $v: '123invalid',
              $gv: { start: { col: 9 }, end: { col: 19 } },
            },
          },
        ],
      }
      const errors: any[] = []
      const protectedRanges: any[] = []

      validateResource(validator, mappings, ['Test', '0'], resource, errors, protectedRanges)
      expect(errors.length).toBeGreaterThan(0)
    })

    it('should handle type validation errors', () => {
      const ajv = new Ajv({ allErrors: true, verbose: true })
      const validator = ajv.compile({
        type: 'object',
        properties: {
          count: { type: 'number' },
        },
      })
      const resource = { count: 'not-a-number' }
      const mappings = {
        Test: [
          {
            $r: 1,
            count: {
              $r: 2,
              $v: 'not-a-number',
              $gv: { start: { col: 8 }, end: { col: 20 } },
            },
          },
        ],
      }
      const errors: any[] = []
      const protectedRanges: any[] = []

      validateResource(validator, mappings, ['Test', '0'], resource, errors, protectedRanges)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].message).toBe('must be number')
    })

    it('should handle required property errors', () => {
      const ajv = new Ajv({ allErrors: true, verbose: true })
      const validator = ajv.compile({
        type: 'object',
        properties: {
          metadata: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              namespace: { type: 'string' },
            },
            required: ['name', 'namespace'],
          },
        },
      })
      const resource = { metadata: { name: 'test' } } // missing namespace
      const mappings = {
        Test: [
          {
            $r: 1,
            metadata: {
              $r: 2,
              name: {
                $r: 3,
                $v: 'test',
                $gv: { start: { col: 9 }, end: { col: 13 } },
              },
            },
          },
        ],
      }
      const errors: any[] = []
      const protectedRanges: any[] = []

      validateResource(validator, mappings, ['Test', '0'], resource, errors, protectedRanges)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].message).toContain('namespace')
    })
  })

  describe('validateTemplateSyntax', () => {
    it('should not add errors for valid string names', () => {
      const mappings = {
        $v: {
          metadata: {
            $p: ['metadata'],
            $v: {
              name: {
                $p: ['metadata', 'name'],
                $r: 3,
                $v: 'valid-name',
              },
            },
          },
        },
      }
      const errors: any[] = []
      validateTemplateSyntax(mappings, errors)
      expect(errors).toHaveLength(0)
    })

    it('should add error for non-string name in metadata', () => {
      const mappings = {
        $v: {
          metadata: {
            $p: ['metadata'],
            $v: {
              name: {
                $p: ['metadata', 'name'],
                $r: 3,
                $v: 123, // non-string value
                $gv: { start: { col: 9 }, end: { col: 12 } },
              },
            },
          },
        },
      }
      const errors: any[] = []
      validateTemplateSyntax(mappings, errors)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].message).toContain('template name')
    })

    it('should add error for non-string namespace in metadata', () => {
      const mappings = {
        $v: {
          metadata: {
            $p: ['metadata'],
            $v: {
              namespace: {
                $p: ['metadata', 'namespace'],
                $r: 4,
                $v: 456, // non-string value
                $gv: { start: { col: 14 }, end: { col: 17 } },
              },
            },
          },
        },
      }
      const errors: any[] = []
      validateTemplateSyntax(mappings, errors)
      expect(errors.length).toBeGreaterThan(0)
    })

    it('should handle arrays in mappings', () => {
      const mappings = [
        {
          $v: {
            metadata: {
              $p: ['metadata'],
              $v: {
                name: {
                  $p: ['metadata', 'name'],
                  $r: 3,
                  $v: 'valid-name',
                },
              },
            },
          },
        },
      ]
      const errors: any[] = []
      validateTemplateSyntax(mappings, errors)
      expect(errors).toHaveLength(0)
    })

    it('should handle null/undefined mappings', () => {
      const errors: any[] = []
      validateTemplateSyntax(null, errors)
      expect(errors).toHaveLength(0)
      validateTemplateSyntax(undefined, errors)
      expect(errors).toHaveLength(0)
    })
  })

  describe('formatErrors', () => {
    it('should format errors by type', () => {
      const errors: ErrorMessageType[] = [
        {
          linePos: { start: { line: 1, col: 5 }, end: { line: 1, col: 10 } },
          message: 'Error message',
          errorType: ErrorType.error,
        },
        {
          linePos: { start: { line: 2, col: 3 }, end: { line: 2, col: 15 } },
          message: 'Warning message',
          errorType: ErrorType.warning,
        },
        {
          linePos: { start: { line: 3, col: 1 }, end: { line: 3, col: 20 } },
          message: 'Info message',
          errorType: ErrorType.info,
        },
      ]

      const errorResults = formatErrors(errors, ErrorType.error)
      expect(errorResults).toHaveLength(1)
      expect(errorResults[0]).toEqual({
        line: 1,
        col: 5,
        message: 'Error message',
      })

      const warningResults = formatErrors(errors, ErrorType.warning)
      expect(warningResults).toHaveLength(1)
      expect(warningResults[0]).toEqual({
        line: 2,
        col: 3,
        message: 'Warning message',
      })

      const infoResults = formatErrors(errors, ErrorType.info)
      expect(infoResults).toHaveLength(1)
      expect(infoResults[0]).toEqual({
        line: 3,
        col: 1,
        message: 'Info message',
      })
    })

    it('should return empty array when no errors match type', () => {
      const errors: ErrorMessageType[] = [
        {
          linePos: { start: { line: 1, col: 5 }, end: { line: 1, col: 10 } },
          message: 'Error message',
          errorType: ErrorType.error,
        },
      ]

      const warningResults = formatErrors(errors, ErrorType.warning)
      expect(warningResults).toHaveLength(0)
    })

    it('should handle errors without errorType', () => {
      const errors: ErrorMessageType[] = [
        {
          linePos: { start: { line: 1, col: 5 }, end: { line: 1, col: 10 } },
          message: 'No type message',
        },
      ]

      const undefinedResults = formatErrors(errors, undefined)
      expect(undefinedResults).toHaveLength(1)
    })
  })

  describe('ErrorType enum', () => {
    it('should have correct values', () => {
      expect(ErrorType.error).toBe('error')
      expect(ErrorType.warning).toBe('warning')
      expect(ErrorType.info).toBe('info')
    })
  })
})
