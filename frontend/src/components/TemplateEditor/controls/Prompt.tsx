/* Copyright Contributors to the Open Cluster Management project */
'use strict'

import React from 'react'
import { Button } from '@patternfly/react-core'
import { ControlPanelPromptProps, TemplateControl } from '../types'

const ControlPanelPrompt = (props: ControlPanelPromptProps) => {
  const { control } = props
  const { id, prompts = {} } = control
  const { type } = prompts as { type?: string }
  switch (type) {
    case 'link':
      return <React.Fragment key={id}>{renderLink(control)}</React.Fragment>
  }
  return null
}

function renderLink(control: TemplateControl) {
  const { prompts } = control
  const { prompt, url, icon, id } = (prompts || {}) as {
    prompt?: string
    url?: string
    icon?: React.ReactNode
    id?: string
  }

  const createPopupWindow = () => {
    window.open(`${window.location.origin}${url}`, `${id}`)
  }

  return (
    <React.Fragment>
      <div className="creation-view-controls-add-value-container bottom-right">
        <Button id={id} variant="link" onClick={createPopupWindow} icon={icon} iconPosition="right" size="sm">
          {prompt}
        </Button>
      </div>
    </React.Fragment>
  )
}

export default ControlPanelPrompt
