/* Copyright Contributors to the Open Cluster Management project */
import YAML from 'yaml'
import { isEmpty, get, set, cloneDeep, has, PropertyPath } from 'lodash'
import { getErrors, validate } from './validation'
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

// remove the kube stuff
const kube = ['managedFields', 'creationTimestamp', 'uid', 'livenessProbe', 'resourceVersion', 'generation']

export interface SecretsValuesType {
    path: string
    value: string
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
    filterResources?: boolean,
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

    // get initial parse errors
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
    return {
        comparison,
        ...process(monacoRef, yaml, documents, errors, secrets, [], filterResources, immutables, validators),
    }
}

export const processUser = (
    monacoRef: any,
    yaml: string,
    secrets?: (string | string[])[],
    secretsValues?: SecretsValuesType[],
    filterResources?: boolean,
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
        ...process(monacoRef, yaml, documents, errors, secrets, secretsValues, filterResources, immutables, validators),
    }
}

const process = (
    monacoRef: any,
    yaml: string,
    documents: any,
    errors: any[],
    secrets?: (string | string[])[],
    secretsValues?: SecretsValuesType[],
    filterResources?: boolean,
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
    const hideSecrets = secrets && !isEmpty(parsed) && !isEmpty(secrets)
    if (hideSecrets) {
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

        // filter kube resources
        if (filterResources) {
            resources = filterKubeResources(resources)
        }

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
    } else if (filterResources) {
        // filter kube resources
        resources = filterKubeResources(resources)
        yaml = stringify(resources)
        documents = YAML.parseAllDocuments(yaml, { keepCstNodes: true })
        ;({ mappings, parsed, resources } = getMappings(documents))
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

// filter kube resources
export const filterKubeResources = (resources: any[]) => {
    const _resources: any[] = []
    resources.forEach((resource: any) => {
        _resources.push(filterDeep(resource))
    })
    return _resources
}

const filterDeep = (resource: any) => {
    let newResource: { [index: string]: any | any[] }
    if (Array.isArray(resource)) {
        newResource = []
        Object.entries(resource || {}).forEach(([k, v]) => {
            if (!kube.includes(k)) {
                newResource.push(filter(v))
            }
        })
        return newResource
    } else {
        newResource = {}
        Object.entries(resource || {}).forEach(([k, v]) => {
            if (!kube.includes(k)) {
                newResource[k] = filter(v)
            }
        })
    }
    return newResource
}

const filter = (value: unknown) => {
    if (typeof value === 'object') {
        return filterDeep(value)
    }
    return value
}
