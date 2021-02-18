import { Button, ButtonProps, Popover } from '@patternfly/react-core'
import { Location, LocationDescriptor, LocationState } from 'history'
import HelpIcon from '@patternfly/react-icons/dist/js/icons/help-icon'
import React, { useState } from 'react'

export function AcmLoadingButton(
    props: ButtonProps & {
        tooltip?: string | React.ReactNode
        label?: string
        to?:
            | LocationDescriptor<LocationState>
            | ((location: Location<LocationState>) => LocationDescriptor<LocationState>)
    }
) {
    const { tooltip, children, ...otherProps } = props
    const [isLoading, setIsLoading] = useState(false)
    const isDisabled = isLoading || props.isDisabled
    return (
        <div>
            <Button
                {...otherProps}
                isAriaDisabled={isDisabled}
                spinnerAriaValueText={isLoading ? 'Loading' : undefined}
                isLoading={isLoading}
                isDisabled={isDisabled}
                onClick={async (event) => {
                    /* istanbul ignore else */
                    if (props.onClick) {
                        try {
                            await props.onClick(setIsLoading)
                        } catch (err) {
                            // Do Nothing
                        }
                    }
                }}
            >
                {props.label ? (isLoading ? props.processingLabel : props.label) : props.children}
            </Button>
            {tooltip && (
                <Popover id={`label-help-popover`} bodyContent={tooltip}>
                    <button
                        id={`-label-help-button`}
                        aria-label="More info"
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                        }}
                        className="pf-c-form__group-label-help"
                        style={{marginLeft: '5px'}}
                    >
                        <HelpIcon noVerticalAlign />
                    </button>
                </Popover>
            )}
        </div>
    )
}
