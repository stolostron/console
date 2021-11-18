/* Copyright Contributors to the Open Cluster Management project */
import { diff } from 'deep-diff'
import { uniqWith, get, isEqual, cloneDeep, groupBy, set, unset, omitBy, keyBy, isEmpty } from 'lodash'
import stringSimilarity from 'string-similarity'

export const reconcile = (
    changeStack: { baseResources: any[]; customResources: any[] },
    userEdits: any[],
    resources: any[]
) => {
    let customResources = mergeResources(changeStack.customResources, changeStack.baseResources, userEdits, resources)

    // make sure there's no duplicates
    customResources = uniqWith(customResources, isEqual)
    changeStack.customResources = customResources
    changeStack.baseResources = resources
    return customResources
}

const mergeResources = (
    customResources: any[],
    baseFormResources: any[],
    userEdits: any[],
    currentFormResources: any
) => {
    //customResources = cloneDeep(customResources)
    const clonedCurrentFormResources = currentFormResources && cloneDeep(currentFormResources)
    if (currentFormResources) {
        clonedCurrentFormResources.forEach((res: { __inx__: any }, inx: any) => (res.__inx__ = inx))
    }
    const userEditsMap = keyBy(userEdits, (edit) => {
        return JSON.stringify(edit.$p)
    })

    // merging depends on matching custom resources to the previous form resources and the current form resources
    const { weakMap: weakBase } = mapResources(customResources, baseFormResources)
    const {
        weakMap: weakCurrent,
        addedResources,
        removedSet,
    } = mapResources(customResources, clonedCurrentFormResources)

    // else there's a match between all three
    // so find any changes between current and base and merge just those changes into custom
    const kindMap = {}
    customResources.forEach((resource: object, inx) => {
        let val, idx
        const kind = resource.kind
        let d: number = get(kindMap, kind, 0)
        const basePath: string[] = [kind, d]
        const base = weakBase.get(resource)
        const current = weakCurrent.get(resource)
        const diffs = diff(base, current)
        if (diffs) {
            diffs.forEach(({ kind, path, rhs, item }) => {
                if (path) {
                    switch (kind) {
                        // array modification
                        case 'A': {
                            switch (item.kind) {
                                case 'N':
                                    val = get(current, path, [])
                                    if (Array.isArray(val)) {
                                        set(resource, path, val)
                                    } else {
                                        val[Object.keys(val).length] = item.rhs
                                        set(resource, path, Object.values(val))
                                    }
                                    break
                                case 'D':
                                    val = get(current, path, [])
                                    if (Array.isArray(val)) {
                                        set(resource, path, val)
                                    } else {
                                        val = omitBy(val, (e) => e === item.lhs)
                                        set(resource, path, Object.values(val))
                                    }
                                    break
                            }
                            break
                        }
                        case 'E': {
                            idx = path.pop()
                            val = get(resource, path)
                            if (Array.isArray(val)) {
                                val.splice(idx, 1, rhs)
                            } else {
                                path.push(idx)

                                // don't let form change a user edit
                                const userEdit = userEditsMap[JSON.stringify([...basePath, ...path])]
                                if (!userEdit) {
                                    set(resource, path, rhs)
                                } else {
                                    userEdit.$f = rhs
                                }
                            }
                            break
                        }
                        case 'N': {
                            set(resource, path, rhs)
                            break
                        }
                        case 'D': {
                            unset(resource, path)
                            break
                        }
                    }
                } else if (kind === 'N' && !isEmpty(rhs)) {
                    customResources.splice(inx, 1, rhs)
                }
            })
        }
        set(kindMap, resource.kind, d++)
    })
    // add form additions
    if (addedResources.length) {
        customResources.push(...addedResources)
    }
    // remove form deletions
    if (removedSet.size) {
        customResources = customResources.filter((res) => !removedSet.has(res))
    }
    // then sort them to where the form wants them
    if (currentFormResources) {
        customResources.sort((a, b) => {
            return a.__inx__ - b.__inx__
        })
        customResources.forEach((res) => delete res.__inx__)
    }
    return customResources
}

const mapResources = (customResources: any[], formResources: any[]) => {
    const usedSet = new Set()
    const weakMap = new WeakMap()
    const removedSet = new Set()
    formResources.forEach((res: { __id__: any }, inx: any) => (res.__id__ = inx))

    // do everything in our power to find a reasonable match
    customResources.forEach((resource: object) => {
        let resourceID = getResourceID(resource)
        if (resourceID) {
            // see if kind/name/namespace match
            let inx = formResources.findIndex((res: { kind: any }) => {
                return resourceID === getResourceID(res)
            })
            if (inx !== -1 && !usedSet.has(formResources[inx].__inx__)) {
                // yes--use it
                weakMap.set(resource, formResources[inx])
            } else if (resource.kind) {
                // try by resource kind
                const groupByKind = groupBy(formResources, 'kind')
                let resources = groupByKind[resource.kind]
                if (resources?.length) {
                    resources = resources.filter(({ __inx__ }) => !usedSet.has(__inx__))
                    if (resources.length === 1) {
                        // if only one resource of that kind, assume that's the one
                        inx = formResources.findIndex(({ __id__ }) => __id__ === resources[0].__id__)
                        weakMap.set(resource, formResources[inx])
                    } else if (resources.length > 1) {
                        // else find the best json match
                        const matches = stringSimilarity.findBestMatch(
                            JSON.stringify(resource),
                            resources.map((res) => {
                                return JSON.stringify(res)
                            })
                        )
                        const res = resources.splice(matches?.bestMatchIndex ?? 0, 1)
                        inx = formResources.findIndex(({ __id__ }) => __id__ === res.__id__)
                        weakMap.set(resource, formResources[inx])
                    } else {
                        removedSet.add(resource)
                    }
                } else {
                    removedSet.add(resource)
                }
            }
            if (inx !== -1) {
                usedSet.add(formResources[inx].__id__)
            }
        }
    })
    const addedResources = formResources.filter(({ __id__ }) => !usedSet.has(__id__))
    formResources.forEach((res: { __id__: any }) => delete res.__id__)
    return { weakMap, addedResources, removedSet }
}

export const getResourceID = (resource: { kind: any }) => {
    return (
        get(resource, 'metadata.selfLink') ||
        (
            `/namespaces/${get(resource, 'metadata.namespace', 'none') || ''}/` +
            `${resource.kind}s/${get(resource, 'metadata.name') || ''}`
        ).toLowerCase()
    )
}

// if there are arrays make sure equal array entries line up
export const normalize = (lastParsed: { [x: string]: any[] }, parsed: { [x: string]: any[] }) => {
    Object.keys(lastParsed).forEach((key) => {
        if (parsed[key] && lastParsed[key].length !== parsed[key].length) {
            const oldKeys = keyBy(lastParsed[key], getResourceID)
            const newKeys = keyBy(parsed[key], getResourceID)

            // if an element added to array, compare it with an empty object
            Object.keys(newKeys).forEach((k, inx) => {
                if (!oldKeys[k]) {
                    lastParsed[key].splice(inx, 0, {})
                }
            })

            // if an element was deleted, compare it with nothing
            Object.keys(oldKeys).forEach((k, inx) => {
                if (!newKeys[k]) {
                    parsed[key].splice(inx, 0, null)
                }
            })
        }
    })
    Object.keys(parsed).forEach((key) => {
        if (!lastParsed[key]) {
            lastParsed[key] = [{}]
        }
    })
}
