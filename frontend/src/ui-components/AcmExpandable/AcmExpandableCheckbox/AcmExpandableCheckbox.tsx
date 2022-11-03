/* Copyright Contributors to the Open Cluster Management project */

import { Checkbox } from '@patternfly/react-core'
import { AngleDownIcon, AngleRightIcon } from '@patternfly/react-icons'
import { ReactNode } from 'react'
import { AcmLabels } from '../../AcmLabels'

export function AcmExpandableCheckbox(props: {
    label: string
    children: ReactNode
    expanded: boolean
    checked: boolean | null
    onToggle: (expanded: boolean) => void
    onCheck: (checked: boolean | null) => void
    additionalLabels?: string[] | Record<string, string>
    isDisabled?: boolean
    expandable?: boolean
    id?: string
}) {
    return (
        <div>
            <button
                id={`${props.id}-toggle` || ''}
                style={{ border: '0px', backgroundColor: 'white', visibility: props.expandable ? 'visible' : 'hidden' }}
                onClick={() => props.onToggle(props.expanded)}
            >
                {!props.expanded && <AngleRightIcon />}
                {props.expanded && <AngleDownIcon />}
            </button>
            <span style={{ paddingRight: '10px' }}>
                <Checkbox
                    isChecked={props.checked}
                    id={`${props.id}-checkbox` || ''}
                    name={`${props.id}-checkbox` || ''}
                    onChange={() => props.onCheck(props.checked)}
                    isDisabled={props.isDisabled}
                />
            </span>
            {props.label}
            {props.additionalLabels && (
                <span style={{ paddingLeft: '10px' }}>
                    <AcmLabels labels={props.additionalLabels} />
                </span>
            )}
            <div hidden={!props.expanded}>{props.children}</div>
        </div>
    )
}
