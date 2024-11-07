/* Copyright Contributors to the Open Cluster Management project */
import { diff } from 'deep-diff'
import { uniqWith, get, isEqual, cloneDeep, groupBy, set, unset, omitBy, keyBy, isEmpty } from 'lodash'
import stringSimilarity from 'string-similarity'
import { ChangeType } from './changes'

interface IndexedType {
  __id__: number
}

export const reconcile = (
  changeStack: { baseResources: any[]; customResources: any[] },
  userEdits: ChangeType[],
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
  const { weakMap: weakCurrent, addedResources, removedSet } = mapResources(customResources, clonedCurrentFormResources)

  // else there's a match between all three
  // so find any changes between current and base and merge just those changes into custom
  const kindMap = {}
  customResources.forEach((resource, inx) => {
    let val, idx
    const kind = resource.kind
    let d: number = get(kindMap, kind, 0)
    const basePath: string[] = [kind, d]
    const base = weakBase.get(resource)
    const current = weakCurrent.get(resource)
    const diffs = diff(base, current)
    if (diffs) {
      diffs.forEach((diff: any) => {
        const { kind, item, path, rhs } = diff
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
              const userEdit = userEditsMap[JSON.stringify([...basePath, ...path])]
              if (!userEdit) {
                unset(resource, path)
              }
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

export const mapResources = (customResources: any[], formResources: any[]) => {
  const weakMap = new WeakMap()
  const usedSet = new WeakSet()
  const removedSet = new Set()

  // do everything in our power to find a reasonable match

  // first try matching everything by id (name/namespace/kind)
  customResources.forEach((resource) => {
    const resourceID = getResourceID(resource)
    if (resourceID) {
      // see if kind/name/namespace match
      const inx = formResources.findIndex((res: { kind: any }) => {
        return resourceID === getResourceID(res)
      })
      if (inx !== -1 && !weakMap.has(resource)) {
        // yes--use it
        weakMap.set(resource, formResources[inx])
        usedSet.add(formResources[inx])
      }
    }
  })

  // next try to match to another resource of it's kind if there's just one of that kind
  // if that fails match by a similarity between resources
  const groupByKind = groupBy(
    formResources.filter((resource) => !usedSet.has(resource)),
    'kind'
  )
  customResources.forEach((resource) => {
    if (!weakMap.has(resource) && resource.kind) {
      // try by resource kind
      const unusedForm: IndexedType[] = groupByKind[resource.kind]
      if (unusedForm?.length) {
        if (unusedForm.length === 1) {
          // if only one resource of that kind, assume that's the one
          weakMap.set(resource, unusedForm[0])
          usedSet.add(unusedForm[0])
        } else if (unusedForm.length > 1) {
          // else find the best json match in unused form resources of this type
          // don't compare encoded values
          const replacer = (_k: any, v: any) => {
            if (v?.length > 32) {
              try {
                Buffer.from(v, 'base64').toString('ascii')
                return ''
              } catch {}
            }
            return v
          }
          const matches = stringSimilarity.findBestMatch(
            JSON.stringify(resource, replacer),
            unusedForm.map((res) => {
              return JSON.stringify(res, replacer)
            })
          )
          const res = unusedForm.splice(matches?.bestMatchIndex ?? 0, 1)
          weakMap.set(resource, res[0])
          usedSet.add(res[0])
        } else {
          removedSet.add(resource)
        }
      } else {
        removedSet.add(resource)
      }
    }
  })
  const addedResources = formResources.filter((resource) => !usedSet.has(resource))
  return { weakMap, addedResources, removedSet }
}

export const getResourceID = (resource: { kind?: any }) => {
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
