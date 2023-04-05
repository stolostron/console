/* Copyright Contributors to the Open Cluster Management project */
import React from 'react'
import debounce from 'lodash/debounce'
import capitalize from 'lodash/capitalize'
import camelCase from 'lodash/camelCase'
import StackTrace from 'stacktrace-js'
//import { inspect } from 'util'
import path from 'path'

const hashCode = (str: string) => str.split('').reduce((s, c) => (Math.imul(31, s) + c.charCodeAt(0)) | 0, 0)
const defaultFilters = ['managedFields', 'finalizers', 'creationTimestamp', 'resourceVersion', 'generation', 'uid']
const getSnapshot = (obj: any, unfiltered: boolean, customFilters?: string[] | undefined, max?: number) => {
  interface IProto {
    name?: string
    displayName?: string
  }
  obj = obj || {}
  const mx = max || 5
  const funcSet = new Set<string>()
  const getReplacements = () => {
    const seen = new WeakSet()
    customFilters = Array.isArray(customFilters) ? customFilters : ([customFilters] as unknown as string[])
    const filteredKeys = unfiltered ? [] : [...defaultFilters, ...(customFilters || [])]
    const filterFunctions = filteredKeys.includes('__FUNCTION__')

    return (key: any, value: { continue?: any } | null | undefined) => {
      if (value) {
        const type = typeof value
        switch (true) {
          case filteredKeys.indexOf(key) !== -1:
            return
          case key.startsWith('__'):
            return
          case Array.isArray(value):
            {
              if (seen.has(value)) {
                return
              }
              seen.add(value)
              const array = value as Array<any>
              if (array.length > mx) {
                return array.slice(0, mx)
              }
            }
            break
          case type === 'object':
            if (seen.has(value)) {
              return
            }
            seen.add(value)
            if (key === 'metadata' && value.continue !== undefined) {
              return
            }
            if (React.isValidElement(value)) {
              return
            }
            break
          case type === 'function': {
            if (filterFunctions) {
              return
            }
            const isTrans = key === 'i18n' || key === 't'
            const proto = value as IProto
            if (proto.name) {
              const name = isTrans ? 'i18n' : capitalize(proto.name.replace('bound ', ''))
              if (!isTrans) funcSet.add(name)
              return `__FUNCTION__${name}`
            }
          }
        }
      }
      return value
    }
  }
  const snapshot = JSON.stringify(obj, getReplacements(), '  ').replace(/"__FUNCTION__(.*)"/g, (_r, name) => {
    return name === 'i18n' ? '(k)=>k' : `mock${name}`
  })

  const mockFunctions: string[] = []
  const actualCallTimes: string[] = []
  const expectCallTimes: string[] = []

  Array.from(funcSet).forEach((name) => {
    mockFunctions.push(`//const mock${name} = jest.fn()`)
    actualCallTimes.push(`//    console.log(mock${name}.mock.calls.length)`)
    expectCallTimes.push(`//    expect(mock${name}).toHaveBeenCalledTimes(0)`)
  })
  return { snapshot, mockFunctions, actualCallTimes, expectCallTimes }
}

export const removeCircular = (object: any) => {
  const seen = new WeakSet()
  const cleanCirculars = (obj: { [id: string]: object }, parent?: { [id: string]: object }, key?: string) => {
    if (obj instanceof Object) {
      if (!seen.has(obj)) {
        seen.add(obj)
        Object.entries(obj).forEach(([k, o]) => {
          cleanCirculars(o as { [id: string]: object }, obj, k)
        })
      } else if (parent && key) {
        delete parent[key]
      }
    }
  }
  cleanCirculars(object)
  return object
}

export const cleanResults = (obj: any, customFilters?: string[]) => {
  return JSON.parse(getSnapshot(obj, false, customFilters, 1000).snapshot)
}

const getSnippet = (snaps: string[], expects: string[]) => {
  const snippets = []
  snippets.push(...snaps)
  snippets.push('\n\n')
  snippets.push(...expects)
  return snippets.join('\n')
}

// window.propShot(props or this.props)
window.propShot = (props: any, customFilters?: string[], max?: number) => {
  if (process.env.NODE_ENV === 'production') {
    console.log('!!!! REMOVE propShot FROM CODE !!!!')
    return
  }
  if (process.env.NODE_ENV !== 'test') {
    const stack: StackTrace.StackFrame[] = StackTrace.getSync()
    const className = stack[1].getFunctionName().split('.')[0]
    const filters = [...(customFilters || []), ...['controlData']]
    const { snapshot, mockFunctions, expectCallTimes, actualCallTimes } = getSnapshot(props, false, filters, max || 10)
    const snippet = getSnippet(
      [...mockFunctions, `const props /*:PropType*/ = ${snapshot}`],
      ['\n\n', ...expectCallTimes, '\n\n', ...actualCallTimes]
    )
    const snip: { [index: string]: string } = {}
    const key = `${className}PropShot`
    snip[key] = snippet
    console.log(snip)
  }
}

window.coilShot = (recoil: any, stateName: string, customFilters?: string[], max?: number) => {
  if (process.env.NODE_ENV === 'production') {
    console.log('!!!! REMOVE coilShot FROM CODE !!!!')
    return
  }
  if (process.env.NODE_ENV !== 'test') {
    const stack: StackTrace.StackFrame[] = StackTrace.getSync()
    const className = stack[1].getFunctionName().split('.')[0]
    const dataName = `mock${capitalize(stateName.replace('State', '').replace('state', ''))}`
    const filters = [...(customFilters || []), ...['controlData']]
    const { snapshot } = getSnapshot(recoil, false, filters, max || 10)
    const snippets = []
    snippets.push(`//import {${stateName}} from '../../atoms'\n\n`)
    snippets.push(`//const ${dataName} = ${snapshot}\n\n`)
    snippets.push(`//   render(`)
    snippets.push(`    <RecoilRoot initializeState={(snapshot) => { snapshot.set(${stateName}, ${dataName}) }} >`)
    snippets.push(`        <${className} />`)
    snippets.push(`     </RecoilRoot>`)
    snippets.push(`//   )`)

    const snip: { [index: string]: string } = {}
    const key = `${stateName}CoilShot`
    snip[key] = snippets.join('\n')
    console.log(snip)
  }
}

// return window.funcShot([arg1, arg2], ret)
// //return original
window.funcShot = (args, ret, customFilters?: string[]) => {
  if (process.env.NODE_ENV === 'production') {
    console.log('!!!! REMOVE funcShot FROM CODE !!!!')
    return
  }
  if (process.env.NODE_ENV !== 'test') {
    const stack = StackTrace.getSync()
    const methodName = stack[1].getFunctionName()
    const fileName = path.parse(stack[1].getFileName()).name
    const apiName = camelCase(fileName)
    const snippets = []
    const filters = [...(customFilters || []), ...['__FUNCTION__']]
    const { snapshot: argShot } = getSnapshot(args, false, filters, 1000)
    const { snapshot: retShot } = getSnapshot(ret, false, filters, 1000)
    snippets.push(`//import * as ${apiName}API from './${fileName}'\n`)
    snippets.push(`//import { cleanResults } from '../../../lib/test-shots'\n`)
    snippets.push(`const ${methodName}={args: ${argShot}, ret: ${retShot}}\n`)
    snippets.push(`const ${methodName}Fn = jest.spyOn(${apiName}API, '${methodName}') as jest.Mock<any>`)
    snippets.push(`expect (cleanResults(${methodName}Fn(...${methodName}.args))).toEqual(${methodName}.ret)`)
    const snip: { [index: string]: string } = {}
    const key = `${methodName}FuncShot`
    snip[key] = snippets.join('\n')
    console.log(snip)
  }
  return ret
}

interface IKindData {
  key: number
  name: string
  reqBody: string
  resBody: string
  resource: string
  inlineComment: string
}

const getNockShotName = (
  dataMap: { [x: string]: { [x: string]: IKindData[] } },
  prefix: string,
  kind: string,
  testShot: { reqBody: any; resBody: any; resource: any },
  unfiltered: boolean,
  inlineComment: string
) => {
  let methodMap = dataMap[prefix]
  if (!methodMap) {
    methodMap = dataMap[prefix] = {}
  }
  let kindList: IKindData[] = methodMap[kind]
  if (!kindList) {
    kindList = methodMap[kind] = []
  }
  let { reqBody, resBody, resource } = testShot
  ;({ snapshot: reqBody } = getSnapshot(reqBody, unfiltered, undefined, 5))
  if (resBody) {
    ;({ snapshot: resBody } = getSnapshot(resBody, unfiltered, undefined, 5))
  }
  if (resource) {
    ;({ snapshot: resource } = getSnapshot(resource, unfiltered, undefined, 5))
  }
  const key = hashCode(`${reqBody}\\\\${resBody}`)
  const inx = kindList.findIndex((kind: IKindData) => {
    return kind.key === key
  })
  if (inx !== -1) {
    return kindList[inx].name
  } else {
    const name = `${prefix}${capitalize(kind)}${kindList.length + 1}`
    kindList.push({ key, name, reqBody, resBody, resource, inlineComment })
    return name
  }
}

const dumpNockShotData = (dataMap: { [x: string]: { [x: string]: [IKindData] } }) => {
  const dumpedData: string[] = []
  Object.values(dataMap).forEach((method) => {
    Object.values(method).forEach((data) => {
      data.forEach(({ name, reqBody, resBody, resource, inlineComment }) => {
        const beg = resource ? `req: ${resource}, ` : ''
        const mid = `${resource ? 'data' : 'req'}: ${reqBody}`
        const end = resBody ? `, res: ${resBody}` : ''
        dumpedData.push(`\n\n//---${inlineComment}---\nconst ${name} = {${beg} ${mid} ${end}}`)
      })
    })
  })
  return dumpedData
}

window.getNockShot = (fetches: { url: any; method: any; reqBody?: any; resBody?: any }[], unfiltered: boolean) => {
  const dataMap = {}
  const funcMocks: string[] = []
  let nockIgnoreRBAC = false
  let nockIgnoreApiPaths = false
  fetches.forEach(({ method, url, reqBody, resBody }) => {
    // get if local and what pathname is
    let isLocalhost
    let isList
    let prefix
    let inlineComment
    let kind
    let isSearch
    let resource
    let origin
    let pathname
    ;({ isLocalhost, isList, inlineComment, kind, isSearch, resource, origin, pathname, reqBody } = getResource(
      url,
      reqBody
    ))

    if (!url.endsWith('apiPaths')) {
      // eslint-disable-next-line prefer-const
      ;({ prefix, inlineComment } = getShotNamePrefixAndComment(
        method,
        isLocalhost,
        isList,
        inlineComment,
        kind,
        isSearch
      ))

      nockIgnoreRBAC = getNockShotFunctions(
        kind,
        getNockShotName,
        dataMap,
        prefix,
        reqBody,
        resBody,
        resource,
        unfiltered,
        inlineComment,
        method,
        isLocalhost,
        isList,
        funcMocks,
        origin,
        pathname,
        nockIgnoreRBAC,
        isSearch
      )
    } else {
      nockIgnoreApiPaths = true
    }
  })
  if (nockIgnoreRBAC) {
    funcMocks.unshift('    nockIgnoreRBAC()  //approve all RBAC checks')
  }
  if (nockIgnoreApiPaths) {
    funcMocks.unshift('    nockIgnoreApiPaths()  //ignore /apiPaths')
  }
  return { dataMocks: dumpNockShotData(dataMap), funcMocks: funcMocks }
}
const getNockShotFunctions = (
  kind: string,
  getNockShotName: (
    dataMap: { [x: string]: { [x: string]: IKindData[] } },
    prefix: string,
    kind: string,
    testShot: { reqBody: any; resBody: any; resource: any },
    unfiltered: boolean,
    inlineComment: string
  ) => string,
  dataMap: {},
  prefix: any,
  reqBody: any,
  resBody: any,
  resource: any,
  unfiltered: boolean,
  inlineComment: any,
  method: any,
  isLocalhost: boolean,
  isList: boolean,
  funcMocks: string[],
  origin: string,
  pathname: string | undefined,
  nockIgnoreRBAC: boolean,
  isSearch: boolean
) => {
  const dataName =
    kind === 'selfsubjectaccessreviews'
      ? 'ignore'
      : getNockShotName(dataMap, prefix, kind, { reqBody, resBody, resource }, unfiltered, inlineComment)
  switch (method) {
    case 'GET':
      if (isLocalhost) {
        if (isList) {
          funcMocks.push(`    nockList(${dataName}.req, ${dataName}.res)  // ${inlineComment}`)
        } else {
          funcMocks.push(`    nockGet(${dataName}.req, ${dataName}.res)   // ${inlineComment}`)
        }
      } else {
        funcMocks.push(`    nock('${origin}').get('${pathname}').reply(200, ${dataName}.res)`)
      }
      break
    case 'POST':
      if (kind === 'selfsubjectaccessreviews') {
        nockIgnoreRBAC = true
      } else if (isSearch) {
        funcMocks.push(`    nockSearch(${dataName}.req, ${dataName}.res)`)
      } else {
        funcMocks.push(`    nockCreate(${dataName}.req, ${dataName}.res)    // ${inlineComment}`)
      }
      break
    case 'DELETE':
      funcMocks.push(`    nockDelete(${dataName}.req, ${dataName}.res)    // ${inlineComment}`)
      break
    case 'PATCH':
      funcMocks.push(`    nockPatch(${dataName}.req, ${dataName}.data, ${dataName}.res)    // ${inlineComment}`)
      break
    case 'OPTION':
      // nockOptions(resource: Resource, response?: IResource)==> no reqBody
      break
  }
  return nockIgnoreRBAC
}

const getShotNamePrefixAndComment = (
  method: any,
  isLocalhost: boolean,
  isList: boolean,
  inlineComment: any,
  kind: string,
  isSearch: boolean
) => {
  let prefix = method.toLowerCase()
  switch (method) {
    case 'GET':
      if (isLocalhost) {
        if (isList) {
          prefix = 'list'
          inlineComment = `get all ${inlineComment}`
        } else {
          prefix = 'get'
          inlineComment = `get ${inlineComment}`
        }
      } else {
        prefix = 'get'
        inlineComment = `get ${kind} ${inlineComment}`
      }
      break
    case 'POST':
      if (isSearch) {
        prefix = 'search'
        inlineComment = `search ${inlineComment}`
      } else {
        prefix = 'create'
        inlineComment = `create ${inlineComment}`
      }
      break
    case 'DELETE':
      prefix = 'delete'
      inlineComment = `delete ${inlineComment}`
      break
    case 'PATCH':
      prefix = 'patch'
      inlineComment = `patch ${inlineComment}`
      break
  }
  return { prefix, inlineComment }
}

const getResource = (url: any, reqBody: any) => {
  let isList = false
  let inlineComment = ''
  let resource
  const isSearch = url.indexOf('/search') !== -1
  const isLocalhost = !url.startsWith('http')
  let uri,
    pathname,
    origin = 'unknown',
    kind = 'unknown'
  if (isSearch) {
    kind = 'search'
  } else {
    if (isLocalhost && !url.endsWith('apiPaths')) {
      url = url.split('?')[0] // strip any queries
      const [, rest] = url.split('/api') //assume they're all api calls
      const parts = rest.split('/')
      isList = parts.shift().endsWith('s') // was '/apis' or 'apiPaths' or anything plural
      let version // one or two part version?
      if (parts[0].startsWith('v')) {
        version = parts.shift()
      } else if (parts[1].startsWith('v')) {
        version = `${parts.shift()}/${parts.shift()}`
      }
      const [kind1, name1, kind2, name2] = parts
      if (!reqBody) {
        if (kind1 === 'namespaces') {
          reqBody = {
            apiVersion: version,
            kind: `${kind2}`,
            metadata: {
              namespace: name1,
              name: name2,
            },
          }
          inlineComment = `'${kind2}' in '${name1}' namespace`
        } else {
          reqBody = {
            apiVersion: version,
            kind: `${kind1}`,
          }
          inlineComment = `'${kind1 === 'projects' ? 'namespaces' : kind1}'`
        }
      } else {
        if (typeof reqBody === 'string') {
          reqBody = JSON.parse(reqBody)
        }
        if (Array.isArray(reqBody)) {
          resource = {
            apiVersion: version,
            kind: `${kind2}`,
            metadata: {
              namespace: name1,
              name: name2,
            },
          }
          if (kind1 === 'namespaces') {
            inlineComment = `'${kind2}' in '${name1}' namespace`
          } else {
            inlineComment = `'${kind1 === 'projects' ? 'namespaces' : kind1}'`
          }
        } else {
          const _kind = reqBody?.kind
          const _name = reqBody?.metadata?.name
          const _namespace = reqBody?.metadata?.namespace
          if (_namespace) {
            if (_name) {
              inlineComment = `'${_name}' ${_kind} in '${_namespace}' namespace`
            } else {
              inlineComment = `'${_kind}' in '${_namespace}' namespace`
            }
          } else {
            inlineComment = `'${_kind}'`
          }
        }
      }
      kind = kind2 || kind1
    } else {
      uri = url
      try {
        uri = new URL(url)
        origin = uri.origin
        kind = origin.split('.')[1]
        pathname = uri.pathname
      } catch {}
    }
  }
  return { isLocalhost, isList, inlineComment, kind, isSearch, resource, origin, pathname, url, reqBody }
}

const logNockShot = (fetches: any) => {
  const { dataMocks, funcMocks } = window.getNockShot(fetches, false)
  const snip: { [index: string]: string } = {}
  const snippet = `${dataMocks.join('\n')}\n\n${funcMocks.join('\n')}`
  snip['nockShot'] = snippet
  console.log(snip)
}

const logNockShotDebounced = debounce(logNockShot, 1000)

const overrideFetch = (url: any, options: any) => {
  const promise = window.originalFetch(url, options)
  return promise.then(async (res: any) => {
    if (url !== '/multicloud/authenticated') {
      // need to clone because .json() only reads once
      const response = res.clone()
      let resBody: string | undefined = undefined
      if (
        // Logs query sometimes loses response Content-Type header - so specifically looking for that url as well
        response.headers.get('content-type')?.includes('text/plain') ||
        (response.url.includes('/apis/proxy.open-cluster-management.io/v1beta1') &&
          response.url.endsWith('tailLines=1000'))
      ) {
        try {
          resBody = await response.text()
        } catch {}
      } else {
        try {
          resBody = await response.json()
        } catch {}
      }

      window.capturedFetches.push({ url, method: options.method, reqBody: options.body, resBody })
      logNockShotDebounced(window.capturedFetches)
    }
    return res
  })
}

window.nockShot = () => {
  if (process.env.NODE_ENV === 'production') {
    console.log('!!!! REMOVE nockShot FROM CODE !!!!')
    return
  }
  if (!window.originalFetch) {
    window.capturedFetches = []
    window.originalFetch = window.fetch
    window.fetch = overrideFetch
  }
}
