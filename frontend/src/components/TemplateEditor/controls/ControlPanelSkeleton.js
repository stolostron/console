'use strict'

import React from 'react'
import PropTypes from 'prop-types'
import { Skeleton } from '@patternfly/react-core'

class ControlPanelSkeleton extends React.Component {
  static propTypes = {
    control: PropTypes.object,
    controlId: PropTypes.string,
  }

  constructor(props) {
    super(props)
  }

  render() {
    const { controlId, control } = this.props
    const { name } = control

    return (
      <React.Fragment>
        <div className="creation-view-controls-skeleton">
          <label className="creation-view-controls-textbox-title" htmlFor={controlId}>
            {name}
          </label>
          <Skeleton id={controlId} />
        </div>
      </React.Fragment>
    )
  }
}

export default ControlPanelSkeleton
