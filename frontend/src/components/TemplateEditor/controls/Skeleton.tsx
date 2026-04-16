/* Copyright Contributors to the Open Cluster Management project */
'use strict'

import React from 'react'
import { Skeleton } from '@patternfly/react-core'
import { ControlPanelSkeletonProps } from '../types'

const ControlPanelSkeleton = (props: ControlPanelSkeletonProps) => {
  const { controlId, control } = props
  const { name } = control

  return (
    <React.Fragment>
      <div className="creation-view-controls-skeleton">
        <label className="creation-view-controls-textbox-title" htmlFor={controlId}>
          {name as React.ReactNode}
        </label>
        <Skeleton id={controlId} />
      </div>
    </React.Fragment>
  )
}

export default ControlPanelSkeleton
