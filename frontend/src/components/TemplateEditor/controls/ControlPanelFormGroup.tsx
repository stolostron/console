/* Copyright Contributors to the Open Cluster Management project */
'use strict'

import React, { ReactNode } from 'react'
import { FormGroup, Popover } from '@patternfly/react-core'
import HelpIcon from '@patternfly/react-icons/dist/js/icons/help-icon'
import { useDynamicPropertyValues } from '../helpers/dynamicProperties'
import { TFunction } from 'react-i18next'

const ControlPanelFormGroup = (props: {
  children: ReactNode
  control: any
  controlData: any
  controlId: string
  showTip?: boolean
  i18n: TFunction
  hideLabel?: boolean
}) => {
  const { controlId, control, controlData, showTip, children, i18n, hideLabel } = props
  const { name, exception, opaque, tooltip, tip, validation = {}, icon } = control
  const { info } = useDynamicPropertyValues(control, controlData, i18n, ['info'])
  return (
    <React.Fragment>
      <div style={opaque ? { pointerEvents: 'none', opacity: 0.7 } : {}}>
        <FormGroup
          id={`${controlId}-label`}
          label={!hideLabel && name}
          isRequired={validation.required}
          fieldId={controlId}
          helperText={info}
          helperTextInvalid={exception}
          validated={exception ? 'error' : info ? 'default' : undefined}
          labelIcon={
            /* istanbul ignore next */
            tooltip ? (
              <Popover id={`${controlId}-label-help-popover`} bodyContent={tooltip}>
                <>
                  <button
                    id={`${controlId}-label-help-button`}
                    aria-label={i18n('More info')}
                    onClick={(e) => e.preventDefault()}
                    className="pf-c-form__group-label-help"
                  >
                    <HelpIcon noVerticalAlign />
                  </button>
                  {icon ? <div style={{ display: 'inline-block', marginLeft: '20px' }}>{icon}</div> : null}
                </>
              </Popover>
            ) : (
              <React.Fragment />
            )
          }
        >
          {children}
          {(showTip === undefined || showTip === true) && tip && <div style={{ fontSize: '14px' }}>{tip}</div>}
        </FormGroup>
      </div>
    </React.Fragment>
  )
}

export default ControlPanelFormGroup
