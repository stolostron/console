/* Copyright Contributors to the Open Cluster Management project */
'use strict'

import React from 'react'
import PropTypes from 'prop-types'
import { Button } from '@patternfly/react-core'

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

    const createPopupWindow = () => {
      window.open(`${window.location.origin}${url}`, `${id}`)
    }

    return (
      <React.Fragment>
        <div className="creation-view-controls-add-value-container bottom-right">
          <Button id={id} variant="link" onClick={createPopupWindow} icon={icon} iconPosition="right">
            {prompt}
          </Button>
        </div>
      </React.Fragment>
    )
  }
}

export default ControlPanelPrompt
