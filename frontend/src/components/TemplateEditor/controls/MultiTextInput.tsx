/* Copyright Contributors to the Open Cluster Management project */
'use strict'

import {
  Bullseye,
  Button,
  Flex,
  FlexItem,
  Split,
  SplitItem,
  Stack,
  StackItem,
  Content,
  TextInput,
  ContentVariants,
} from '@patternfly/react-core'
import { PlusCircleIcon, TrashIcon } from '@patternfly/react-icons'
import ControlPanelFormGroup from './FormGroup'
import { ControlPanelBaseProps, MultitextActiveState, TemplateControl } from '../types'

const ControlPanelMultiTextInput = (
  props: ControlPanelBaseProps & { handleChange: (value: TemplateControl) => void; addButtonText: string }
) => {
  const { controlId, i18n, control, controlData, handleChange, addButtonText } = props
  const childControls = control.controlData ?? []
  const multitextActive = control.active as MultitextActiveState

  const onKeyChange = (index: number, newKey: string) => {
    childControls[index].active = newKey
    multitextActive.multitextEntries[index] = newKey
    handleChange(control)
  }

  const onNewKey = () => {
    const newMultitextMember: TemplateControl = {
      id: controlId,
      type: 'multitextMember',
      active: '',
      validation: control.validation,
    }
    childControls.push(newMultitextMember)
    multitextActive.multitextEntries.push('')
    handleChange(control)
  }

  const onDeleteKey = (index: number) => {
    childControls.splice(index, 1)
    multitextActive.multitextEntries.splice(index, 1)
    handleChange(control)
  }

  return (
    <div className="creation-view-controls-textbox">
      <div>
        <Stack hasGutter>
          {childControls.map((multitextObject: TemplateControl, index: number) => {
            const { validation, placeholder, name, tooltip } = control
            multitextObject.name = name
            multitextObject.tooltip = tooltip
            multitextObject.validation = validation
            let exception: any = undefined
            const innerControlId = `${controlId}-${index}`
            const cellVal = String(multitextObject?.active ?? '')
            if (cellVal && validation?.contextTester) {
              exception = validation.contextTester(cellVal, controlData, undefined, i18n)
            }
            const validated = exception ? 'error' : undefined
            return (
              <StackItem style={{ width: '100%' }} key={`${controlId}-${index + 1}`}>
                <ControlPanelFormGroup
                  hideLabel={index > 0}
                  i18n={i18n}
                  controlId={innerControlId}
                  control={multitextObject}
                  controlData={controlData}
                >
                  <Flex>
                    <FlexItem style={{ width: '100%' }}>
                      <Split hasGutter>
                        <SplitItem style={{ width: index > 0 ? '96%' : '100%' }}>
                          <TextInput
                            id={`text-${innerControlId}`}
                            value={String(multitextObject.active ?? '')}
                            onChange={(_event, value) => onKeyChange(index, value)}
                            required
                            validated={validated}
                            placeholder={placeholder}
                          />
                        </SplitItem>
                        {index > 0 && (
                          <SplitItem style={{ width: '2em' }}>
                            <Bullseye>
                              <Button
                                icon={<TrashIcon />}
                                id="remove-item"
                                variant="plain"
                                onClick={() => onDeleteKey(index)}
                                style={{ alignSelf: 'start' }}
                              />
                            </Bullseye>
                          </SplitItem>
                        )}
                      </Split>
                    </FlexItem>
                  </Flex>
                </ControlPanelFormGroup>
              </StackItem>
            )
          })}
        </Stack>
      </div>
      <div>
        <Button
          style={{ padding: '.5em 0 .5em 0' }}
          id="add-button"
          variant="link"
          size="sm"
          onClick={onNewKey}
          icon={<PlusCircleIcon />}
        >
          <Content component={ContentVariants.small}>{addButtonText ?? i18n('Add')}</Content>
        </Button>
      </div>
    </div>
  )
}

export default ControlPanelMultiTextInput
