/* Copyright Contributors to the Open Cluster Management project */


import { Tooltip, TooltipPosition } from '@patternfly/react-core'

export function TooltipWrapper(props: {
    children: React.ReactElement
    showTooltip?: boolean
    tooltip?: string | React.ReactNode
    tooltipPosition?: TooltipPosition
}) {
    return props.showTooltip ? (
        <Tooltip content={props.tooltip} position={props.tooltipPosition || TooltipPosition.top}>
            {props.children}
        </Tooltip>
    ) : (
        props.children
    )
}

export const onCopy = (event: React.ClipboardEvent<HTMLDivElement>, text: string) => {
    const clipboard = event.currentTarget.parentElement
    /* istanbul ignore else */
    if (clipboard) {
        const el = document.createElement('textarea')
        el.value = text
        clipboard.appendChild(el)
        el.select()
        document.execCommand('copy')
        clipboard.removeChild(el)
    }
}
