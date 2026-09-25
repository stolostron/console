/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import i18next from 'i18next'
import { useState } from 'react'
import { MemoryRouter } from 'react-router'
import { FormData } from './AcmFormData'
import { AcmDataFormPage, generalValidationMessage, requiredValidationMessage } from './AcmDataForm'
import { clickElement } from '~/lib/test-util'

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
