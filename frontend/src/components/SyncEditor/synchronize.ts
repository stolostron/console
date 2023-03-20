/* Copyright Contributors to the Open Cluster Management project */
import get from 'lodash/get'
import set from 'lodash/set'
import { MappingType } from './process'

const immutableKeys = [
  'name',
  'namespace',
  'creationTimestamp',
  'generation',
  'managedFields',
  'resourceVersion',
  'uid',
]

// set form/wizard inputs to yaml changes
export const setFormValues = (
  syncs: unknown,
  resources: {
    parsed: { [x: string]: any[] }
  }
) => {
  if (Array.isArray(syncs)) {
    syncs.forEach(({ path, getter, setState }) => {
      let value = ''
      if (typeof path === 'string') {
        value = get(resources.parsed, path, '') as string
      } else if (typeof getter === 'function') {
        value = getter(resources.parsed)
      }
      setState(value ?? '')
    })
  }
}

export const getPathArray = (path: string[] | string) => {
  const pathArr: string[] = []
  if (path) {
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
  }
  return pathArr
}

// get all of the string siblings of a uid key
export const getUidSiblings = (paths: { [name: string]: any[] }, mappings: { [name: string]: MappingType[] }) => {
  const uidSiblings: any[] = []
  getMatchingValues([/.*\.uid$/], paths).forEach((value: { $d: any[] }) => {
    const parent = get(mappings, getPathArray(value?.$d))
    if (parent?.$v) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      Object.entries(parent.$v as MappingType).forEach(([_k, v]) => {
        if (immutableKeys.indexOf(v.$k) != -1) {
          uidSiblings.push(v)
        }
      })
    }
  })
  return uidSiblings
}

// for each user edit, update other values where it's referenced
export const crossReference = (paths: { [name: string]: any }) => {
  // create set of form paths that can't be overriden
  const xreferences: { value: any; references: { [name: string]: any[] } }[] = []
  const keys: string[] = ['name', 'namespace']
  keys.forEach((key: string) => {
    const matches = getMatchingValues([new RegExp(`.*\\.${key}$`)], paths)
    let values = matches
      .map((match: { $v: any }) => match.$v)
      .filter((match: string | any[]) => typeof match === 'string' && match.length)
    if (values.length) {
      values = values.sort((a = '', b = '') => {
        if (a.startsWith(b)) {
          return 1
        } else if (b.startsWith(a)) {
          return -1
        }
        return 0
      })
      const references: { [name: string]: any[] } = {}
      const set = { value: values[0], references }
      Object.values(paths).forEach((path: { $v: string; $p: any[] }) => {
        if (
          typeof path.$v === 'string' &&
          path.$v.length &&
          path.$v.startsWith(values[0]) &&
          !path.$p.includes('dependencies') &&
          !path.$p.includes('extraDependencies')
        ) {
          references[JSON.stringify(path.$p)] = path.$p
        }
      })
      xreferences.push(set)
    }
  })
  return xreferences
}

// for each user edit, update other values where it's referenced
export const updateReferences = (
  userEdits: any[],
  xreferences: { value: any; references: { [name: string]: any[] } }[],
  unredactedChange: {
    parsed: { [name: string]: any[] }
  }
) => {
  return userEdits.filter((edit) => {
    const path = JSON.stringify(edit.$p)
    return xreferences.every((xrefs) => {
      if (xrefs.references[path]) {
        const remaining = edit.$f.replace(xrefs.value, '')
        const change = edit.$u.replace(remaining, '')
        Object.values(xrefs.references).forEach((path) => {
          set(unredactedChange.parsed, path, change)
        })
        return false
      }
      return true
    })
  })
}

// if a path has a wildcard fill in the exact path
export const getMatchingValues = (search: (string | any[] | RegExp)[], paths: { [name: string]: any[] }) => {
  const values: any = []
  search.forEach((path: string | any[] | RegExp) => {
    if (Array.isArray(path)) {
      path = path.join('.')
    }
    if (typeof path === 'string' && path.indexOf('*') === -1) {
      values.push(paths[path])
    } else {
      let re: RegExp
      if (path instanceof RegExp) {
        re = path
      } else {
        re = new RegExp(`${path.replaceAll('.', '\\.').replaceAll('*', '.*')}$`, 'gi')
      }
      Object.entries(paths).forEach(([k, v]) => {
        if (re.test(k)) {
          values.push(v)
        }
        re.lastIndex = 0
      })
    }
  })
  return values
}
