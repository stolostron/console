/* Copyright Contributors to the Open Cluster Management project */

import { Button, ButtonProps } from '@patternfly/react-core'
import { Location, LocationDescriptor, LocationState } from 'history'

import { TooltipWrapper } from '../utils'

export function AcmButton(
    props: ButtonProps & {
        tooltip?: string | React.ReactNode
        to?:
            | LocationDescriptor<LocationState>
            | ((location: Location<LocationState>) => LocationDescriptor<LocationState>)
    }
) {
    const { isDisabled, tooltip, children, ...otherProps } = props
    return (
        <TooltipWrapper showTooltip={isDisabled && !!tooltip} tooltip={tooltip}>
            <Button {...otherProps} isAriaDisabled={isDisabled}>
                {children}
            </Button>
        </TooltipWrapper>
    )
}
