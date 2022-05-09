/* Copyright Contributors to the Open Cluster Management project */
import YAML from 'yaml'
import { isEmpty, set, cloneDeep, has } from 'lodash'
import { getErrors, validate } from './validation'
import { getMatchingValues, getUidSiblings } from './synchronize'
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
    changeStack:
        | {
              baseResources: any[]
              customResources: any[]
          }
        | undefined,
    secrets: (string | string[])[] | undefined,
    showFilters: boolean,
    filters: (string | string[])[] | undefined,
    immutables: (string | string[])[] | undefined,
    userEdits: ChangeType[],
    validators: any
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

    // get initial parse syntaxErrors
    let documents: any[] = YAML.parseAllDocuments(yaml, { prettyErrors: true, keepCstNodes: true })
    let syntaxErrors = getErrors(documents)
    const { parsed, resources } = getMappings(documents)

    // save a version of parsed for change comparison later in decorations--in this case for form changes
    const comparison = cloneDeep(parsed)

    // reconcile form changes with user changes
    if (syntaxErrors.length === 0 && changeStack && userEdits) {
        const customResources = reconcile(changeStack, userEdits, resources)
        yaml = stringify(customResources)
        documents = YAML.parseAllDocuments(yaml, { prettyErrors: true, keepCstNodes: true })
        syntaxErrors = getErrors(documents)
    }

    // and the rest
    return {
        comparison,
        ...process(
            monacoRef,
            yaml,
            documents,
            syntaxErrors,
            secrets,
            [],
            showFilters,
            filters,
            [],
            immutables,
            validators
        ),
    }
}

export const processUser = (
    monacoRef: any,
    yaml: string,
    secrets: (string | string[])[] | undefined,
    cachedSecrets: CachedValuesType[] | undefined,
    showFilters: boolean,
    filters: (string | string[])[] | undefined,
    cacheFiltered: CachedValuesType[] | undefined,
    immutables: (string | string[])[] | undefined,
    validators: any
) => {
    // get yaml, documents, resource, mapped
    const documents: any[] = YAML.parseAllDocuments(yaml, { prettyErrors: true, keepCstNodes: true })
    const syntaxErrors = getErrors(documents)
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
            syntaxErrors,
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
    syntaxErrors: any[],
    secrets: (string | string[])[] | undefined,
    cachedSecrets: CachedValuesType[] | undefined,
    showFilters: boolean,
    filters: (string | string[])[] | undefined,
    cacheFiltered: CachedValuesType[] | undefined,
    immutables: (string | string[])[] | undefined,
    validators: any
) => {
    // restore hidden secret values
    let { mappings, parsed, resources, paths } = getMappings(documents)
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

    // if parse syntaxErrors, use previous hidden secrets
    const hiddenSecretsValues: any[] = []
    const hiddenFilteredValues: any[] = []
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
    let protectedRanges: any[] = []
    if (!isEmpty(parsed)) {
        // stuff secrets with '*******'
        let allSecrets = []
        if (secrets && !isEmpty(secrets)) {
            allSecrets = getMatchingValues(secrets, paths)
            allSecrets.forEach((value: { $p: string[]; $r: any; $l: any; $v: any }) => {
                if (value.$v && typeof value.$v === 'string') {
                    if (syntaxErrors.length === 0) hiddenSecretsValues.push({ path: value.$p, value })
                    set(parsed, value.$p, `${'*'.repeat(Math.min(20, value.$v.replace(/\n$/, '').length))}`)
                }
            })
        }

        // stuff filtered with '-filtered-'
        let allFiltered = []
        if (filters && !isEmpty(filters)) {
            allFiltered = getMatchingValues(filters, paths)
            if (!showFilters) {
                allFiltered.forEach((value: { $p: string[]; $r: any; $l: any; $v: any }) => {
                    if (value.$v && typeof value.$v === 'object') {
                        if (syntaxErrors.length === 0) hiddenFilteredValues.push({ path: value.$p, value: value.$v })
                        set(parsed, value.$p, undefined)
                    }
                })
            }
        }

        // create redacted yaml, etc
        yaml = stringify(resources)
        documents = YAML.parseAllDocuments(yaml, { keepCstNodes: true })
        ;({ mappings, parsed, resources, paths } = getMappings(documents))

        // prevent typing on redacted yaml
        ;[...allSecrets].forEach((value: { $r: any }) => {
            protectedRanges.push(new monacoRef.current.Range(value.$r, 0, value.$r + 1, 0))
            //value.$s = true
        })

        // add toggle button to filtered values
        ;[...allFiltered].forEach((value: { $r: any }) => {
            filteredRows.push(value.$r)
        })
    }

    // prevent typing on immutables
    if (immutables) {
        const allImmutables = getMatchingValues(immutables, paths)
        allImmutables.forEach((value: { $r: any; $l: any }) => {
            protectedRanges.push(new monacoRef.current.Range(value.$r, 0, value.$r + value.$l, 0))
        })
    }

    // prevent typing on uid and its siblings
    protectedRanges = [
        ...protectedRanges,
        ...getUidSiblings(paths).map((value) => {
            return new monacoRef.current.Range(value.$r, 0, value.$r + value.$l, 0)
        }),
    ]

    const validationErrors: any[] = []
    if (syntaxErrors.length === 0 && validators) {
        validate(validators, mappings, resources, validationErrors, syntaxErrors, protectedRanges)
    }

    if (syntaxErrors.length !== 0 && validationErrors.length !== 0 && cachedSecrets && cacheFiltered) {
        unredactedChange.hiddenSecretsValues = cachedSecrets
        unredactedChange.hiddenFilteredValues = cacheFiltered
    }

    return {
        yaml,
        protectedRanges,
        filteredRows,
        errors: { syntax: syntaxErrors, validation: validationErrors },
        change: { resources, mappings, parsed },
        unredactedChange,
    }
}

function getMappings(documents: any[]) {
    const parsed: { [name: string]: any[] } = {}
    const mappings: { [name: string]: any[] } = {}
    const resources: any[] = []
    const paths: { [name: string]: any[] } = {}
    documents.forEach((document) => {
        if (!document?.errors.length) {
            const json = document.toJSON()
            if (json) {
                const key = json?.kind || 'root'
                let arr = parsed[key] || []
                arr.push(json)
                parsed[key] = arr
                arr = mappings[key] || []
                const rangeObj: { [name: string]: MappingType } = {}
                const contents: any = document?.contents
                getMappingItems(
                    contents?.items,
                    rangeObj,
                    `${key}.${parsed[key].length - 1}`,
                    [key, `${parsed[key].length - 1}`],
                    paths
                )
                arr.push(rangeObj)
                mappings[key] = arr
                resources.push(json)
            }
        }
    })
    return { mappings, parsed, resources, paths }
}

function getMappingItems(
    items: any[],
    rangeObj: { [name: string]: MappingType } | MappingType[],
    parentKey: string,
    parentPath: string[],
    paths: { [name: string]: any } = {}
) {
    items?.forEach((item: any) => {
        const key = item?.key?.value || 'unknown'
        let value
        if (item.items || item.value) {
            if (item.items ?? item.value.items) {
                value = item?.value?.type === 'SEQ' ? [] : {}
                const pk = `${parentKey}${item?.key?.value ? `.${key}` : ''}`
                const pa = [...parentPath]
                if (item?.key?.value) {
                    pa.push(key)
                }
                getMappingItems(item.items ?? item.value.items, value, pk, pa, paths)
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
            paths[`${parentKey}.${rangeObj.length}`] = {
                $p: [...parentPath, rangeObj.length],
                $r: firstRow,
                $l: length,
                $v: value,
                $d: rangeObj,
            }
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
            paths[`${parentKey}.${key}`] = {
                $p: [...parentPath, key],
                $r: firstRow,
                $l: length,
                $v: value,
                $d: rangeObj,
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
