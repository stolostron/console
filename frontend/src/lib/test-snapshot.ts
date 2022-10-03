/* Copyright Contributors to the Open Cluster Management project */
import React from 'react'

if (process.env.NODE_ENV !== 'production') {
    window.objectSnapshot = (props: any) => {
        interface IProto {
            name?: string
            displayName?: string
        }
        const funcSet = new Set<string>()
        const capitalize = (name: string) => {
            return name.charAt(0).toUpperCase() + name.slice(1)
        }
        const getReplacements = () => {
            const seen = new WeakSet()
            return (key: any, value: {} | null | undefined) => {
                if (value) {
                    const type = typeof value
                    switch (true) {
                        case Array.isArray(value):
                            {
                                const array = value as Array<any>
                                if (array.length > 10) {
                                    return array.slice(0, 10)
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
        const expectCallTimes: string[] = []
        Array.from(funcSet).forEach((name) => {
            mockFunctions.push(`const mock${name} = jest.fn()`)
            expectCallTimes.push(`    expect(mock${name}).toHaveBeenCalledTimes(0)`)
        })

        console.log(`${mockFunctions.join('\n')}\n\n${expectCallTimes.join('\n')}\n\n  const props = ${snapshot}`)
    }
}
