import { Fragment, ReactNode } from 'react'
import { useValue } from './Input'

export function WizItemText(props: { id?: string; path: string; placeholder?: ReactNode; isHorizontal?: boolean }) {
    const [value] = useValue(props, '')

    if (!value && props.placeholder) {
        return <span style={{ opacity: 0.7 }}>{props.placeholder}</span>
    }

    if (value === undefined) {
        return <Fragment />
    }

    if (Array.isArray(value)) {
        return (
            <Fragment>
                {value.map((v, index) => (
                    <span key={v}>
                        {index !== 0 ? ', ' : ''}
                        {v}
                    </span>
                ))}
            </Fragment>
        )
    }

    return <Fragment>{value}</Fragment>
}
