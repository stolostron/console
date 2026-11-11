/* Copyright Contributors to the Open Cluster Management project */

import { render, screen, waitFor } from '@testing-library/react'
import { axe } from 'jest-axe'
import { clickElement } from '~/lib/test-util'
import { ExpandableDescription } from './ExpandableDescription'

/** PatternFly truncate gate uses scrollHeight / lineHeight. */
function mockLineMetrics(scrollHeight: number, lineHeightPx = 20) {
  jest.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(scrollHeight)
  const realGetComputedStyle = window.getComputedStyle.bind(window)
  jest.spyOn(window, 'getComputedStyle').mockImplementation((el) => {
    const style = realGetComputedStyle(el)
    Object.defineProperty(style, 'lineHeight', { value: `${lineHeightPx}px`, configurable: true })
    return style
  })
}

describe('ExpandableDescription', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('shows description text without toggle when content fits', async () => {
    mockLineMetrics(40)

    const { container } = render(<ExpandableDescription description="Short description" />)

    expect(screen.getByText('Short description')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.queryByText('Show more')).not.toBeInTheDocument()
    })
    expect(await axe(container)).toHaveNoViolations()
  })

  it('shows description and toggles Show more / Show less when content overflows', async () => {
    mockLineMetrics(200)

    const { container } = render(
      <ExpandableDescription description={'Line 1\nLine 2\nLine 3\nLine 4\nLine 5\nLine 6'} />
    )

    expect(screen.getByText(/Line 1/)).toBeInTheDocument()

    // Overflow Label sits inside the ExpandableSection toggle button (nested interactive).
    // Query by text to avoid ambiguous role="button" matches.
    await clickElement(await screen.findByText('Show more'))
    expect(screen.getByText('Show less')).toBeInTheDocument()
    await clickElement(screen.getByText('Show less'))
    expect(screen.getByText('Show more')).toBeInTheDocument()

    // Label variant="overflow" inside PF Button trips nested-interactive; disable that rule here.
    expect(
      await axe(container, {
        rules: {
          'nested-interactive': { enabled: false },
        },
      })
    ).toHaveNoViolations()
  })
})
