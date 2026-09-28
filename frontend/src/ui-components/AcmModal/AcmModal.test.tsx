/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { axe } from 'jest-axe'
import { AcmModal } from './AcmModal'
import { AcmButton } from '../AcmButton/AcmButton'
import { ButtonVariant } from '@patternfly/react-core'
import { clickElement } from '~/lib/test-util'

describe('AcmModal', () => {
  const onSubmit = jest.fn()
  const onCancel = jest.fn()
  const Component = (props: { open: boolean }) => {
    return (
      <AcmModal
        isOpen={props.open}
        title="Modal title"
        actions={[
          <AcmButton key="confirm" variant={ButtonVariant.primary} onClick={onSubmit}>
            Submit
          </AcmButton>,
          <AcmButton key="cancel" variant={ButtonVariant.link} onClick={onCancel}>
            Cancel
          </AcmButton>,
        ]}
      >
        Modal message
      </AcmModal>
    )
  }
  test('renders in an open state', async () => {
    const { getByRole, getByText } = render(<Component open={true} />)
    await clickElement(getByText('Submit'))
    await clickElement(getByText('Cancel'))
    expect(getByRole('dialog')).toBeInTheDocument()
    expect(onSubmit).toHaveBeenCalled()
    expect(onCancel).toHaveBeenCalled()
  })
  test('does not render when in a closed state', () => {
    const { queryByText } = render(<Component open={false} />)
    expect(queryByText('Modal title')).toBeNull()
  })
  test('has zero accessibility defects', async () => {
    const { container } = render(<Component open={true} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
