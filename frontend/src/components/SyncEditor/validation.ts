/* Copyright Contributors to the Open Cluster Management project */
import Ajv from 'ajv'
import stringSimilarity from 'string-similarity'
import { isEmpty, get, set, keyBy, cloneDeep } from 'lodash'
import { getPathArray } from './synchronize'

export enum ErrorType {
  error = 'error',
  warning = 'warning',
  info = 'info',
}

export interface ErrorMessageType {
  linePos: {
    end: { line: 1; col: 1 }
    start: { line: 1; col: 1 }
  }
  message: string
  errorType?: ErrorType
}

//////// compile ajv schemas for validation
export const compileAjvSchemas = (schema: any[]) => {
  try {
    const ajv = new Ajv({ allErrors: true, verbose: true })
    addAjvKeywords(ajv)
    if (!Array.isArray(schema)) {
      return [{ validator: ajv.compile(schema) }]
    } else {
      const schemas: any = []
      schema.forEach(({ type, required, schema }) => {
        schemas.push({
          type,
          required,
          validator: ajv.compile(schema),
        })
      })
      return schemas
    }
  } catch (e) {
    console.log(e)
  }
}

export const addAjvKeywords = (ajv: Ajv) => {
  ajv.addKeyword({
    keyword: 'validateName',
    schemaType: 'boolean',
    validate: (_schema: null, data: any) => {
      return (
        !data || (/^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/.test(data) && data.length <= 253)
      )
    },
  })
  ajv.addKeyword({
    keyword: 'validateDep',
    schemaType: 'boolean',
    validate: (_schema: null, data: any) => {
      if (data['namespace']) {
        if (
          (data['kind'] && data['kind'] === 'ConfigurationPolicy') ||
          data['kind'] == 'IamPolicy' ||
          data['kind'] == 'CertificatePolicy'
        ) {
          return false
        }
      }
      return true
    },
  })
  ajv.addKeyword({
    keyword: 'validateLabel',
    schemaType: 'boolean',
    validate: (_schema: null, data: any) => {
      return (
        !data || (/^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/.test(data) && data.length <= 63)
      )
    },
  })
  ajv.addKeyword({
    keyword: 'deprecatedKind',
    schemaType: 'string',
    validate: () => {
      return false
    },
  })
}

//////// syntax errors
export const getErrors = (documents: any[]) => {
  const errors: any[] = []
  documents.forEach((document: { errors: any[] }) => {
    document?.errors.forEach((error: { linePos: any; message: any }) => {
      const { linePos, message } = error
      errors.push({ linePos, message })
    })
  })
  return errors
}

///////// validation errors
export function validate(
  validators: any,
  mappings: { [name: string]: any[] },
  resources: any[],
  errors: any[],
  syntaxErrors: any[],
  protectedRanges: any[]
) {
  const kindMap = {}
  const validatorMap = keyBy(validators, 'type')
  const requiredTypes: Record<string, number> = {}
  Object.entries(validatorMap).forEach(([k, v]) => {
    if (v.required) {
      requiredTypes[k] = v.required
    }
  })
  const wasRequired = cloneDeep(requiredTypes)
  resources.forEach((resource) => {
    const kind = resource.kind
    requiredTypes[kind]--
    let d: number = get(kindMap, kind, 0)
    // determine validation for this resource
    let validator = validators[0]?.validator
    if (validators.length > 1) {
      validator = validatorMap[kind]?.validator
      if (!validator && kind) {
        const matches = stringSimilarity.findBestMatch(kind, Object.keys(validatorMap))
        const {
          bestMatch: { rating, target },
        } = matches
        if (rating > 0.7) {
          validator = validatorMap[target]?.validator
        }
      }
    }
    if (validator) {
      // d keeps track of Secret[0], Secret[1], Secret[d]
      validateResource(validator, mappings, [resource.kind, d], resource, errors, protectedRanges)
      set(kindMap, resource.kind, d++)
    }
  })
  // what required types weren't found
  Object.entries(requiredTypes).forEach(([k, v]) => {
    if (v > 0) {
      syntaxErrors.push({
        linePos: {
          end: { line: 1, col: 1 },
          start: { line: 1, col: 1 },
        },
        message: `Requires ${wasRequired[k]} ${k}`,
      })
    }
  })
}

export function validateResource(
  validator: any,
  mappings: { [name: string]: any[] },
  prefix: string[],
  resource: any,
  errors: any[],
  protectedRanges: any[]
) {
  const valid = validator(resource)
  if (!valid) {
    validator.errors.forEach((error: { instancePath: string; keyword: string; message: string; params: any }) => {
      const { instancePath, keyword, message, params } = error
      const errorMsg: ErrorMessageType = {
        linePos: {
          end: { line: 1, col: 1 },
          start: { line: 1, col: 1 },
        },
        message,
      }

      // convert instance path to line
      // for paths, lodash get hates periods, ajv hates forward slash
      let path: string[] = prefix
      if (!isEmpty(instancePath)) {
        path = instancePath
          .substring(1)
          .split('/')
          .map((p) => {
            return p.replace(/~\d+/g, '/')
          })
        path = [...prefix, ...path]
        path = getPathArray(path)
      }
      let mapping = get(mappings, path)
      if (mapping) {
        // no need to show validation errors on immutable lines
        const lineNumber = mapping?.kind?.$r ?? mapping?.$r ?? 1
        const lineIsProtected = protectedRanges.some((prohibited: { containsPosition: (arg: any) => any }) => {
          return prohibited.containsPosition({ lineNumber, startColumn: 1, endColumn: 1 })
        })
        if (!lineIsProtected) {
          errorMsg.linePos.start.line = errorMsg.linePos.end.line = lineNumber
          errorMsg.errorType = ErrorType.error
          let matches
          switch (keyword) {
            // missing a key
            case 'required':
              // see if there's a misspelled key
              mapping = mapping.$v || mapping
              if (!isEmpty(mapping)) {
                matches = stringSimilarity.findBestMatch(params.missingProperty, Object.keys(mapping))
              }
              if (matches) {
                const {
                  bestMatch: { rating, target },
                } = matches
                if (rating > 0.7) {
                  const similar = mapping[target]
                  errorMsg.linePos.start.line = errorMsg.linePos.end.line = similar.$r
                  errorMsg.linePos.start.col = similar.$gk.start.col
                  errorMsg.linePos.end.col = similar.$gk.end.col
                }
              }
              break
            case 'const':
              errorMsg.message = `${message}: ${params.allowedValue}`
              errorMsg.linePos.start.col = mapping.$gv.start.col
              errorMsg.linePos.end.col = mapping.$gv.end.col
              break
            case 'deprecatedKind':
              errorMsg.message = `This kind is deprecated: ${mapping.$v}`
              errorMsg.linePos.start.col = mapping.$gv.start.col
              errorMsg.linePos.end.col = mapping.$gv.end.col
              errorMsg.errorType = ErrorType.info
              break
            // value wrong pattern
            case 'pattern':
              errorMsg.linePos.start.col = mapping.$gv.start.col
              errorMsg.linePos.end.col = mapping.$gv.end.col
              break
            // validateName
            case 'validateName':
              errorMsg.message =
                'Name must start/end alphanumerically, can contain dashes and periods, and must be less then 253 characters'
              errorMsg.linePos.start.col = mapping.$gv.start.col
              errorMsg.linePos.end.col = mapping.$gv.end.col
              break
            // validateDep
            case 'validateDep':
              errorMsg.message =
                'Dependencies on ConfigurationPolicies, IamPolicies, and CertificatePolicies cannot contain a namespace'
              errorMsg.linePos.start.line = mapping.$gv.start.line
              errorMsg.linePos.end.line = mapping.$gv.end.line
              errorMsg.linePos.start.col = mapping.$gv.start.col
              errorMsg.linePos.end.col = mapping.$gv.end.col
              break
            // validateLabel
            case 'validateLabel':
              errorMsg.message =
                'Name must start/end alphanumerically, can contain dashes, and must be less then 63 characters'
              errorMsg.linePos.start.col = mapping.$gv.start.col
              errorMsg.linePos.end.col = mapping.$gv.end.col
              break
            // value wrong enum
            case 'enum':
              errorMsg.message = `${message}: ${params.allowedValues
                .map((val: any) => {
                  return `"${val}"`
                })
                .join(', ')}`
              if (mapping.$gv) {
                errorMsg.linePos.start.col = mapping.$gv.start.col
                errorMsg.linePos.end.col = mapping.$gv.end.col
              }
              errorMsg.errorType = ErrorType.warning
              break
            case 'type':
              errorMsg.message = message
              errorMsg.linePos.start.col = mapping.$gv?.start?.col ?? 1
              errorMsg.linePos.end.col = mapping.$gv?.end?.col ?? 1
              break
            default:
              errorMsg.message = message
              errorMsg.linePos.start.col = mapping.$gv?.start?.col ?? 1
              errorMsg.linePos.end.col = mapping.$gv?.end?.col ?? 1
              break
          }
          errors.push(errorMsg)
        }
      }
    })
  }
}

export const formatErrors = (errors: ErrorMessageType[], merrorType?: ErrorType) => {
  return errors
    .filter(({ errorType }) => errorType === merrorType)
    .map((error) => {
      return {
        line: error.linePos.start.line,
        col: error.linePos.start.col,
        message: error.message,
      }
    })
}
