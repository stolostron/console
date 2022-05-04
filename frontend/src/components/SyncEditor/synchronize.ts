/* Copyright Contributors to the Open Cluster Management project */
import get from 'lodash/get'
import { MappingType } from './process'

// set form/wizard inputs to yaml changes
export const setFormValues = (
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
export const getMatchingValues = (search: (string | any[] | RegExp)[], paths: { [name: string]: any[] }) => {
    const values: any = []
    search.forEach((path: string | any[] | RegExp) => {
        if (typeof path === 'string') {
            path = path.replaceAll('.', '%')
        } else if (Array.isArray(path)) {
            path = path.join('%')
        }
        if (typeof path === 'string' && path.indexOf('*') === -1) {
            values.push(paths[path])
        } else {
            const re = path instanceof RegExp ? path : new RegExp(`${path.replaceAll('*', '.*')}$`, 'gi')
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
