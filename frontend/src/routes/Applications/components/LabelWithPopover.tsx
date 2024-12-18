/* Copyright Contributors to the Open Cluster Management project */

import { Label, Popover, PopoverPosition } from '@patternfly/react-core'
import { ReactNode, ReactElement } from 'react'
import '../css/ResourceLabels.css'

export function LabelWithPopover(props: {
  children?: ReactNode
  labelContent: string | ReactElement
  labelIcon?: string
  labelColor?: string
  popoverHeader?: string
  popoverPosition?: PopoverPosition
}) {
  return (
    <div className="label-with-popover">
      <Popover
        headerContent={props.popoverHeader}
        bodyContent={props.children}
        className="label-with-popover"
        enableFlip
        hasAutoWidth
        minWidth="18.75rem"
        maxWidth="30rem"
        position={props.popoverPosition || 'bottom'}
        flipBehavior={['bottom', 'top', 'right', 'left']}
        zIndex={999}
      >
        <Label
          onClick={(event) => {
            event.preventDefault()
            event.nativeEvent.preventDefault()
          }}
          color="grey"
          icon={props.labelIcon}
        >
          {props.labelContent}
        </Label>
      </Popover>
    </div>
  )
}

export default LabelWithPopover
