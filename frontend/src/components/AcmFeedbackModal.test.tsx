/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { AcmFeedbackModal } from './AcmFeedbackModal'
import { DOC_VERSION } from '../lib/doc-util'

window.open = jest.fn()

describe('AcmFeedbackModal', () => {
  it('renders feedback button', () => {
    const { getByRole, queryByText } = render(<AcmFeedbackModal />)
    expect(queryByText('Tell us about your experience')).toBeNull()
    //open Feedback Modal
    userEvent.click(screen.getByRole('button', { name: /Feedback/i }))
    expect(getByRole('button', { name: /Cancel/i })).toBeInTheDocument()
    expect(queryByText('Tell us about your experience')).toBeInTheDocument()

    //close Feedback Modal
    userEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(queryByText('Tell us about your experience')).toBeNull()
  })

  it('opens share feedback and support case links', () => {
    const { getByText } = render(<AcmFeedbackModal />)
    userEvent.click(screen.getByRole('button', { name: /Feedback/i }))

    userEvent.click(getByText(/share feedback/i))
    expect(window.open).toHaveBeenCalledWith(
      `https://console.redhat.com/self-managed-feedback-form?source=acm&version=${DOC_VERSION}`,
      '_blank'
    )
    userEvent.click(getByText(/support case/i))
    expect(window.open).toHaveBeenCalledWith(
      'https://access.redhat.com/support/cases/#/case/new/open-case?caseCreate=true',
      '_blank'
    )
  })

  it('has zero accessibility defects', async () => {
    const { container } = render(<AcmFeedbackModal />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
