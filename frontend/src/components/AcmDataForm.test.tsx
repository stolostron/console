/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import i18next from 'i18next'
import { axe } from 'jest-axe'
import { useState } from 'react'
import { MemoryRouter } from 'react-router'
import { FormData } from './AcmFormData'
import {
  AcmDataFormDetails,
  AcmDataFormInput,
  AcmDataFormPage,
  generalValidationMessage,
  requiredValidationMessage,
} from './AcmDataForm'
import { clickElement, typeElement } from '~/lib/test-util'

const t = i18next.t.bind(i18next)

function TestWizardPage({ onSubmit }: { onSubmit?: () => void }) {
  const [first, setFirst] = useState('')
  const [second, setSecond] = useState('')

  const formData: FormData = {
    title: 'Wizard form',
    sections: [
      {
        type: 'Section',
        title: 'First step',
        inputs: [{ id: 'first', type: 'Text', label: 'First field', value: first, onChange: setFirst }],
      },
      {
        type: 'Section',
        title: 'Second step',
        inputs: [{ id: 'second', type: 'Text', label: 'Second field', value: second, onChange: setSecond }],
      },
    ],
    submit: () => onSubmit?.(),
    cancel: () => undefined,
    submitText: 'Submit',
    submittingText: 'Submitting',
    reviewTitle: 'Review',
    reviewDescription: 'Review',
    cancelLabel: 'Cancel',
    nextLabel: 'Next',
    backLabel: 'Back',
    stateToData: () => [{ metadata: { name: 'wizard' } }],
  }

  return (
    <MemoryRouter>
      <AcmDataFormPage formData={formData} mode="wizard" hideYaml />
    </MemoryRouter>
  )
}

function TestYamlFormPage() {
  const [name, setName] = useState('copy-me')

  const formData: FormData = {
    title: 'YAML form',
    sections: [
      {
        type: 'Section',
        title: 'Details',
        inputs: [{ id: 'name', type: 'Text', label: 'Name', value: name, onChange: setName }],
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
    stateToData: () => [{ metadata: { name } }],
  }

  return (
    <MemoryRouter>
      <AcmDataFormPage formData={formData} mode="form" />
    </MemoryRouter>
  )
}

function TestPasteInput() {
  const [value, setValue] = useState('')
  return (
    <AcmDataFormInput
      isReadOnly={false}
      input={{
        id: 'pasteable',
        type: 'Text',
        label: 'Pasteable',
        placeholder: 'Enter value',
        value,
        onChange: setValue,
      }}
    />
  )
}

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

  describe('wizard navigation', () => {
    test('advances to the next step when the active section has no errors', async () => {
      render(<TestWizardPage />)

      // First step is shown; second field is not yet rendered
      expect(screen.getByLabelText('First field')).toBeInTheDocument()
      expect(screen.queryByLabelText('Second field')).not.toBeInTheDocument()

      await clickElement(screen.getByRole('button', { name: /^Next$/i }))

      // goToNextStep advanced the wizard to the second section
      expect(await screen.findByLabelText('Second field')).toBeInTheDocument()
    })
  })

  describe('YAML drawer clipboard', () => {
    test('copies the YAML representation of the form state to the clipboard', async () => {
      const writeText = jest.fn().mockResolvedValue(undefined)
      Object.assign(navigator, { clipboard: { writeText } })
      localStorage.setItem('yaml', 'true')

      try {
        render(<TestYamlFormPage />)

        await clickElement(screen.getByRole('button', { name: /copy to clipboard/i }))

        expect(writeText).toHaveBeenCalledTimes(1)
        expect(writeText).toHaveBeenCalledWith(expect.stringContaining('name: copy-me'))
      } finally {
        localStorage.removeItem('yaml')
      }
    })
  })

  describe('paste input button', () => {
    test('reads from the clipboard and sets the input value', async () => {
      const readText = jest.fn().mockResolvedValue('pasted-value')
      Object.assign(navigator, { clipboard: { readText } })

      render(<TestPasteInput />)

      await clickElement(screen.getByRole('button', { name: 'Paste' }))

      expect(readText).toHaveBeenCalledTimes(1)
      expect(await screen.findByDisplayValue('pasted-value')).toBeInTheDocument()
    })
  })

  describe('details-mode secret values (ACM-48319)', () => {
    const longSecret = `{"auths":{"registry.redhat.io":{"auth":"${'E2OFJJNjdZWUY2ODZmQWhjNW9mMUM3TDNESHdDU'.repeat(20)}"}}}`
    const multilineSecret = ['-----BEGIN CERTIFICATE-----', 'A'.repeat(600), '', 'A'.repeat(600), ''].join('\n')

    function detailsFormData(value: string): FormData {
      return {
        title: 'Credential',
        sections: [
          {
            type: 'Section',
            title: 'Pull secret',
            inputs: [
              {
                id: 'pullSecret',
                type: 'TextArea',
                label: 'Pull secret',
                value,
                onChange: () => undefined,
                isSecret: true,
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
        stateToData: () => [{}],
      }
    }

    test.each([
      ['a long single-line secret', longSecret],
      ['a multiline secret', multilineSecret],
    ])('revealing %s keeps the value wrappable instead of widening the page', async (_name, value) => {
      const { container } = render(<AcmDataFormDetails formData={detailsFormData(value)} />)

      expect(screen.getByText('****************')).toBeInTheDocument()

      await clickElement(screen.getByRole('button', { name: /reveal credentials/i }))

      const valueCell = container.querySelector('.pf-v6-l-split__item.pf-m-fill') as HTMLElement
      expect(valueCell).toBeInTheDocument()
      expect(valueCell).toHaveStyle({ whiteSpace: 'pre-wrap' })
      expect(valueCell).toHaveStyle({ overflowWrap: 'anywhere' })

      const revealButton = screen.getByRole('button', { name: /hide credentials/i })
      expect(valueCell.contains(revealButton)).toBe(false)
    })
  })
})
