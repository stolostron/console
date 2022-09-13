/* Copyright Contributors to the Open Cluster Management project */
import { ReactNode } from 'react'
import { LoadData } from '../atoms'

export function PluginData(props: { children?: ReactNode }) {
    return (
        <LoadData>{props.children}</LoadData>
    )
}
