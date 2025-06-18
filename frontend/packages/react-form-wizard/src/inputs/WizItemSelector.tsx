import get from 'get-value'
import { Fragment, ReactNode, useContext } from 'react'
import { ItemContext } from '../contexts/ItemContext'

export function wizardSelectorItem(props: any, item: any[]) {
    return item.find((i) => {
        return get(i, props.selectKey) === props.selectValue
    })
}

export function WizItemSelector(props: { selectKey: string; selectValue: string; children?: ReactNode; empty?: ReactNode }) {
    const item = useContext(ItemContext)
    if (!Array.isArray(item)) return <Fragment>Input must be an array!</Fragment>

    const newItem = wizardSelectorItem(props, item)
    if (newItem === undefined) {
        if (props.empty) return <Fragment>{props.empty}</Fragment>
        return <Fragment></Fragment>
    }

    return <ItemContext.Provider value={newItem}>{props.children}</ItemContext.Provider>
}
