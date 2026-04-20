/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import { StreamStatusOverlay } from './StreamStatusOverlay'

jest.mock('../lib/acm-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

describe('StreamStatusOverlay', () => {
  it('renders the idle overlay with idle text visible', () => {
    const { container } = render(<StreamStatusOverlay variant="idle" />)
    expect(container.querySelector('[data-testid="idle-overlay"]')).toBeInTheDocument()
    expect(screen.getByText('Session paused due to inactivity')).toBeVisible()
  })

  it('renders the reconnecting overlay with reconnecting text visible', () => {
    const { container } = render(<StreamStatusOverlay variant="reconnecting" />)
    expect(container.querySelector('[data-testid="reconnecting-overlay"]')).toBeInTheDocument()
    expect(screen.getByText('Reconnecting')).toBeVisible()
  })

  it('renders hidden reconnecting text in idle variant for stable sizing', () => {
    render(<StreamStatusOverlay variant="idle" />)
    const hiddenText = screen.getByText('Reconnecting')
    expect(hiddenText).toHaveAttribute('aria-hidden', 'true')
  })

  it('renders hidden idle text in reconnecting variant for stable sizing', () => {
    render(<StreamStatusOverlay variant="reconnecting" />)
    const hiddenText = screen.getByText('Session paused due to inactivity')
    expect(hiddenText).toHaveAttribute('aria-hidden', 'true')
  })

  it('renders a Card inside a Bullseye inside a Backdrop', () => {
    const { container } = render(<StreamStatusOverlay variant="idle" />)
    expect(container.querySelector('.pf-v6-c-backdrop')).toBeInTheDocument()
    expect(container.querySelector('.pf-v6-c-card')).toBeInTheDocument()
  })
})
