/* Copyright Contributors to the Open Cluster Management project */
'use strict'

import React from 'react'
import PropTypes from 'prop-types'
import { Button, Flex, FlexItem, Label, LabelGroup, TextInput } from '@patternfly/react-core'
import ControlPanelFormGroup from './ControlPanelFormGroup'
import keyBy from 'lodash/keyBy'

export const DNS_LABEL = '[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?'
export const PREFIX = `${DNS_LABEL}(?:\\.${DNS_LABEL})*/`
export const NAME_OR_VALUE = '[a-z0-9A-Z](?:[a-z0-9A-Z_.-]{0,61}[a-z0-9A-Z])?'
export const regex = new RegExp(`^((?:${PREFIX})?${NAME_OR_VALUE})=(${NAME_OR_VALUE})?$`)
export const KEY_REGEX = new RegExp(`^(?:${PREFIX})?${NAME_OR_VALUE}$`)
export const VALUE_REGEX = new RegExp(`^${NAME_OR_VALUE}$`)
export const KEY_CAPTURE_GROUP_INDEX = 1
export const VALUE_CAPTURE_GROUP_INDEX = 2

class ControlPanelLabels extends React.Component {
  static propTypes = {
    control: PropTypes.object,
    controlData: PropTypes.array,
    controlId: PropTypes.string,
    handleChange: PropTypes.func,
    i18n: PropTypes.func,
  }

  constructor(props) {
    super(props)
    this.state = {
      keyDraft: '',
      valueDraft: '',
    }
  }

  getDraftException(keyDraft, valueDraft) {
    const { control, i18n } = this.props
    const { active = [] } = control
    if (!keyDraft && !valueDraft) {
      return ''
    }
    if (!KEY_REGEX.test(keyDraft)) {
      return i18n('enter.add.label')
    }
    if (valueDraft && !VALUE_REGEX.test(valueDraft)) {
      return i18n('enter.add.label')
    }
    const map = keyBy(active, 'key')
    if (map[keyDraft]) {
      return i18n('enter.duplicate.key', [keyDraft])
    }
    return ''
  }

  render() {
    const { controlId, i18n, control, controlData } = this.props
    const { active = [], exception } = control
    const { keyDraft, valueDraft } = this.state
    const validated = exception ? 'error' : undefined
    const keyInputId = `label-key-${controlId}`
    const valueInputId = `label-value-${controlId}`
    return (
      <React.Fragment>
        <div className="creation-view-controls-labels">
          <ControlPanelFormGroup i18n={i18n} controlId={controlId} control={control} controlData={controlData}>
            <div className="creation-view-controls-labels-container">
              <Flex
                className="creation-view-controls-labels-entry"
                spaceItems={{ default: 'spaceItemsSm' }}
                alignItems={{ default: 'alignItemsCenter' }}
              >
                <FlexItem grow={{ default: 'grow' }}>
                  <TextInput
                    id={keyInputId}
                    aria-label={i18n('Key')}
                    placeholder={i18n('Key')}
                    validated={validated}
                    value={keyDraft}
                    onKeyDown={this.handleKeyDown.bind(this)}
                    onChange={this.handleKeyChange.bind(this)}
                  />
                </FlexItem>
                <FlexItem grow={{ default: 'grow' }}>
                  <TextInput
                    id={valueInputId}
                    aria-label={i18n('Value')}
                    placeholder={i18n('Value')}
                    validated={validated}
                    value={valueDraft}
                    onKeyDown={this.handleKeyDown.bind(this)}
                    onChange={this.handleValueChange.bind(this)}
                  />
                </FlexItem>
                <FlexItem>
                  <Button variant="secondary" onClick={this.createLabel.bind(this)} id={`label-add-${controlId}`}>
                    {i18n('Add')}
                  </Button>
                </FlexItem>
              </Flex>
              {active.length > 0 && (
                <LabelGroup
                  className="creation-view-controls-labels-tag-container"
                  aria-label={control.name}
                  numLabels={active.length}
                >
                  {active.map(({ key, value: v }, inx) => {
                    const label = `${key}=${v}`
                    return (
                      <Label key={label} onClose={this.handleDelete.bind(this, inx)}>
                        {label}
                      </Label>
                    )
                  })}
                </LabelGroup>
              )}
            </div>
          </ControlPanelFormGroup>
        </div>
      </React.Fragment>
    )
  }

  handleDelete(inx) {
    const { control, handleChange } = this.props
    const { active = [] } = control
    active.splice(inx, 1)
    handleChange(control)
  }

  handleKeyChange(_event, keyDraft = '') {
    const { control } = this.props
    control.exception = this.getDraftException(keyDraft, this.state.valueDraft)
    this.setState({ keyDraft })
  }

  handleValueChange(_event, valueDraft = '') {
    const { control } = this.props
    control.exception = this.getDraftException(this.state.keyDraft, valueDraft)
    this.setState({ valueDraft })
  }

  handleKeyDown(event) {
    switch (event.key) {
      case 'Enter':
        event.preventDefault()
        this.createLabel()
        break

      case 'Escape':
        this.cancelLabel()
        break
    }
  }

  createLabel() {
    const { control, handleChange } = this.props
    const { active = [] } = control
    const { keyDraft, valueDraft } = this.state
    const exception = this.getDraftException(keyDraft, valueDraft)
    control.exception = exception
    if (!keyDraft || exception) {
      this.forceUpdate()
      return
    }
    active.push({
      key: keyDraft,
      value: valueDraft || '',
    })
    control.active = active
    handleChange(control)
    this.cancelLabel()
  }

  cancelLabel() {
    const { control } = this.props
    control.exception = ''
    this.setState({ keyDraft: '', valueDraft: '' })
  }
}

export default ControlPanelLabels
