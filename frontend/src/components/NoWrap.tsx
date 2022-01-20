/* Copyright Contributors to the Open Cluster Management project */
import { CSSProperties, ReactNode } from 'react'

const style: CSSProperties = { whiteSpace: 'nowrap' }

export function NoWrap(props: { children: ReactNode; style?: CSSProperties }) {
    let s = style
    if (props.style) s = { ...style, ...props.style }
    return <span style={s}>{props.children}</span>
}
