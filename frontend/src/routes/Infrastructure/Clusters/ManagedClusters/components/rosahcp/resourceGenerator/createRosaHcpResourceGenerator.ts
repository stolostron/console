/* Copyright Contributors to the Open Cluster Management project */

import Ajv, { type ErrorObject } from 'ajv'
import Handlebars from 'handlebars'
import * as yaml from 'js-yaml'
import {
  findLineForPath,
  splitYamlDocuments,
  yamlExceptionToValidationError,
  type ResourceSchema,
  type ValidationError,
  type YamlResourceGenerator,
} from '@redhat-cloud-services/nxtcm-rosa-hcp-wizard'
import rosaHcpCapiTemplateRaw from '../templates/rosa-hcp-capi-template.hbs'
import capiClusterSchema from './schemas/capiClusterSchema.json'
import managedClusterSchema from './schemas/managedClusterSchema.json'
import rosaClusterSchema from './schemas/rosaClusterSchema.json'
import rosaControlPlaneSchema from './schemas/rosaControlPlaneSchema.json'

export const rosaHcpResourceSchemas: ResourceSchema[] = [
  { kind: 'ROSAControlPlane', schema: rosaControlPlaneSchema, primary: true },
  { kind: 'ManagedCluster', schema: managedClusterSchema },
  { kind: 'Cluster', schema: capiClusterSchema },
  { kind: 'ROSACluster', schema: rosaClusterSchema },
]

const eqHelper: Handlebars.HelperDelegate = function (
  this: unknown,
  a: unknown,
  b: unknown,
  options: Handlebars.HelperOptions
) {
  return a === b ? options.fn(this) : options.inverse(this)
}

// network_host_prefix is stored as e.g. '/23'; ROSAControlPlane.spec.network.hostPrefix expects an integer.
const stripSlashHelper: Handlebars.HelperDelegate = function (value: string) {
  if (typeof value === 'string' && value.startsWith('/')) {
    return value.slice(1)
  }
  return value
}

function formatAjvError(err: ErrorObject): string {
  const path = err.instancePath || '/'
  switch (err.keyword) {
    case 'additionalProperties':
      return `Unknown field "${(err.params as { additionalProperty: string }).additionalProperty}" at ${path}`
    case 'required':
      return `Missing required field "${(err.params as { missingProperty: string }).missingProperty}" at ${path}`
    case 'type':
      return `Expected type "${(err.params as { type: string }).type}" at ${path}`
    case 'enum':
      return `Must be one of [${(err.params as { allowedValues: string[] }).allowedValues.join(', ')}] at ${path}`
    case 'pattern':
      return `Invalid format at ${path}: must match ${(err.params as { pattern: string }).pattern}`
    case 'const':
      return `Must be "${(err.params as { allowedValue: string }).allowedValue}" at ${path}`
    default:
      return `${err.message ?? 'Validation error'} at ${path}`
  }
}

export function createRosaHcpResourceGenerator(): YamlResourceGenerator {
  const hbs = Handlebars.create()
  hbs.registerHelper('eq', eqHelper)
  hbs.registerHelper('stripSlash', stripSlashHelper)
  const compiled = hbs.compile(rosaHcpCapiTemplateRaw)

  const primaryKind = rosaHcpResourceSchemas.find((s) => s.primary)?.kind
  const ajv = new Ajv({ allErrors: true, strict: false })
  const validatorsByKind = new Map<string, ReturnType<Ajv['compile']>>()
  for (const { kind, schema } of rosaHcpResourceSchemas) {
    validatorsByKind.set(kind, ajv.compile(schema))
  }

  return {
    renderYaml(formValues) {
      try {
        const raw = compiled({ cluster: formValues })
        return raw
          .split('\n')
          .filter((line) => line.trim() !== '')
          .join('\n')
      } catch {
        return ''
      }
    },

    validateYaml(yamlStr): ValidationError[] {
      const errors: ValidationError[] = []
      const seenKinds = new Set<string>()
      let hasParseError = false

      for (const { content, startLine } of splitYamlDocuments(yamlStr)) {
        if (!content.trim()) continue

        let document: unknown
        try {
          document = yaml.load(content)
        } catch (e) {
          hasParseError = true
          const parseError = yamlExceptionToValidationError(e, startLine - 1)
          if (parseError) errors.push(parseError)
          continue
        }

        if (document === null || typeof document !== 'object') continue

        const kind = (document as Record<string, unknown>).kind
        if (typeof kind !== 'string') continue
        seenKinds.add(kind)

        const validateDoc = validatorsByKind.get(kind)
        if (!validateDoc) continue

        const valid = validateDoc(document)
        if (valid || !validateDoc.errors) continue

        errors.push(
          ...validateDoc.errors.map((err) => ({
            message: `[${kind}] ${formatAjvError(err)}`,
            line: startLine + findLineForPath(content, err.instancePath) - 1,
            column: 1,
            severity: 'error' as const,
            path: err.instancePath,
          }))
        )
      }

      if (primaryKind && !hasParseError && !seenKinds.has(primaryKind)) {
        errors.unshift({
          message: `Missing ${primaryKind} document`,
          line: 1,
          column: 1,
          severity: 'error',
        })
      }

      return errors
    },

    resourceSchemas: rosaHcpResourceSchemas,
  }
}
