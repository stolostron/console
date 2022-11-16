/* Copyright Contributors to the Open Cluster Management project */
'use strict'

import React from 'react'
import PropTypes from 'prop-types'
import { FormGroup, Popover } from '@patternfly/react-core'
import HelpIcon from '@patternfly/react-icons/dist/js/icons/help-icon'

class ControlPanelFormGroup extends React.Component {
    static propTypes = {
        children: PropTypes.node,
        control: PropTypes.object,
        controlId: PropTypes.string,
        showTip: PropTypes.bool,
        i18n: PropTypes.func,
    }

    render() {
        const { controlId, control, showTip, children, i18n } = this.props
        const { name, exception, opaque, tooltip, tip, validation = {}, icon, info } = control
        return (
            <React.Fragment>
                <div style={opaque ? { pointerEvents: 'none', opacity: 0.7 } : {}}>
                    <FormGroup
                        id={`${controlId}-label`}
                        label={name}
                        isRequired={validation.required}
                        fieldId={controlId}
                        helperText={info}
                        helperTextInvalid={exception}
                        validated={exception ? 'error' : info ? 'default' : ''}
                        labelIcon={
                            /* istanbul ignore next */
                            tooltip ? (
                                <Popover id={`${controlId}-label-help-popover`} bodyContent={tooltip}>
                                    <button
                                        id={`${controlId}-label-help-button`}
                                        aria-label={i18n('More info')}
                                        onClick={(e) => e.preventDefault()}
                                        className="pf-c-form__group-label-help"
                                    >
                                        <HelpIcon noVerticalAlign />
                                    </button>
                                    {icon ? (
                                        <div style={{ display: 'inline-block', marginLeft: '20px' }}>{icon}</div>
                                    ) : null}
                                </Popover>
                            ) : (
                                <React.Fragment />
                            )
                        }
                    >
                        {children}
                        {(showTip === undefined || showTip === true) && tip && (
                            <div style={{ fontSize: '14px' }}>{tip}</div>
                        )}
                    </FormGroup>
                </div>
            </React.Fragment>
        )
    }
}

export default ControlPanelFormGroup
