/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { DOC_VERSION } from '../lib/doc-util'
import { AcmFeedbackModal } from './AcmFeedbackModal'
import { clickElement } from '~/lib/test-util'

window.open = jest.fn()

describe('AcmFeedbackModal', () => {
  it('renders feedback button', async () => {
    const { getByRole, queryByText } = render(<AcmFeedbackModal />)
    expect(queryByText('Tell us about your experience')).toBeNull()
    //open Feedback Modal
    await clickElement(screen.getByRole('button', { name: /Feedback/i }))
    expect(getByRole('button', { name: /Cancel/i })).toBeInTheDocument()
    expect(queryByText('Tell us about your experience')).toBeInTheDocument()

    //close Feedback Modal
    await clickElement(screen.getByRole('button', { name: /cancel/i }))
    expect(queryByText('Tell us about your experience')).toBeNull()
  })

  it('opens share feedback and support case links', async () => {
    const { getByTestId } = render(<AcmFeedbackModal />)
    await clickElement(screen.getByRole('button', { name: /Feedback/i }))

    await clickElement(getByTestId('feedback-card-1'))
    expect(window.open).toHaveBeenCalledWith(
      `https://console.redhat.com/self-managed-feedback-form?source=acm&version=${DOC_VERSION}`,
      '_blank'
    )
    await clickElement(getByTestId('open-support-case-card-1'))
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
