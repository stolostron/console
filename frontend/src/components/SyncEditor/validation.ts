/* Copyright Contributors to the Open Cluster Management project */
import Ajv from 'ajv'
import stringSimilarity from 'string-similarity'
import { isEmpty, get, set, keyBy, cloneDeep } from 'lodash'
import { getPathArray } from './synchronize'

export interface ErrorMessageType {
    linePos: {
        end: { line: 1; col: 1 }
        start: { line: 1; col: 1 }
    }
    message: string
    isWarning?: boolean
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
    } catch (e) {}
}

export const addAjvKeywords = (ajv: Ajv) => {
    ajv.addKeyword({
        keyword: 'validateDNSName',
        schemaType: 'boolean',
        validate: (_schema: null, data: any) => {
            return (
                !data ||
                (/^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/.test(data) && data.length <= 63)
            )
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
export function validate(validators: any, mappings: { [name: string]: any[] }, resources: any[], errors: any[]) {
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
        let validator = validators[0].validator
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
            validateResource(validator, mappings, [resource.kind, d], resource, errors)
            set(kindMap, resource.kind, d++)
        }
    })
    // what required types weren't found
    Object.entries(requiredTypes).forEach(([k, v]) => {
        if (v > 0) {
            errors.push({
                linePos: {
                    end: { line: 1, col: 1 },
                    start: { line: 1, col: 1 },
                },
                message: `Requires ${wasRequired[k]} ${k}`,
            })
        }
    })
}

function validateResource(
    validator: any,
    mappings: { [name: string]: any[] },
    prefix: string[],
    resource: any,
    errors: any[]
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
                errorMsg.linePos.start.line = errorMsg.linePos.end.line = mapping?.kind?.$r ?? mapping?.$r ?? 1
                errorMsg.isWarning = true
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
                        errorMsg.isWarning = false
                        break
                    case 'const':
                        errorMsg.message = `${message}: ${params.allowedValue}`
                        errorMsg.linePos.start.col = mapping.$gv.start.col
                        errorMsg.linePos.end.col = mapping.$gv.end.col
                        errorMsg.isWarning = false
                        break
                    // value wrong pattern
                    case 'pattern':
                        errorMsg.linePos.start.col = mapping.$gv.start.col
                        errorMsg.linePos.end.col = mapping.$gv.end.col
                        errorMsg.isWarning = false
                        break
                    // validateDNSName
                    case 'validateDNSName':
                        errorMsg.message =
                            'Name must start/end alphanumerically, can contain dashes, and must be less then 63 characters'
                        errorMsg.linePos.start.col = mapping.$gv.start.col
                        errorMsg.linePos.end.col = mapping.$gv.end.col
                        errorMsg.isWarning = false
                        break
                    // value wrong enum
                    case 'enum':
                        errorMsg.message = `${message}: ${params.allowedValues
                            .map((val: any) => {
                                return `"${val}"`
                            })
                            .join(', ')}`
                        errorMsg.linePos.start.col = mapping.$gv.start.col
                        errorMsg.linePos.end.col = mapping.$gv.end.col
                        break
                    case 'type':
                        errorMsg.message = message
                        errorMsg.linePos.start.col = mapping.$gv?.start?.col ?? 1
                        errorMsg.linePos.end.col = mapping.$gv?.end?.col ?? 1
                        errorMsg.isWarning = false
                        break
                    default:
                        errorMsg.message = message
                        errorMsg.linePos.start.col = mapping.$gv?.start?.col ?? 1
                        errorMsg.linePos.end.col = mapping.$gv?.end?.col ?? 1
                        break
                }
            }
            errors.push(errorMsg)
        })
    }
}

export const formatErrors = (errors: ErrorMessageType[], warnings?: boolean) => {
    return errors
        .filter(({ isWarning }) => {
            return warnings ? isWarning === true : isWarning !== true
        })
        .map((error) => {
            return {
                line: error.linePos.start.line,
                col: error.linePos.start.col,
                message: error.message,
            }
        })
}
