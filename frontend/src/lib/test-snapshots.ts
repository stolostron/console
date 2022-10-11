/* Copyright Contributors to the Open Cluster Management project */
import React from 'react'
import debounce from 'lodash/debounce'

if (process.env.NODE_ENV !== 'production') {
    const capitalize = (name: string) => {
        return name ? name.charAt(0).toUpperCase() + name.slice(1) : ''
    }

    const getSnapshot = (obj: any = {}, max?: number) => {
        interface IProto {
            name?: string
            displayName?: string
        }
        const mx = max || 10
        const funcSet = new Set<string>()
        const getReplacements = () => {
            const seen = new WeakSet()
            const filteredKeys = ['managedFields', 'annotations', 'finalizers']
            return (key: any, value: {} | null | undefined) => {
                if (value) {
                    const type = typeof value
                    switch (true) {
                        case filteredKeys.indexOf(key) !== -1:
                            return
                        case Array.isArray(value):
                            {
                                const array = value as Array<any>
                                if (array.length > mx) {
                                    return array.slice(0, mx)
                                }
                            }
                            break
                        case type === 'object':
                            if (seen.has(value)) {
                                return { ...value }
                            }
                            seen.add(value)
                            if (React.isValidElement(value)) {
                                const proto = value.type as IProto
                                return `__COMPONENT__${proto.name || proto.displayName}`
                            }
                            break
                        case type === 'function': {
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
        const snapshot = JSON.stringify(obj, getReplacements(), '  ')
            .replace(/"__FUNCTION__(.*)"/g, (_r, name) => {
                return name === 'i18n' ? '(k)=>k' : `mock${name}`
            })
            .replace(/"__COMPONENT__(.*)"/g, '</*$1*/></>')

        const mockFunctions: string[] = []
        const actualCallTimes: string[] = []
        const expectCallTimes: string[] = []

        Array.from(funcSet).forEach((name) => {
            mockFunctions.push(`const mock${name} = jest.fn()`)
            actualCallTimes.push(`    console.log(mockmock${name}.mock.calls.length)`)
            expectCallTimes.push(`//    expect(mock${name}).toHaveBeenCalledTimes(0)`)
        })
        return { snapshot, mockFunctions, actualCallTimes, expectCallTimes }
    }

    window.propsSnapshot = (props: any, className?: string, max?: number) => {
        const { snapshot, mockFunctions, expectCallTimes, actualCallTimes } = getSnapshot(props, max || 10)
        const snippet = `${mockFunctions.join('\n')}\n\n${actualCallTimes.join('\n')}\n\n${expectCallTimes.join(
            '\n'
        )}\n\nconst props = ${snapshot}`

        const snip: { [index: string]: string } = {}
        const key = className ? `${className}Props` : 'props'
        snip[key] = snippet
        console.log(snip)
    }

    window.recoilSnapshot = (recoil: any, stateName?: string, max?: number) => {
        const { snapshot } = getSnapshot(recoil, max || 10)
        const snippet = `\n\nsnapshot.set(${stateName}, mockRecoil${capitalize(
            stateName || ''
        )})\n\nconst mockRecoil${capitalize(stateName || '')} = ${snapshot}`

        const snip: { [index: string]: string } = {}
        const key = stateName ? `${stateName}State` : 'state'
        snip[key] = snippet
        console.log(snip)
    }

    //managedFields
    interface MethodData {
        name: string
        reqBody: string
        resBody: string
    }

    const getDataName = (
        dataMap: { [x: string]: { [x: string]: [MethodData] } },
        prefix: string,
        kind: string,
        reqBody: any,
        resBody: any
    ) => {
        let methodMap = dataMap[prefix]
        if (!methodMap) {
            methodMap = dataMap[prefix] = {}
        }
        ;({ snapshot: reqBody } = getSnapshot(reqBody, 5))
        if (resBody) {
            ;({ snapshot: resBody } = getSnapshot(resBody, 5))
        }
        const key = `${reqBody}\\\\${resBody}`
        let data = methodMap[key]
        if (!data) {
            data = methodMap[key] = <[MethodData]>(<unknown>[])
        }
        const name = `${prefix}${capitalize(kind)}${data.length + 1}`
        data.push({ name, reqBody, resBody })
        return name
    }

    const dumpData = (dataMap: { [x: string]: { [x: string]: [MethodData] } }) => {
        const dumpedData: string[] = []
        Object.values(dataMap).forEach((method) => {
            Object.values(method).forEach((data) => {
                data.forEach(({ name, reqBody, resBody }) => {
                    if (resBody) {
                        dumpedData.push(`const ${name} = {req: ${reqBody}, res: ${resBody}}`)
                    } else {
                        dumpedData.push(`const ${name} = {req: ${reqBody}}`)
                    }
                })
            })
        })
        return dumpedData
    }

    window.getNockLog = (fetches: { url: any; method: any; reqBody: any; resBody?: any }[]) => {
        const dataMap = {}
        const funcMocks: string[] = []
        const actionComments: string[] = []
        fetches.forEach(({ method, url, reqBody, resBody }) => {
            // get if local and what pathname is
            let isList = false
            let nockIgnoreRBAC = false
            const isSearch = url.indexOf('/search') !== -1
            const isLocalhost = !url.startsWith('http')
            let uri,
                pathname,
                origin = 'unknown',
                kind = 'unknown'
            if (isSearch) {
                kind = 'search'
            } else {
                if (isLocalhost) {
                    url = url.split('?')[0] // strip any queries
                    const [, rest] = url.split('/api') //assume they're all api calls
                    const parts = rest.split('/')
                    isList = parts.shift() === 's' // was '/apis'
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
                                    namespaces: name1,
                                    name: name2,
                                },
                            }
                        } else {
                            reqBody = {
                                apiVersion: version,
                                kind: `${kind1}`,
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

            let prefix = method.toLowerCase()
            switch (method) {
                case 'GET':
                    if (isLocalhost) {
                        if (isList) {
                            prefix = 'list'
                        } else {
                            prefix = 'get'
                        }
                    } else {
                        prefix = kind
                    }
                    break
                case 'POST':
                    if (kind === 'selfsubjectaccessreviews') {
                        nockIgnoreRBAC = true
                    } else if (isSearch) {
                        prefix = 'search'
                    } else {
                        prefix = 'create'
                    }
                    break
                case 'DELETE':
                    prefix = 'delete'
                    break
                case 'PATCH':
                    prefix = 'patch'
                    break
            }

            if (nockIgnoreRBAC) {
                funcMocks.unshift('    nockIgnoreRBAC()')
            } else {
                const dataName = getDataName(dataMap, prefix, kind, reqBody, resBody)
                switch (method) {
                    case 'GET':
                        if (isLocalhost) {
                            if (isList) {
                                funcMocks.push(`    nockList(${dataName}.req, ${dataName}.res)`)
                            } else {
                                funcMocks.push(`    nockGet(${dataName}.req, ${dataName}.res)`)
                            }
                        } else {
                            funcMocks.push(`    nock('${origin}').get('${pathname}').reply(200, ${dataName}.res)`)
                        }
                        break
                    case 'POST':
                        if (isSearch) {
                            funcMocks.push(`    nockSearch(${dataName}.req, ${dataName}.res)`)
                        } else {
                            funcMocks.push(`    nockCreate(${dataName}.req, ${dataName}.res)`)
                        }
                        break
                    case 'DELETE':
                        funcMocks.push(`    nockDelete(${dataName}.req, ${dataName}.res)`)
                        break
                    case 'PATCH':
                        funcMocks.push(`    nockPatch(${dataName}.req, ${dataName}.res)`)
                        // nockPatch(resource: IResource, data: unknown[] | unknown, response?: IResource )
                        break
                    case 'OPTION':
                        // nockOptions(resource: Resource, response?: IResource)==> no reqBody
                        break
                }
            }
        })
        return { dataMocks: dumpData(dataMap), funcMocks: funcMocks, actionComments }
    }

    window.nockSnapshot = (fetches: any) => {
        const { dataMocks, funcMocks, actionComments } = window.getNockLog(fetches)
        const snip: { [index: string]: { data: string; nocks: string } } = {}

        const key = 'nockShot'
        snip[key] = { data: dataMocks.join('\n'), nocks: funcMocks.join('\n') }
        console.log(snip)
    }

    const nockSnapshotDebounced = debounce(window.nockSnapshot, 1000)

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
                nockSnapshotDebounced(window.capturedFetches)
            }
            return res
        })
    }

    window.nockShots = () => {
        if (!window.originalFetch) {
            window.capturedFetches = []
            window.originalFetch = window.fetch
            window.fetch = overrideFetch
        }
    }
}
