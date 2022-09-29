/* Copyright Contributors to the Open Cluster Management project */

import React from 'react'

if (process.env.NODE_ENV !== 'production') {
    window.logObject = (props: any) => {
        interface IType {
            name?: string
            displayName?: string
        }
        const getLogReplacer = () => {
            const seen = new WeakSet()
            return (_key: any, value: {} | null | undefined) => {
                if (typeof value === 'object' && value !== null) {
                    if (seen.has(value)) {
                        return { ...value }
                    }
                    seen.add(value)
                    if (React.isValidElement(value)) {
                        const type = value.type as IType
                        return `__COMPONENT__${type.name || type.displayName}`
                    }
                }
                if (typeof value === 'function') {
                    return `__FUNCTION__${value.name}`
                }
                return value
            }
        }
        console.log(
            '  const props = ' +
                JSON.stringify(props, getLogReplacer(), '  ')
                    .replace(/"__FUNCTION__(.*)"/g, '()=>{} /*$1*/')
                    .replace(/"__COMPONENT__(.*)"/g, '</*$1*/></>')
        )
    }
}
