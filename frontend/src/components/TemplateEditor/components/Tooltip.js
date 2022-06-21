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
    const { control, i18n, className } = this.props
    const { controlId, tooltip } = control
    return tooltip ? (
      <Popover
        id={`${controlId}-label-help-popover`}
        bodyContent={
          typeof tooltip === 'string' && typeof i18n === 'function' ? i18n(tooltip) : tooltip /* A component */
        }
      >
        <button
          id={`${controlId}-label-help-button`}
          aria-label="More info"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
          className={`pf-c-form__group-label-help ${className || ''}`}
        >
          <HelpIcon noVerticalAlign />
        </button>
      </Popover>
    ) : null
  }
}

export default Tooltip
