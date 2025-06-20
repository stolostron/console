import get from 'get-value'
import { Fragment, useEffect, useState } from 'react'
import set from 'set-value'
import { useData } from './contexts/DataContext'
import { useItem } from './contexts/ItemContext'
import { IResource } from './common/resource'

export function Sync(props: { kind: string; path: string; targetKind?: string; targetPath?: string; suffix?: string }) {
    const resources = useItem() as IResource[]
    const { update } = useData()
    const [value, setValue] = useState('')

    useEffect(() => {
        let changed = false
        const indices: Record<string, number> = {}
        if (!value) return
        for (const resource of resources) {
            if ((props.targetKind === undefined && resource.kind !== props.kind) || resource.kind === props.targetKind) {
                if (typeof value === 'string') {
                    let newValue = value
                    let index = indices[resource.kind ?? '']
                    if (!index) index = 0
                    index++
                    indices[resource.kind ?? ''] = index
                    // if (props.prefix) newValue = props.prefix + newValue
                    // if (props.addIndex) newValue = newValue + '-' + index.toString()
                    if (props.suffix) newValue += props.suffix
                    const existingValue = get(resource, props.targetPath ?? props.path)
                    if (existingValue !== newValue) {
                        changed = true
                        set(resource, props.targetPath ?? props.path, newValue, { preservePaths: false })
                    }
                }
            }
        }
        if (changed) update()
    }, [props.kind, props.path, props.suffix, props.targetKind, props.targetPath, resources, update, value])

    useEffect(() => {
        if (Array.isArray(resources)) {
            const resource = resources?.find((resource) => resource.kind === props.kind)
            if (resource) {
                const resourceValue = get(resource, props.path)
                if (resourceValue) {
                    if (value !== resourceValue) {
                        setValue(resourceValue)
                    }
                }
            } else if (value) {
                setValue('')
            }
        }
    }, [props.kind, props.path, resources, value])

    return <Fragment />
}

export function SyncCount(props: { kind: string; targetKind: string; newTarget: IResource }) {
    const resources = useItem() as IResource[]
    const { update } = useData()

    useEffect(() => {
        const sources = resources.filter((resource) => resource.kind === props.kind)
        const targets = resources.filter((resource) => resource.kind === props.targetKind)
        if (sources.length > targets.length) {
            // for (let i = 0; i < sources.length - targets.length; i++) {
            //     resources.push(props.newTarget)
            // }
            // update()
        } else if (sources.length < targets.length) {
            // for (let i = 0; i < targets.length - sources.length; i++) {
            //     resources.pop()
            // }
            // update()
        }
    }, [props.kind, props.newTarget, props.targetKind, resources, update])

    return <Fragment />
}
