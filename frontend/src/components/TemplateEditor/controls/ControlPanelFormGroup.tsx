/* Copyright Contributors to the Open Cluster Management project */
'use strict'

import React, { ReactNode } from 'react'
import { Button, FormGroup, Popover } from '@patternfly/react-core'
import HelpIcon from '@patternfly/react-icons/dist/js/icons/help-icon'
import { TFunction } from 'react-i18next'
import { ControlPanelHelperText } from './ControlPanelHelperText'

const ControlPanelFormGroup = (props: {
  children: ReactNode
  control: any
  controlData: any
  controlId: string
  omitHelperText?: boolean
  i18n: TFunction
  hideLabel?: boolean
}) => {
  const { controlId, control, controlData, omitHelperText = false, children, i18n, hideLabel } = props
  const { name, opaque, tooltip, validation = {}, icon } = control
  return (
    <React.Fragment>
      <div style={opaque ? { pointerEvents: 'none', opacity: 0.7 } : {}}>
        <FormGroup
          id={`${controlId}-label`}
          label={!hideLabel && name}
          isRequired={validation.required}
          fieldId={controlId}
          labelHelp={
            /* istanbul ignore next */
            tooltip ? (
              <Popover id={`${controlId}-label-help-popover`} bodyContent={tooltip}>
                <>
                  <Button
                    variant="plain"
                    id={`${controlId}-label-help-button`}
                    aria-label={i18n('More info')}
                    onClick={(e) => e.preventDefault()}
                    className="pf-v6-c-form__group-label-help"
                    icon={<HelpIcon />}
                  />
                  {icon ? <div style={{ display: 'inline-block', marginLeft: '20px' }}>{icon}</div> : null}
                </>
              </Popover>
            ) : (
              <React.Fragment />
            )
          }
        >
          {children}
          {!omitHelperText && (
            <ControlPanelHelperText control={control} controlData={controlData} controlId={controlId} i18n={i18n} />
          )}
        </FormGroup>
      </div>
    </React.Fragment>
  )
}

export default ControlPanelFormGroup
