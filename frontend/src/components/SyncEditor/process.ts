/* Copyright Contributors to the Open Cluster Management project */
import YAML from 'yaml'
import { isEmpty, get, set, cloneDeep, has } from 'lodash'
import { getErrors, validate } from './validation'
import { getAllPaths, getPathArray } from './synchronize'
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
    hiddenFilteredValues?: any[]
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

export interface CachedValuesType {
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
    showFilters?: boolean,
    filters?: (string | string[])[],
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
        ...process(monacoRef, yaml, documents, errors, secrets, [], showFilters, filters, [], immutables, validators),
    }
}

export const processUser = (
    monacoRef: any,
    yaml: string,
    secrets?: (string | string[])[],
    cachedSecrets?: CachedValuesType[],
    showFilters?: boolean,
    filters?: (string | string[])[],
    cacheFiltered?: CachedValuesType[],
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
        ...process(
            monacoRef,
            yaml,
            documents,
            errors,
            secrets,
            cachedSecrets,
            showFilters,
            filters,
            cacheFiltered,
            immutables,
            validators
        ),
    }
}

const process = (
    monacoRef: any,
    yaml: string,
    documents: any,
    errors: any[],
    secrets?: (string | string[])[],
    cachedSecrets?: CachedValuesType[],
    showFilters?: boolean,
    filters?: (string | string[])[],
    cacheFiltered?: CachedValuesType[],
    immutables?: (string | string[])[],
    validators?: any
) => {
    // if parse errors, use previous hidden secrets
    const hiddenSecretsValues: any[] = errors.length === 0 ? [] : cachedSecrets ?? []
    const hiddenFilteredValues: any[] = errors.length === 0 ? [] : cacheFiltered ?? []

    // restore hidden secret values
    let { mappings, parsed, resources } = getMappings(documents)
    cachedSecrets?.forEach(({ path, value }) => {
        if (has(parsed, path)) {
            set(parsed, path, value)
        }
    })

    // restore omitted filter values
    cacheFiltered?.forEach(({ path, value }) => {
        if (has(parsed, path)) {
            set(parsed, path, value)
        }
    })

    const unredactedChange = {
        yaml,
        mappings: cloneDeep(mappings),
        parsed: cloneDeep(parsed),
        resources: cloneDeep(resources),
        hiddenSecretsValues,
        hiddenFilteredValues,
    }

    // hide and remember secret values
    const filteredRows: number[] = []
    const protectedRanges: any[] = []
    if (!isEmpty(parsed)) {
        // stuff secrets with '*******'
        let allSecrets: { path: string | any[]; isRange: boolean }[] = []
        if (secrets && !isEmpty(secrets)) {
            allSecrets = getAllPaths(secrets, mappings, parsed)

            allSecrets.forEach(({ path }) => {
                const value = get(parsed, path) as unknown as string
                if (value && typeof value === 'string') {
                    hiddenSecretsValues.push({ path: path, value })
                    set(parsed, path, `${'*'.repeat(Math.min(20, value.replace(/\n$/, '').length))}`)
                }
            })
        }

        // stuff filtered with '-filtered-'
        let allFiltered: { path: string | any[]; isRange: boolean }[] = []
        if (filters && !isEmpty(filters)) {
            allFiltered = getAllPaths(filters, mappings, parsed)
            if (!showFilters) {
                allFiltered.forEach(({ path }) => {
                    const value = get(parsed, path) as unknown as string
                    if (value && typeof value === 'object') {
                        hiddenFilteredValues.push({ path: path, value })
                        set(parsed, path, undefined)
                    }
                })
            }
        }

        // create redacted yaml, etc
        yaml = stringify(resources)
        documents = YAML.parseAllDocuments(yaml, { keepCstNodes: true })
        ;({ mappings, parsed, resources } = getMappings(documents))

        // prevent typing on redacted yaml
        ;[...allSecrets].forEach(({ path }) => {
            const value = get(mappings, getPathArray(path))
            if (value && value.$v) {
                protectedRanges.push(new monacoRef.current.Range(value.$r, 0, value.$r + 1, 0))
                value.$s = true
            }
        })

        // add toggle button to filtered values
        ;[...allFiltered].forEach(({ path }) => {
            const value = get(mappings, getPathArray(path))
            if (value) {
                filteredRows.push(value.$r)
            }
        })
    }

    // prevent typing on immutables
    if (immutables) {
        const allImmutables = getAllPaths(immutables, mappings, parsed)
        allImmutables.forEach(({ path, isRange }) => {
            const value = get(mappings, getPathArray(path))
            if (value && value.$v !== undefined) {
                protectedRanges.push(new monacoRef.current.Range(value.$r, 0, value.$r + (isRange ? value.$l : 1), 0))
            }
        })
    }

    if (errors.length === 0 && validators) {
        validate(validators, mappings, resources, errors)
    }

    return { yaml, protectedRanges, filteredRows, errors, change: { resources, mappings, parsed }, unredactedChange }
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
                value = item?.value?.value ?? item?.value
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

// sort name/namespace to top
const sort = ['name', 'namespace']
const sortMapEntries = (a: { key: { value: string } }, b: { key: { value: string } }) => {
    let ai = sort.indexOf(a.key.value)
    if (ai < 0) ai = 5
    let bi = sort.indexOf(b.key.value)
    if (bi < 0) bi = 5
    return ai - bi
}

export const stringify = (resources: any[]) => {
    const yamls: string[] = []
    resources.forEach((resource: any) => {
        if (!isEmpty(resource)) {
            let yaml = YAML.stringify(resource, { sortMapEntries })
            yaml = yaml.replace(/'\d+':(\s|$)\s*/gm, '- ')
            yaml = yaml.replace(/:\s*null$/gm, ':')
            yamls.push(yaml)
        }
    })
    return yamls.join('---\n')
}
