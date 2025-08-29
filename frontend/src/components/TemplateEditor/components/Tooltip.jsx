/* Copyright Contributors to the Open Cluster Management project */
'use strict'

import React from 'react'
import { Popover } from '@patternfly/react-core'
import HelpIcon from '@patternfly/react-icons/dist/js/icons/help-icon'
import PropTypes from 'prop-types'

class Tooltip extends React.PureComponent {
  static propTypes = {
    className: PropTypes.string,
    control: PropTypes.object.isRequired,
    i18n: PropTypes.func,
  }

  render() {
    const { control, className } = this.props
    const { controlId, tooltip } = control
    return tooltip ? (
      <Popover id={`${controlId}-label-help-popover`} bodyContent={tooltip}>
        <button
          id={`${controlId}-label-help-button`}
          aria-label="More info"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
          className={`pf-v5-c-form__group-label-help ${className || ''}`}
        >
          <HelpIcon noVerticalAlign />
        </button>
      </Popover>
    ) : null
  }
}

export default Tooltip
