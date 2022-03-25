/* Copyright Contributors to the Open Cluster Management project */
import YAML from 'yaml'
import stringSimilarity from 'string-similarity'
import { isEmpty, get, set, keyBy, cloneDeep, has, PropertyPath } from 'lodash'
import { reconcile } from './reconcile'
import { ChangeType } from './changes'

export interface ProcessedType {
    parsed: {
        [name: string]: any[]
    }
    mappings: {
        [name: string]: any[]
    }
    resources: any[]
    yaml?: string
    hiddenSecretsValues?: any[]
}

export interface MappingType {
    $k: string // what's it's key
    $r: number //what line is it on in the yaml
    $l: number // how many lines does it use in the yaml
    $v: any // what's its value
    $s?: boolean // is a secret
    $gk?: any // the start/stop of the key in the yaml
    $gv?: any // what's the start/stop of the value in yaml
}

export interface SecretsValuesType {
    path: string
    value: string
}
export interface ErrorMessageType {
    linePos: {
        end: { line: 1; col: 1 }
        start: { line: 1; col: 1 }
    }
    message: string
    isWarning?: boolean
}

export const processForm = (
    monacoRef: any,
    code: string | undefined,
    resourceArr: unknown,
    changeStack?: {
        baseResources: any[]
        customResources: any[]
    },
    secrets?: (string | string[])[],
    immutables?: (string | string[])[],
    userEdits?: ChangeType[],
    validators?: any
) => {
    // get yaml, documents, resource, mapped
    let yaml = code || ''
    if (resourceArr) {
        if (!Array.isArray(resourceArr)) {
            resourceArr = [resourceArr]
        }
        if (Array.isArray(resourceArr)) {
            yaml = stringify(resourceArr)
        }
    }
    let documents: any[] = YAML.parseAllDocuments(yaml, { prettyErrors: true, keepCstNodes: true })
    let errors = getErrors(documents)
    const { parsed, resources } = getMappings(documents)

    // save a version of parsed for change comparison later in decorations--in this case for form changes
    const comparison = cloneDeep(parsed)

    // reconcile form changes with user changes
    if (errors.length === 0 && changeStack && userEdits) {
        const customResources = reconcile(changeStack, userEdits, resources)
        yaml = stringify(customResources)
        documents = YAML.parseAllDocuments(yaml, { prettyErrors: true, keepCstNodes: true })
        errors = getErrors(documents)
    }

    // and the rest
    return { comparison, ...process(monacoRef, yaml, documents, errors, secrets, [], immutables, validators) }
}

export const processUser = (
    monacoRef: any,
    yaml: string,
    secrets?: (string | string[])[],
    secretsValues?: SecretsValuesType[],
    immutables?: (string | string[])[],
    validators?: any
) => {
    // get yaml, documents, resource, mapped
    const documents: any[] = YAML.parseAllDocuments(yaml, { prettyErrors: true, keepCstNodes: true })
    const errors = getErrors(documents)
    const { parsed } = getMappings(documents)

    // save a version of parsed for change comparison later in decorations--in this case for user changes
    const comparison = cloneDeep(parsed)

    // and the rest
    return {
        comparison,
        ...process(monacoRef, yaml, documents, errors, secrets, secretsValues, immutables, validators),
    }
}

const process = (
    monacoRef: any,
    yaml: string,
    documents: any,
    errors: any[],
    secrets?: (string | string[])[],
    secretsValues?: SecretsValuesType[],
    immutables?: (string | string[])[],
    validators?: any
) => {
    // if parse errors, use previous hidden secrets
    const hiddenSecretsValues: any[] = errors.length === 0 ? [] : secretsValues ?? []

    // restore hidden secret values
    let { mappings, parsed, resources } = getMappings(documents)
    secretsValues?.forEach(({ path, value }) => {
        if (has(parsed, path)) {
            set(parsed, path, value)
        }
    })
    let changeWithSecrets = { yaml, mappings, parsed, resources, hiddenSecretsValues }

    // hide and remember secret values
    const protectedRanges: any[] = []
    if (secrets && !isEmpty(parsed) && !isEmpty(secrets)) {
        changeWithSecrets = {
            yaml,
            mappings: cloneDeep(mappings),
            parsed: cloneDeep(parsed),
            resources: cloneDeep(resources),
            hiddenSecretsValues,
        }

        // expand wildcards in declared secret paths
        const allSecrets: any = getAllPaths(secrets, mappings, parsed)

        // stuff secrets with '*******'
        allSecrets.forEach((secret: PropertyPath) => {
            const value = get(parsed, secret)
            if (value && typeof value === 'string') {
                hiddenSecretsValues.push({ path: secret, value })
                set(parsed, secret, `${'*'.repeat(Math.min(20, value.replace(/\n$/, '').length))}`)
            }
        })

        // create yaml with '****'
        yaml = stringify(resources)
        documents = YAML.parseAllDocuments(yaml, { keepCstNodes: true })
        ;({ mappings, parsed, resources } = getMappings(documents))

        // prevent typing on secrets
        allSecrets.forEach((secret: string | string[]) => {
            const value = get(mappings, getPathArray(secret))
            if (value && value.$v) {
                protectedRanges.push(new monacoRef.current.Range(value.$r, 0, value.$r + 1, 0))
                value.$s = true
            }
        })
    }

    // prevent typing on immutables
    if (immutables) {
        immutables.forEach((immutable) => {
            let allFlag = false
            if (Array.isArray(immutable)) {
                allFlag = immutable[immutable.length - 1] === '*'
                if (allFlag) {
                    immutable.pop()
                }
            } else {
                allFlag = immutable.endsWith('*')
                if (allFlag) {
                    immutable = immutable.slice(0, -2)
                }
            }
            const value = get(mappings, getPathArray(immutable))
            if (value && value.$v) {
                protectedRanges.push(new monacoRef.current.Range(value.$r, 0, value.$r + (allFlag ? value.$l : 1), 0))
            }
        })
    }

    if (errors.length === 0 && validators) {
        validate(validators, mappings, resources, errors)
    }

    return { yaml, protectedRanges, errors, change: { resources, mappings, parsed }, changeWithSecrets }
}

function validate(validators: any, mappings: { [name: string]: any[] }, resources: any[], errors: any[]) {
    const kindMap = {}
    const validatorMap = keyBy(validators, 'type')
    resources.forEach((resource) => {
        const kind = resource.kind
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
            validateResource(validator, mappings, [resource.kind, d], resource, errors)
            set(kindMap, resource.kind, d++)
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

function getMappings(documents: any[]) {
    const parsed: { [name: string]: any[] } = {}
    const mappings: { [name: string]: any[] } = {}
    const resources: any[] = []
    documents.forEach((document) => {
        if (!document?.errors.length) {
            const json = document.toJSON()
            if (json) {
                const key = json?.kind || 'root'
                let arr = mappings[key] || []
                const rangeObj: { [name: string]: MappingType } = {}
                const contents: any = document?.contents
                getMappingItems(contents?.items, rangeObj)
                arr.push(rangeObj)
                mappings[key] = arr
                arr = parsed[key] || []
                arr.push(json)
                parsed[key] = arr
                resources.push(json)
            }
        }
    })
    return { mappings, parsed, resources }
}

function getMappingItems(items: any[], rangeObj: { [name: string]: MappingType } | MappingType[]) {
    items?.forEach((item: any) => {
        const key = item?.key?.value || 'unknown'
        let value
        if (item.items || item.value) {
            if (item.items ?? item.value.items) {
                value = item?.value?.type === 'SEQ' ? [] : {}
                getMappingItems(item.items ?? item.value.items, value)
            } else {
                value = item?.value?.value || item?.value
            }
        }
        if (Array.isArray(rangeObj)) {
            const valuePos = item?.cstNode.rangeAsLinePos
            const firstRow = valuePos?.start.line ?? 1
            const lastRow = valuePos?.end.line ?? firstRow
            const length = Math.max(1, lastRow - firstRow)
            rangeObj.push({
                $k: `${rangeObj.length}`,
                $r: firstRow,
                $l: length,
                $v: value,
                $gv: valuePos,
            })
        } else if (item.key) {
            const keyPos = item.key.cstNode.rangeAsLinePos
            const valuePos = item?.value?.cstNode.rangeAsLinePos
            const firstRow = keyPos?.start.line ?? 1
            const lastRow = valuePos?.end.line ?? firstRow
            const length = Math.max(1, lastRow - firstRow)
            rangeObj[key] = {
                $k: key,
                $r: firstRow,
                $l: length,
                $v: value,
                $gk: keyPos,
                $gv: valuePos,
            }
        }
    })
}

export const getPathArray = (path: string[] | string) => {
    const pathArr: string[] = []
    if (!Array.isArray(path)) {
        path = path.replace(/\[/g, '.').replace(/\]./g, '.')
        path = path.split('.')
    }
    path.forEach((seg: any, idx: number) => {
        pathArr.push(seg)
        if (idx > 1 && idx < path.length - 1) {
            pathArr.push('$v')
        }
    })
    return pathArr
}

const getErrors = (documents: any[]) => {
    const errors: any[] = []
    documents.forEach((document: { errors: any[] }) => {
        document?.errors.forEach((error: { linePos: any; message: any }) => {
            const { linePos, message } = error
            errors.push({ linePos, message })
        })
    })
    return errors
}

export const stringify = (resources: any[]) => {
    const yamls: string[] = []
    resources.forEach((resource: any) => {
        if (!isEmpty(resource)) {
            let yaml = YAML.stringify(resource)
            yaml = yaml.replace(/'\d+':(\s|$)\s*/gm, '- ')
            yaml = yaml.replace(/:\s*null$/gm, ':')
            yamls.push(yaml)
        }
    })
    return yamls.join('---\n')
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

// if a path has a wildcard fill in the exact path
export const getPathLines = (
    paths: (string | string[])[],
    change: {
        mappings: { [name: string]: any[] }
        parsed: { [name: string]: any[] }
    }
) => {
    const pathLines: number[] = []
    const allPaths = getAllPaths(paths, change.mappings, change.parsed)
    allPaths.forEach((path) => {
        const value = get(change.mappings, getPathArray(path))
        if (value) {
            pathLines.push(value.$r)
        }
    })
    return pathLines
}

// if a path has a wildcard fill in the exact path
const getAllPaths = (
    paths: (string | any[])[],
    mappings: { [x: string]: string | any[] },
    parsed: { [x: string]: string | any[] }
) => {
    let allPaths: (string | any[])[] = []
    paths.forEach((path: string | any[]) => {
        if (Array.isArray(path)) {
            //
            // [Resource, '*', 'key', ...]
            //
            if (mappings[path[0]] && path[1] === '*') {
                Array.from(Array(mappings[path[0]].length)).forEach((_d, inx) => {
                    allPaths.push([path[0], inx, ...path.slice(2)])
                })
            }
            //
            // 'Resource[*].key']
            //
        } else if (path.includes('[*]')) {
            const arr = path.split('[*]')
            if (mappings[arr[0]]) {
                Array.from(Array(mappings[arr[0]].length)).forEach((_d, inx) => {
                    allPaths.push(`${arr[0]}[${inx}]${arr[1]}`)
                })
            }
            //
            // '*.key.key'
            //
        } else if (path.startsWith('*.')) {
            allPaths = [...allPaths, ...findAllPaths(parsed, path.substring(2))]
        } else {
            allPaths.push(path)
        }
    })
    return allPaths
}

const findAllPaths = (object: { [x: string]: any; hasOwnProperty?: any }, searchKey: string, parentKeys = '') => {
    let ret: any = []
    if (parentKeys.endsWith(searchKey)) {
        ret = [...ret, parentKeys]
    }
    Object.entries(object).forEach(([k, v]) => {
        if (typeof v === 'object' && v !== null) {
            let pk = k
            if (parentKeys) {
                pk = isNaN(parseInt(k)) ? `${parentKeys}.${k}` : `${parentKeys}[${k}]`
            }
            const o: any = findAllPaths(v, searchKey, pk)
            if (o != null && o instanceof Array) {
                ret = [...ret, ...o]
            }
        }
    })
    return ret
}
