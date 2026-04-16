/* Copyright Contributors to the Open Cluster Management project */

import Review from './Review'
import { render } from '@testing-library/react'

const i18n = jest.fn((key) => key)

describe('Review', () => {
  it('renders review notifications slot', () => {
    const { container } = render(
      <Review details={[]} startStep={0} renderNotifications={() => <div data-testid="notifications" />} i18n={i18n} />
    )
    expect(container.querySelector('[data-testid="notifications"]')).toBeInTheDocument()
  })
})
