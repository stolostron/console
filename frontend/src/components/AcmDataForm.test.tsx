/* Copyright Contributors to the Open Cluster Management project */
import { FormGroup } from '@patternfly/react-core'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { useState } from 'react'
import i18next from 'i18next'
const t = i18next.t.bind(i18next)
import { AcmDataFormInput, generalValidationMessage, requiredValidationMessage } from './AcmDataForm'
import { Input } from './AcmFormData'

describe('ACMDataForm', () => {
  describe('generalValidationMessage', () => {
    test('generalValidationMessage should render the expected string', () => {
      expect(generalValidationMessage(t)).toEqual('You must fix the issues with fields before you can proceed.')
    })
  })

  describe('requiredValidationMessage', () => {
    test('requiredValidationMessage should render the expected string', () => {
      expect(requiredValidationMessage(t)).toEqual('You must fill out all required fields before you can proceed.')
    })
  })

  describe('AcmDataFormInput masked secret TextArea', () => {
    const multilineSecret = [
      '-----BEGIN OPENSSH PRIVATE KEY-----',
      'abc123def456',
      '-----END OPENSSH PRIVATE KEY-----',
    ].join('\n')

    function SecretHarness(props: { onValue: (value: string) => void }) {
      const [value, setValue] = useState(multilineSecret)
      const input: Input = {
        id: 'ssh-privatekey',
        type: 'TextArea',
        label: 'SSH private key',
        value,
        isSecret: true,
        onChange: (next: string) => {
          setValue(next)
          props.onValue(next)
        },
      }
      // Mirror how the form renders inputs, so the field is labelled as it is in the real page.
      return (
        <FormGroup label="SSH private key" fieldId="ssh-privatekey">
          <AcmDataFormInput input={input} isReadOnly={false} />
        </FormGroup>
      )
    }

    test('renders a hidden multiline secret in a textarea so line breaks survive editing', async () => {
      const onValue = jest.fn()
      const { container } = render(<SecretHarness onValue={onValue} />)

      // A hidden secret must remain a multiline textarea (not a single-line password input) so that
      // typing into it preserves the value's newlines.
      const field = container.querySelector('textarea')
      expect(field).toBeInTheDocument()
      expect(field).toHaveValue(multilineSecret)

      // Append text while the field is still masked, without clicking the eyeball icon.
      await userEvent.type(field!, ' # edited while hidden')

      // The value handed to onChange keeps every original line break intact.
      const lastValue = onValue.mock.calls[onValue.mock.calls.length - 1][0] as string
      expect(lastValue.startsWith(multilineSecret)).toBe(true)
      expect(lastValue.endsWith(' # edited while hidden')).toBe(true)
      expect(lastValue.split('\n')).toEqual([
        '-----BEGIN OPENSSH PRIVATE KEY-----',
        'abc123def456',
        '-----END OPENSSH PRIVATE KEY----- # edited while hidden',
      ])

      expect(await axe(container)).toHaveNoViolations()
    })
  })
})
