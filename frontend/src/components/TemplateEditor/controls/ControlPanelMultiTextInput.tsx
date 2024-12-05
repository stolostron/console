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
  Text,
  TextInput,
  TextVariants,
} from '@patternfly/react-core'
import { TFunction } from 'react-i18next'
import { PlusCircleIcon, TrashIcon } from '@patternfly/react-icons'
import ControlPanelFormGroup from './ControlPanelFormGroup'

const ControlPanelMultiTextInput = (props: {
  control: any
  controlData: any
  controlId: string
  handleChange: (value: object) => void
  i18n: TFunction
  addButtonText: string
}) => {
  const { controlId, i18n, control, controlData, handleChange, addButtonText } = props

  const onKeyChange = (index: number, newKey: string) => {
    control.controlData[index].active = newKey
    control.active.multitextEntries[index] = newKey
    handleChange(control)
  }

  const onNewKey = () => {
    const newMultitextMember = {
      id: controlId,
      type: 'multitextMember',
      active: '',
      validation: control.validation,
    }
    control.controlData.push(newMultitextMember)
    control.active.multitextEntries.push('')
    handleChange(control)
  }

  const onDeleteKey = (index: number) => {
    control.controlData.splice(index, 1)
    control.active.multitextEntries.splice(index, 1)
    handleChange(control)
  }

  return (
    <div className="creation-view-controls-textbox">
      <div>
        <Stack hasGutter>
          {control.controlData.map((multitextObject: any, index: number) => {
            const { validation, placeholder, name, tooltip } = control
            multitextObject.name = name
            multitextObject.tooltip = tooltip
            multitextObject.validation = validation
            let exception: any = undefined
            const innerControlId = `${controlId}-${index}`
            if (multitextObject?.active && validation?.contextTester) {
              exception = validation.contextTester(multitextObject?.active, controlData, undefined, i18n)
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
                            value={multitextObject.active || ''}
                            onChange={(value) => onKeyChange(index, value)}
                            required
                            validated={validated}
                            placeholder={placeholder}
                          />
                        </SplitItem>
                        {index > 0 && (
                          <SplitItem style={{ width: '2em' }}>
                            <Bullseye>
                              <Button
                                id="remove-item"
                                variant="plain"
                                onClick={() => onDeleteKey(index)}
                                style={{ alignSelf: 'start' }}
                              >
                                <TrashIcon />
                              </Button>
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
          isSmall
          onClick={onNewKey}
          icon={<PlusCircleIcon />}
        >
          <Text component={TextVariants.small}>{addButtonText ?? i18n('Add')}</Text>
        </Button>
      </div>
    </div>
  )
}

export default ControlPanelMultiTextInput
