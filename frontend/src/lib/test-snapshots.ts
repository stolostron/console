/* Copyright Contributors to the Open Cluster Management project */
import React from 'react'

if (process.env.NODE_ENV !== 'production') {
    const capitalize = (name: string) => {
        return name.charAt(0).toUpperCase() + name.slice(1)
    }

    const getSnapshot = (props: any, max: number) => {
        interface IProto {
            name?: string
            displayName?: string
        }
        const funcSet = new Set<string>()
        const getReplacements = () => {
            const seen = new WeakSet()
            return (key: any, value: {} | null | undefined) => {
                if (value) {
                    const type = typeof value
                    switch (true) {
                        case Array.isArray(value):
                            {
                                const array = value as Array<any>
                                if (array.length > max) {
                                    return array.slice(0, max)
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
        const snapshot = JSON.stringify(props, getReplacements(), '  ')
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
        )}\n\n  const props = ${snapshot}`

        const snip: { [index: string]: string } = {}
        const key = className ? `${className}Props` : 'props'
        snip[key] = snippet
        console.log(snip)
    }

    window.recoilSnapshot = (recoil: any, stateName?: string, max?: number) => {
        const { snapshot } = getSnapshot(recoil, max || 10)
        const snippet = `\n\n    snapshot.set(${stateName}, mockRecoil${capitalize(
            stateName || ''
        )})\n\n    const mockRecoil${capitalize(stateName || '')} = ${snapshot}`

        const snip: { [index: string]: string } = {}
        const key = stateName ? `${stateName}State` : 'state'
        snip[key] = snippet
        console.log(snip)
    }
}
