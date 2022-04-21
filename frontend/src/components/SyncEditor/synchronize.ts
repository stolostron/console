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
export const getAllPaths = (
    paths: (string | any[])[],
    mappings: { [x: string]: string | any[] },
    parsed: { [x: string]: string | any[] }
) => {
    let allPaths: { path: string | any[]; isRange: boolean }[] = []
    paths.forEach((path: string | any[]) => {
        // if ends with *, include all objects below this path
        let isRange = false
        if (Array.isArray(path)) {
            isRange = path[path.length - 1] === '*'
            if (isRange) {
                path.pop()
            }
        } else {
            isRange = path.endsWith('*')
            if (isRange) {
                path = path.slice(0, path.endsWith('.*') ? -2 : -1)
            }
        }
        if (Array.isArray(path)) {
            //
            // [Resource, '*', 'key', ...]
            //
            if (mappings[path[0]] && path[1] === '*') {
                Array.from(Array(mappings[path[0]].length)).forEach((_d, inx) => {
                    if (Array.isArray(path)) {
                        allPaths.push({ path: [path[0], inx, ...path.slice(2)], isRange })
                    }
                })
            }
            //
            // 'Resource[*].key']
            //
        } else if (path.includes('[*]')) {
            // if ends with *, include all objects below this path
            const arr = path.split('[*]')
            if (mappings[arr[0]]) {
                Array.from(Array(mappings[arr[0]].length)).forEach((_d, inx) => {
                    allPaths.push({ path: `${arr[0]}[${inx}]${arr[1]}`, isRange })
                })
            }
            //
            // '*.key.key'
            //
        } else if (path.startsWith('*.')) {
            allPaths = [...allPaths, ...findAllPaths(parsed, path.substring(2), isRange)]
        } else {
            allPaths.push({ path, isRange })
        }
    })
    return allPaths
}

const findAllPaths = (
    object: { [x: string]: any; hasOwnProperty?: any },
    searchKey: string,
    isRange: boolean,
    parentKeys = ''
) => {
    let ret: any[] = []
    if (parentKeys.endsWith(searchKey)) {
        ret = [...ret, { path: parentKeys, isRange }]
    }
    Object.entries(object).forEach(([k, v]) => {
        if (v !== null) {
            let pk, o
            switch (typeof v) {
                case 'object':
                    pk = k
                    if (parentKeys) {
                        pk = isNaN(parseInt(k)) ? `${parentKeys}.${k}` : `${parentKeys}[${k}]`
                    }
                    o = findAllPaths(v, searchKey, isRange, pk)
                    if (o != null && o instanceof Array) {
                        ret = [...ret, ...o]
                    }
                    break
                case 'string':
                    if (`${parentKeys}.${k}`.endsWith(searchKey)) {
                        ret = [...ret, { path: `${parentKeys}.${k}`, isRange }]
                    }
                    break
            }
        }
    })
    return ret
}
