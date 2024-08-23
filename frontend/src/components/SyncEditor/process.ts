/* Copyright Contributors to the Open Cluster Management project */
import YAML from 'yaml'
import { isEmpty, set, unset, get, cloneDeep, has } from 'lodash'
import { getErrors, validate } from './validation'
import { getMatchingValues, getUidSiblings, crossReference, getPathArray } from './synchronize'
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
  $p: string | (string | number)[] // the path to the value in a parsed object
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
  readonly: boolean,
  userEdits: ChangeType[],
  validators: any,
  currentEditorValue: string,
  editableUidSiblings: boolean | undefined
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
  const { parsed, resources, paths } = getMappings(documents)

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
    xreferences: crossReference(paths),
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
      readonly,
      validators,
      currentEditorValue,
      false,
      editableUidSiblings
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
  readonly: boolean,
  validators: any,
  currentEditorValue: string,
  editableUidSiblings: boolean | undefined
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
      readonly,
      validators,
      currentEditorValue,
      true,
      editableUidSiblings
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
  readonly: boolean,
  validators: any,
  currentEditorValue: string,
  editorHasFocus: boolean,
  editableUidSiblings: boolean | undefined
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
  const unredactedChange: ProcessedType = cloneDeep({
    yaml,
    mappings: mappings,
    parsed: parsed,
    resources: resources,
  })
  const hiddenSecretsValues: any[] = []
  const hiddenFilteredValues: any[] = []
  unredactedChange.hiddenSecretsValues = hiddenSecretsValues
  unredactedChange.hiddenFilteredValues = hiddenFilteredValues

  // hide and remember secret values
  let allSecrets = []
  let allFiltered = []
  if (!isEmpty(parsed)) {
    // stuff secrets with '*******'
    if (secrets && !isEmpty(secrets)) {
      allSecrets = getMatchingValues(secrets, paths)
      allSecrets.forEach((value: { $p: string[] }) => {
        const v = get(parsed, value?.$p)
        if (v && typeof v === 'string') {
          if (syntaxErrors.length === 0) hiddenSecretsValues.push({ path: value.$p, value: v })
          set(parsed, value.$p, `${'*'.repeat(Math.min(20, v.replace(/\n$/, '').length))}`)
        }
      })
    }

    // stuff filtered with '-filtered-'
    if (filters && !isEmpty(filters)) {
      allFiltered = getMatchingValues(filters, paths)
      if (!showFilters) {
        allFiltered.forEach((value: { $p: string[] }) => {
          const v = get(parsed, value?.$p)
          if (v && typeof v === 'object') {
            if (syntaxErrors.length === 0) hiddenFilteredValues.push({ path: value.$p, value: v })
            set(parsed, value.$p, undefined)
          }
        })
      }
    }

    // create redacted yaml, etc
    yaml = editorHasFocus ? currentEditorValue : stringify(resources)
    documents = YAML.parseAllDocuments(yaml, { keepCstNodes: true })
    ;({ mappings, parsed, resources, paths } = getMappings(documents))
  }

  // add protected ranges for the yaml as it looks in the editor
  const filteredRows: number[] = []
  const protectedRanges: any[] = []
  if (!isEmpty(parsed)) {
    const allImmutables = immutables ? getMatchingValues(immutables, paths) : []
    const uidSiblings = editableUidSiblings ? [] : getUidSiblings(paths, mappings)
    ;[...allSecrets, ...uidSiblings, ...allImmutables].forEach((value) => {
      if (value && value.$p) {
        const range = get(mappings, getPathArray(value.$p))
        if (range?.$r) {
          protectedRanges.push(new monacoRef.current.Range(range.$r, 0, range.$r + range.$l, 0))
        }
      }
    })

    // // add toggle button to filtered values
    allFiltered.forEach((value: { $p: any }) => {
      const range = get(mappings, getPathArray(value.$p))
      if (range?.$r) {
        filteredRows.push(range.$r)
      }
    })
  }

  const validationErrors: any[] = []
  if (syntaxErrors.length === 0 && validators) {
    validate(validators, mappings, resources, validationErrors, syntaxErrors, protectedRanges)
  }

  if ((syntaxErrors.length !== 0 || validationErrors.length !== 0) && cachedSecrets && cacheFiltered) {
    unredactedChange.hiddenSecretsValues = cachedSecrets
    unredactedChange.hiddenFilteredValues = cacheFiltered
  }

  return {
    yaml,
    protectedRanges: readonly ? [] : protectedRanges,
    filteredRows,
    errors: { syntax: syntaxErrors, validation: validationErrors },
    change: { resources, mappings, parsed, paths },
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
        let arr = mappings[key] || []
        const rangeObj: { [name: string]: MappingType } = {}
        const contents: any = document?.contents
        const omitted: any[] = []
        getMappingItems(contents?.items, rangeObj, `${key}.${arr.length}`, [key, arr.length], false, paths, omitted)
        arr.push(rangeObj)
        mappings[key] = arr
        arr = parsed[key] || []
        arr.push(json)
        parsed[key] = arr
        resources.push(json)

        // if user is typing, make sure not to include
        // half finished expression in json
        omitted.forEach((path) => {
          const arr = get(parsed, path.slice(0, -1))
          if (Array.isArray(arr)) {
            arr.splice(path.pop(), 1)
          } else {
            unset(parsed, path)
          }
        })
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
  parentIsArray: boolean,
  paths: { [name: string]: any } = {},
  omitted: any[]
) {
  items?.forEach((item: any, inx: number) => {
    if (item) {
      const key = parentIsArray ? inx : item?.key?.value
      let value
      if (item.items || item.value) {
        if (item.items ?? item.value.items) {
          const isArray = item?.value?.type === 'SEQ'
          value = isArray ? [] : {}
          const pk = `${parentKey}.${key}`
          const pa = [...parentPath, key]
          getMappingItems(item.items ?? item.value.items, value, pk, pa, isArray, paths, omitted)
        } else {
          value = item?.value?.value ?? item?.value
        }
      }
      if (Array.isArray(rangeObj)) {
        const valuePos = item?.cstNode.rangeAsLinePos
        const firstRow = valuePos?.start.line ?? 1
        const lastRow = valuePos?.end.line ?? firstRow
        const length = Math.max(1, lastRow - firstRow)
        const path = [...parentPath, rangeObj.length - 1]
        rangeObj.push({
          $k: `${rangeObj.length}`,
          $p: path,
          $r: firstRow,
          $l: length,
          $v: value,
          $gv: valuePos,
        })
        paths[`${parentKey}.${rangeObj.length - 1}`] = {
          $p: path,
          $r: firstRow,
          $l: length,
          $v: value,
          $d: [...parentPath],
        }
      } else if (item.key) {
        const keyPos = item.key.cstNode.rangeAsLinePos
        const valuePos = item?.value?.cstNode.rangeAsLinePos
        const firstRow = keyPos?.start.line ?? 1
        const lastRow = valuePos?.end.line ?? firstRow
        const length = Math.max(1, lastRow - firstRow)
        const path = [...parentPath, key]
        rangeObj[key] = {
          $k: key,
          $p: path,
          $r: firstRow,
          $l: length,
          $v: value,
          $gk: keyPos,
          $gv: valuePos,
        }
        paths[`${parentKey}.${key}`] = {
          $p: path,
          $r: firstRow,
          $l: length,
          $v: value,
          $d: [...parentPath],
        }
      }
    } else {
      omitted.push([...parentPath, inx])
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
