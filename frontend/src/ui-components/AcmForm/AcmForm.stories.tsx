/* Copyright Contributors to the Open Cluster Management project */

import { ActionGroup, PageSection } from '@patternfly/react-core'
import { SelectOption } from '@patternfly/react-core'
import { Meta } from '@storybook/react'
import { useState } from 'react'
import { AcmAlertGroup } from '../AcmAlert/AcmAlert'
import { AcmFormSection } from '../AcmFormSection/AcmFormSection'
import { AcmKubernetesLabelsInput } from '../AcmLabelsInput/AcmLabelsInput'
import { AcmMultiSelect } from '../AcmMultiSelect/AcmMultiSelect'
import { AcmPage, AcmPageContent, AcmPageHeader } from '../AcmPage/AcmPage'
import { AcmSelect } from '../AcmSelect/AcmSelect'
import { AcmTextArea } from '../AcmTextArea/AcmTextArea'
import { AcmTextInput } from '../AcmTextInput/AcmTextInput'
import { AcmNumberInput } from '../AcmNumberInput/AcmNumberInput'
import { AcmForm, AcmSubmit } from './AcmForm'

const meta: Meta = {
  title: 'Form',
  component: AcmForm,
  includeStories: ['Form'],
}
export default meta

export function Form() {
  return (
    <AcmPage header={<AcmPageHeader title="AcmForm" />}>
      <AcmPageContent id="form">
        <PageSection variant="light">
          <FormStory />
        </PageSection>
      </AcmPageContent>
    </AcmPage>
  )
}

export function FormStory() {
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [description, setDescription] = useState<string>()
  const [selectValue, setSelectValue] = useState<string>()
  const [multiselectValue, setMultiselectValue] = useState<string[] | undefined>([])
  const [labels, setLabels] = useState<Record<string, string>>()
  const [submitText, setSubmitText] = useState('Submit')
  const [number, setNumber] = useState<number>(0)
  // const [errors, setErrors] = useState<string[]>([])

  return (
    <AcmForm>
      <AcmFormSection title="TextInput"></AcmFormSection>
      <AcmTextInput
        id="textInput"
        label="Email"
        placeholder="Enter email"
        labelHelpTitle="Email Help"
        labelHelp="The email must be in valid email format."
        value={email}
        onChange={(_event, value) => setEmail(value)}
        validation={(value) => {
          if (typeof value === 'string') {
            const regExp = /^[\w-]+(\.[\w-]+)*@([a-z0-9-]+(\.[a-z0-9-]+)*?\.[a-z]{2,6}|(\d{1,3}\.){3}\d{1,3})(:\d{4})?$/
            if (!regExp.test(value)) return 'Must be a valid email.'
          }
        }}
        isRequired
      />
      <AcmTextInput
        id="secretInput"
        label="Password"
        placeholder="Enter password"
        labelHelpTitle="Password Help"
        labelHelp="The password must be at least 8 characters long."
        type="password"
        value={password}
        onChange={(_event, value) => setPassword(value)}
        validation={(value) => {
          if (typeof value === 'string') {
            if (value.length < 8) return 'Password must be at least 8 characters.'
          }
        }}
        isRequired
      />

      <AcmFormSection title="Number input" spacing></AcmFormSection>
      <AcmNumberInput
        label="Number input with validation (must be positive)"
        id="validation"
        value={number}
        onChange={(e: React.FormEvent<HTMLInputElement>) => setNumber(Number((e.target as HTMLInputElement).value))}
        onMinus={() => setNumber(number - 1)}
        onPlus={() => setNumber(number + 1)}
        required
        validation={(value) => {
          if (value < 0) {
            return 'Value must be a positive number'
          }
          return undefined
        }}
      />
      <AcmFormSection title="TextArea" spacing></AcmFormSection>
      <AcmTextArea
        id="textArea"
        label="Text Area"
        placeholder="Enter your multi-line input"
        labelHelp="This is the help for the text area"
        value={description}
        onChange={(_event, value) => setDescription(value)}
        isRequired
      />
      <AcmFormSection title="Select" spacing></AcmFormSection>
      <AcmSelect
        id="acm-select"
        label="Select"
        placeholder="Select your option"
        labelHelp="AcmSelect allows the selection of one option"
        value={selectValue}
        onChange={setSelectValue}
        isRequired
      >
        <SelectOption value="red">
          <span style={{ color: 'red' }}>Red</span>
        </SelectOption>
        <SelectOption value="green">
          <span style={{ color: 'green' }}>Green</span>
        </SelectOption>
        <SelectOption value="blue">
          <span style={{ color: 'blue' }}>Blue</span>
        </SelectOption>
      </AcmSelect>

      <AcmMultiSelect
        id="acm-multiselect"
        label="Multi-Select"
        placeholder="Select your options"
        labelHelp="AcmMultiSelect allows the selection of multiple options"
        value={multiselectValue}
        onChange={setMultiselectValue}
      >
        <SelectOption key="option-1" value="option-1">
          Option 1
        </SelectOption>
        <SelectOption key="option-2" value="option-2">
          Option 2
        </SelectOption>
        <SelectOption key="option-3" value="option-3">
          Option 3
        </SelectOption>
      </AcmMultiSelect>

      <AcmFormSection title="Labels" spacing></AcmFormSection>
      <AcmKubernetesLabelsInput id="labelsInput" label="Labels Input" value={labels} onChange={setLabels} />

      <AcmAlertGroup isInline canClose />

      <ActionGroup>
        <AcmSubmit
          onClick={() => {
            // setErrors([])
            setSubmitText('Processing')
            return new Promise<undefined>((resolve) =>
              setTimeout(() => {
                setSubmitText('Submit')
                // setErrors(['Error - Not Implemented'])
                resolve(undefined)
              }, 2000)
            )
          }}
        >
          {submitText}
        </AcmSubmit>
      </ActionGroup>
    </AcmForm>
  )
}
