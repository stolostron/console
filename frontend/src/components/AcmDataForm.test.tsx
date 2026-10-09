/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import i18next from 'i18next'
import { axe } from 'jest-axe'
import { useState } from 'react'
import { MemoryRouter } from 'react-router'
import { FormData } from './AcmFormData'
import { AcmDataFormInput, AcmDataFormPage, generalValidationMessage, requiredValidationMessage } from './AcmDataForm'
import { clickElement, typeElement } from '~/lib/test-util'

const t = i18next.t.bind(i18next)

function TestFormPage({ showErrors }: { showErrors?: boolean }) {
  const [name, setName] = useState('')

  const formData: FormData = {
    title: 'Test form',
    description: 'Form used to verify validation banner spacing',
    sections: [
      {
        type: 'Section',
        title: 'Details',
        inputs: [
          {
            id: 'name',
            type: 'Text',
            label: 'Name',
            value: name,
            onChange: setName,
            isRequired: true,
          },
        ],
      },
    ],
    submit: () => undefined,
    cancel: () => undefined,
    submitText: 'Submit',
    submittingText: 'Submitting',
    reviewTitle: 'Review',
    reviewDescription: 'Review',
    cancelLabel: 'Cancel',
    nextLabel: 'Next',
    backLabel: 'Back',
    showErrors,
    stateToData: () => [{ metadata: { name } }],
  }

  return (
    <MemoryRouter>
      <AcmDataFormPage formData={formData} mode="form" hideYaml />
    </MemoryRouter>
  )
}

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

  describe('masked secret inputs', () => {
    function SecretInput(props: { type: 'Text' | 'TextArea'; initialValue: string }) {
      const [value, setValue] = useState(props.initialValue)
      return (
        <AcmDataFormInput
          isReadOnly={false}
          input={{
            id: 'secret',
            type: props.type,
            label: 'Secret',
            placeholder: 'Enter token',
            value,
            onChange: setValue,
            isSecret: true,
          }}
        />
      )
    }

    test('opens an empty secret revealed so it can be filled in', async () => {
      render(<SecretInput type="Text" initialValue="" />)

      const input = screen.getByPlaceholderText('Enter token')
      expect(input).toHaveAttribute('type', 'text')
      expect(input).toBeEnabled()

      await typeElement(input, 'token')

      expect(input).toHaveValue('token')
      expect(input).toBeEnabled()
    })

    test('opens an existing secret masked and read-only until it is revealed', async () => {
      render(<SecretInput type="Text" initialValue="ansibleToken" />)

      const input = screen.getByDisplayValue('ansibleToken')
      expect(input).toHaveAttribute('type', 'password')
      expect(input).toBeDisabled()

      await clickElement(screen.getByRole('button', { name: 'Reveal credentials' }))

      expect(input).toHaveAttribute('type', 'text')
      expect(input).toBeEnabled()
    })

    test('locks a revealed secret again when it is hidden', async () => {
      render(<SecretInput type="Text" initialValue="ansibleToken" />)

      await clickElement(screen.getByRole('button', { name: 'Reveal credentials' }))
      await clickElement(screen.getByRole('button', { name: 'Hide credentials' }))

      expect(screen.getByDisplayValue('ansibleToken')).toBeDisabled()
    })

    test('reopens the field when an existing secret is cleared', async () => {
      render(<SecretInput type="Text" initialValue="ansibleToken" />)

      await clickElement(screen.getByRole('button', { name: 'Clear' }))

      const input = screen.getByPlaceholderText('Enter token')
      expect(input).toBeEnabled()
      await typeElement(input, 'newToken')
      expect(input).toHaveValue('newToken')
    })

    test('masks a multiline secret with a length-proportional mask and expands it on reveal', async () => {
      render(<SecretInput type="TextArea" initialValue="secret value" />)

      const masked = screen.getByDisplayValue('••••••••••••')
      expect(masked).toBeDisabled()
      expect(masked.tagName).toBe('INPUT')

      await clickElement(screen.getByRole('button', { name: 'Reveal credentials' }))

      const revealed = screen.getByDisplayValue('secret value')
      expect(revealed.tagName).toBe('TEXTAREA')
      expect(revealed).toBeEnabled()
    })

    test('has no accessibility violations while masked', async () => {
      const { container } = render(<SecretInput type="Text" initialValue="ansibleToken" />)

      expect(await axe(container)).toHaveNoViolations()
    })
  })

  describe('form-mode validation banner (ACM-45137)', () => {
    test('shows required-field banner in a PageSection without paddingTop override', async () => {
      render(<TestFormPage />)

      await clickElement(screen.getByRole('button', { name: /^Submit$/i }))

      const alert = await screen.findByText('You must fill out all required fields before you can proceed.')
      const pageSection = alert.closest('section.pf-v6-c-page__main-section')
      expect(pageSection).toBeInTheDocument()
      // PF v6 migration had style={{ paddingTop: 0 }} which collapsed spacing under the header
      expect(pageSection).not.toHaveStyle({ paddingTop: 0 })
      expect((pageSection as HTMLElement).style.paddingTop).toBe('')
    })

    test('shows required-field banner when showErrors is forced on formData', async () => {
      render(<TestFormPage showErrors />)

      const alert = await screen.findByText('You must fill out all required fields before you can proceed.')
      const pageSection = alert.closest('section.pf-v6-c-page__main-section')
      expect(pageSection).toBeInTheDocument()
      expect((pageSection as HTMLElement).style.paddingTop).toBe('')

      // Banner sits between header and form content (not inside the drawer form section only)
      const header = screen.getByRole('heading', { name: 'Test form' })
      expect(header.compareDocumentPosition(alert) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    })
  })
})
