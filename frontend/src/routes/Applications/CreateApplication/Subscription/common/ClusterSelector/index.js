// Copyright (c) 2020 Red Hat, Inc. All Rights Reserved.
// Copyright Contributors to the Open Cluster Management project
'use strict'

import { Fragment, Component } from 'react'
import PropTypes from 'prop-types'
import { AcmTextInput } from '../../../../../../ui-components'
import {
  Radio,
  FormGroup,
  Accordion,
  AccordionItem,
  AccordionContent,
  Popover,
  Button,
  ButtonVariant,
} from '@patternfly/react-core'
import PlusCircleIcon from '@patternfly/react-icons/dist/js/icons/plus-circle-icon'
import TimesCircleIcon from '@patternfly/react-icons/dist/js/icons/times-circle-icon'
import HelpIcon from '@patternfly/react-icons/dist/js/icons/help-icon'
import { Tooltip } from '../../../../../../components/TemplateEditor'
import _ from 'lodash'
import './style.css'

const activeModeStr = 'active.mode'

export class ClusterSelector extends Component {
  static propTypes = {
    control: PropTypes.object,
    controlId: PropTypes.string,
    handleChange: PropTypes.func,
    locale: PropTypes.string,
  }

  constructor(props) {
    super(props)
    this.state = { isExpanded: true }
    if (_.isEmpty(this.props.control.active)) {
      if (!this.props.control.showData || this.props.control.showData.length === 0) {
        this.props.control.active = {
          mode: false,
          clusterLabelsList: [{ id: 0, labelName: '', labelValue: '', validValue: false }],
          clusterLabelsListID: 1,
        }
      } else {
        //display existing placement rule
        this.props.control.active = {
          mode: false,
          clusterLabelsList: this.props.control.showData,
          clusterLabelsListID: this.props.control.showData.length,
        }
      }
    }
    this.props.control.validation = this.validation.bind(this)
  }

  render() {
    const { controlId, locale, control, i18n } = this.props
    const { name, active, validation = {} } = control
    const modeSelected = active && active.mode === true
    const isExistingRule = _.get(this.props, 'control.showData', []).length > 0
    const isReadOnly = isExistingRule || !modeSelected
    const hasLabels = _.get(active, 'clusterLabelsList.0.labelValue') !== ''

    return (
      <Fragment>
        <div className="creation-view-controls-labels">
          <div>
            {name}
            {validation.required ? <div className="creation-view-controls-required">*</div> : null}
            <Tooltip control={control} locale={locale} />
          </div>

          <div className="clusterSelector-container" style={{ fontSize: '14px', position: 'relative' }}>
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
            <div style={{ display: 'flex', alignItems: 'center' }} onClick={this.handleMode}>
              <Radio
                className="clusterSelector-checkbox"
                isChecked={modeSelected}
                isDisabled={isExistingRule}
                id={`clusterSelector-checkbox-${controlId}`}
                onChange={this.handleMode}
              />
              <FormGroup
                id="clusterSelector-container"
                label={i18n('creation.app.settings.clusterSelector')}
                labelIcon={
                  /* istanbul ignore next */

                  <Popover
                    id={`${controlId}-label-help-popover`}
                    bodyContent={i18n('creation.app.settings.selectorClusters.config')}
                  >
                    <Button
                      variant="plain"
                      id={`${controlId}-label-help-button`}
                      aria-label="More info"
                      onClick={(e) => e.preventDefault()}
                      className="pf-c-form__group-label-help"
                    >
                      <HelpIcon noVerticalAlign />
                    </Button>
                  </Popover>
                }
              />
            </div>
            <div style={!modeSelected ? { pointerEvents: 'none', opacity: 0.3 } : {}}>
              <Accordion style={{ display: 'block' }}>
                <AccordionItem>
                  <AccordionContent>
                    <div className="clusterSelector-labels-section">
                      <div
                        className="labels-section"
                        style={{ display: 'block' }}
                        id={`clusterSelector-labels-section-${controlId}`}
                      >
                        {this.renderClusterLabels(control, isReadOnly, controlId, i18n)}
                        {hasLabels && (
                          <Button
                            isDisabled={isReadOnly}
                            variant={ButtonVariant.link}
                            onClick={() => this.addLabelToList(control, !isReadOnly)}
                            icon={<PlusCircleIcon />}
                            isSmall
                          >
                            {i18n('creation.app.settings.selectorClusters.prop.add')}
                          </Button>
                        )}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </div>
      </Fragment>
    )
  }

  validation(exceptions) {
    const { control, i18n } = this.props
    if (_.get(control, activeModeStr, false)) {
      const labelNameSet = new Set()
      control.active.clusterLabelsList.map((item) => {
        const { id, labelName, validValue } = item
        const invalidLabel = (validValue || id === 0) && (!labelName || labelName.length === 0)

        // Add exception if no input for labels or values
        if (invalidLabel) {
          exceptions.push({
            row: 1,
            text: i18n('creation.missing.clusterSelector.label'),
            type: 'error',
            controlId: `labelName-${id}`,
          })
        }
        if (labelNameSet.has(labelName)) {
          exceptions.push({
            row: 1,
            text: i18n('creation.duplicate.clusterSelector.label', [labelName]),
            type: 'error',
            controlId: `labelName-${id}`,
          })
        }
        labelNameSet.add(labelName)
      })
    }
  }

  renderClusterLabels = (control, isReadOnly, controlId, i18n) => {
    if (!_.get(control, 'active.clusterLabelsList')) {
      return ''
    }
    return (
      control.active &&
      control.active.clusterLabelsList.map((item) => {
        const { id, labelName, labelValue, validValue } = item

        if (validValue || id === 0) {
          return (
            <Fragment key={id}>
              <div className="matching-labels-container" style={{ display: 'flex', marginBottom: '20px' }}>
                <div
                  className="matching-labels-input"
                  style={{ maxWidth: '45%', marginRight: '10px', overflow: 'hidden' }}
                >
                  <AcmTextInput
                    id={`labelName-${id}-${controlId}`}
                    className="text-input"
                    label={id === 0 ? i18n('clusterSelector.label.field.ui') : ''}
                    value={labelName === '' ? '' : labelName}
                    placeholder={i18n('clusterSelector.label.placeholder.field')}
                    isDisabled={isReadOnly}
                    onChange={(value) => this.handleChange(value, 'labelName', id)}
                    isRequired
                  />
                </div>
                <div className="matching-labels-input">
                  <AcmTextInput
                    id={`labelValue-${id}-${controlId}`}
                    className="text-input"
                    label={id === 0 ? i18n('clusterSelector.value.field.ui') : ''}
                    value={labelValue === '' ? '' : labelValue}
                    placeholder={i18n('clusterSelector.value.placeholder.field')}
                    isDisabled={isReadOnly}
                    onChange={(value) => this.handleChange(value, 'labelValue', id)}
                  />
                </div>

                {id !== 0 ? ( // Option to remove added labels
                  <Button
                    id={id}
                    isDisabled={isReadOnly}
                    variant={ButtonVariant.link}
                    onClick={() => this.removeLabelFromList(control, item, isReadOnly)}
                    aria-label={i18n('Remove label')}
                    icon={<TimesCircleIcon />}
                    isSmall
                  />
                ) : (
                  ''
                )}
              </div>
            </Fragment>
          )
        }
        return ''
      })
    )
  }

  addLabelToList = (control, modeSelected) => {
    if (modeSelected) {
      // Create new "label" item
      control.active.clusterLabelsList.push({
        id: control.active.clusterLabelsListID,
        labelName: '',
        labelValue: '',
        validValue: true,
      })
      control.active.clusterLabelsListID++

      // Update UI
      this.forceUpdate()
    }
  }

  removeLabelFromList = (control, item, isReadOnly) => {
    if (!isReadOnly) {
      // Removed labels are no longer valid
      control.active.clusterLabelsList[item.id].validValue = false

      // Update UI and yaml editor
      this.forceUpdate()
      this.handleChange({})
    }
  }

  handleMode = () => {
    const { control, handleChange } = this.props
    const { active } = control
    if (active) {
      active.mode = true
    }

    handleChange(control)
  }

  handleChange(value, targetName, targetID) {
    const { control, handleChange } = this.props

    if (targetName) {
      const { active } = control
      const { clusterLabelsList } = active
      if (clusterLabelsList && clusterLabelsList[targetID]) {
        if (targetName === 'labelName') {
          clusterLabelsList[targetID].labelName = value
        } else if (targetName === 'labelValue') {
          clusterLabelsList[targetID].labelValue = value
        }
        clusterLabelsList[targetID].validValue = true
      }
    }
    handleChange(control)
  }
}

export default ClusterSelector

export const summarize = (control, controlData, summary) => {
  const { clusterLabelsList } = control.active || {}
  if (clusterLabelsList && _.get(control, 'type', '') !== 'hidden' && _.get(control, activeModeStr)) {
    clusterLabelsList.forEach(({ labelName, labelValue }) => {
      if (labelName && labelValue) {
        summary.push(`${labelName}=${labelValue}`)
      }
    })
  }
}

export const summary = (control) => {
  const { clusterLabelsList } = control.active || {}
  if (clusterLabelsList && _.get(control, 'type', '') !== 'hidden' && _.get(control, activeModeStr)) {
    const labels = []
    clusterLabelsList.forEach(({ labelName, labelValue }) => {
      if (labelName && labelValue) {
        labels.push(`${labelName}=${labelValue}`)
      }
    })
    return [
      {
        term: 'Selector labels',
        desc: labels.join(', '),
      },
    ]
  }
}
