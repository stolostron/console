'use strict'

import React from 'react'
import PropTypes from 'prop-types'

class ControlPanelPrompt extends React.Component {
  static propTypes = {
    control: PropTypes.object,
    i18n: PropTypes.func,
  }

  render() {
    const { control } = this.props
    const { id, prompts = {} } = control
    const { type } = prompts
    switch (type) {
      case 'link':
        return <React.Fragment key={id}>{this.renderLink(control)}</React.Fragment>
    }
    return null
  }

  renderLink(control) {
    const { prompts } = control
    const { prompt, url, icon, id } = prompts
    const { i18n } = this.props
    const text = i18n(prompt)

    const createPopupWindow = () => {
      window.open(`${window.location.origin}${url}`, `${id}`)
    }

    return (
      <React.Fragment>
        <div className="creation-view-controls-add-value-container bottom-right">
          <div
            id={id}
            className="creation-view-controls-add-button"
            tabIndex="0"
            role={'button'}
            onClick={createPopupWindow}
            onKeyPress={createPopupWindow}
          >
            {text}
            {icon}
          </div>
        </div>
      </React.Fragment>
    )
  }
}

export default ControlPanelPrompt
