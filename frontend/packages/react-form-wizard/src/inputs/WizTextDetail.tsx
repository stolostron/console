import {
    Button,
    DescriptionListDescription,
    DescriptionListGroup,
    DescriptionListTerm,
    Split,
    SplitItem,
    Stack,
} from '@patternfly/react-core'
import { EyeIcon, EyeSlashIcon } from '@patternfly/react-icons'
import { Fragment, ReactNode, useState } from 'react'
import { Indented } from '../components/Indented'
import { useInputHidden, useValue } from './Input'

export function WizTextDetail(props: {
    id?: string
    label?: string
    path: string
    placeholder?: ReactNode
    secret?: boolean
    hidden?: (item: any) => boolean
    children?: ReactNode
}) {
    // TODO - Support hiding sercets
    // const [showSecrets, setShowSecrets] = useState(false)

    const [value] = useValue(props, '')
    const hidden = useInputHidden(props)
    const [showSecrets, setShowSecrets] = useState(!value)

    const stringValue = typeof value === 'string' ? value : ''
    if (hidden) return <Fragment />

    if (!props.label) {
        if (!value && props.placeholder) {
            return <span style={{ opacity: 0.7 }}>{props.placeholder}</span>
        }

        if (value === undefined) {
            return <Fragment />
        }

        return <Fragment>{value}</Fragment>
    }

    if (value === undefined) {
        return <Fragment />
    }

    return (
        <Stack>
            <DescriptionListGroup>
                <DescriptionListTerm>{props.label}</DescriptionListTerm>
                <DescriptionListDescription id={props.id} style={{ whiteSpace: 'pre-wrap' }}>
                    <Split>
                        <SplitItem isFilled>{props.secret && !showSecrets ? '****************' : stringValue}</SplitItem>
                        {props.secret && (
                            <SplitItem>
                                <Button variant="plain" style={{ marginTop: '-8px' }} onClick={() => setShowSecrets(!showSecrets)}>
                                    {showSecrets ? <EyeIcon /> : <EyeSlashIcon />}
                                </Button>
                            </SplitItem>
                        )}
                    </Split>
                </DescriptionListDescription>
            </DescriptionListGroup>
            {props.children && <Indented>{props.children}</Indented>}
        </Stack>
    )
}
