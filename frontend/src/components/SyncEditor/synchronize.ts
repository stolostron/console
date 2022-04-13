/* Copyright Contributors to the Open Cluster Management project */
import get from 'lodash/get'
import { MappingType } from './process'

// set form/wizard inputs to yaml changes
export const setFormStates = (
    syncs: unknown,
    resources: {
        mappings: { [x: string]: any[] }
    }
) => {
    if (Array.isArray(syncs)) {
        syncs.forEach(({ path, setState }) => {
            path = getPathArray(path)
            const value = get(resources.mappings, path, {}) as unknown as MappingType
            setState(value.$v ?? '')
        })
    }
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
export const getAllPaths = (
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
