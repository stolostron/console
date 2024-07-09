/* Copyright Contributors to the Open Cluster Management project */

import { Button, ButtonProps } from '@patternfly/react-core'
import { TooltipWrapper } from '../utils'
import { LinkProps } from 'react-router-dom-v5-compat'

export function AcmButton(
  props: ButtonProps & {
    tooltip?: string | React.ReactNode
    to?: LinkProps['to']
    state?: LinkProps['state']
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
