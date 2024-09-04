/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { AcmFeedbackModal } from './AcmFeedbackModal'
import { OutlinedCommentsIcon } from '@patternfly/react-icons'
import { AcmButton } from '../ui-components/AcmButton'

const isOpen = true
const toggle = () => !isOpen
const AcmFeedbackModalButton = () => {
  return (
    <AcmButton
      icon={<OutlinedCommentsIcon />}
      iconPosition="left"
      variant="danger"
      id="feedback-trigger-button"
      onClick={toggle}
    >
      'Feedback'
    </AcmButton>
  )
}

describe('AcmFeedbackModal', () => {
  const onClose = jest.fn()

  const DOC_VERSION = '2.6'

  const Component = (props: { isOpen: boolean }) => {
    return (
      <>
        <AcmFeedbackModalButton />
        <AcmFeedbackModal
          onShareFeedback={`https://console.redhat.com/self-managed-feedback-form?source=acm&version=${DOC_VERSION}`}
          isOpen={props.isOpen}
          onClose={onClose}
        />
      </>
    )
  }

  it('renders in an open state', () => {
    const { getByRole, queryByText } = render(<Component isOpen={true} />)
    expect(getByRole('button', { name: /Cancel/i })).toBeInTheDocument()
    expect(queryByText('Tell us about your experience')).toBeInTheDocument()
    userEvent.click(screen.getByRole('button', { name: /cancel/i }))
  })
  it('modal does not render when in a closed state, but feedback button remains', () => {
    const { queryByText, getByRole } = render(<Component isOpen={false} />)
    expect(queryByText('Tell us about your experience')).toBeNull()
    expect(getByRole('button', { name: /Feedback/i })).toBeInTheDocument()
  })
  it('has zero accessibility defects', async () => {
    const { container } = render(<Component isOpen={true} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
