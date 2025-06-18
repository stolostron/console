import { Stack } from '@patternfly/react-core'
import { Fragment, ReactNode, useContext } from 'react'
import { ItemContext } from '../contexts/ItemContext'

export function Indented(props: {
    id?: string
    children?: ReactNode
    hidden?: (item: any) => boolean
    paddingTop?: number
    paddingBottom?: number
}) {
    const { paddingBottom, paddingTop } = props
    const item = useContext(ItemContext)

    if (!props.children) return <Fragment />

    const hidden = props.hidden ? props.hidden(item) : false
    if (hidden) return <Fragment />

    return (
        <Stack id={props.id} hasGutter style={{ paddingLeft: 22, paddingBottom, paddingTop }}>
            {props.children}
        </Stack>
    )
}
