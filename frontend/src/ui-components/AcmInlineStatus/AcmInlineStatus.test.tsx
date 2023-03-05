/* Copyright Contributors to the Open Cluster Management project */

import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { configureAxe } from 'jest-axe'

import { AcmInlineStatus, StatusType } from './AcmInlineStatus'
const axe = configureAxe({
  rules: {
    'aria-progressbar-name': { enabled: false },
  },
})

describe('AcmInlineStatus', () => {
  Object.values(StatusType).forEach((type) => {
    test(`has zero accessibility defects - (${type})`, async () => {
      const { container } = render(<AcmInlineStatus type={type} status="foobar" />)
      expect(await axe(container)).toHaveNoViolations()
    })
  })
  test('should allow a popover window on click', async () => {
    const { getByText } = render(
      <AcmInlineStatus
        type={StatusType.healthy}
        status="foobar"
        popover={{
          headerContent: 'Header',
          bodyContent: 'Some information about the status here.',
          // eslint-disable-next-line jsx-a11y/anchor-is-valid
          footerContent: <a href="#">Status link</a>,
        }}
      />
    )
    expect(getByText('foobar')).toBeInTheDocument()
    userEvent.click(getByText('foobar'))
    await waitFor(() => expect(getByText('Header')).toBeInTheDocument())
  })
})
