/* Copyright Contributors to the Open Cluster Management project */
import { ReactNode } from 'react'
import { usePluginProxy } from '../lib/usePluginProxy'
import { LoadData } from '../atoms'
import { LoadingPage } from './LoadingPage'

export function PluginData(props: { children?: ReactNode }) {
    const loaded = usePluginProxy()

    if (!loaded) return <LoadingPage />
    return <LoadData>{props.children}</LoadData>
}
