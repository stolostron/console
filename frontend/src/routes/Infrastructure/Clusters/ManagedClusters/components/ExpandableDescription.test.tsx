/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { ExpandableDescription } from './ExpandableDescription'

describe('ExpandableDescription', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('renders description without toggle when content fits', async () => {
    jest.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(40)
    jest.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(40)

    const { container } = render(<ExpandableDescription description="Short description" />)

    expect(screen.getByText('Short description')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Show more' })).not.toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  })

  it('shows Show more / Show less when content overflows', async () => {
    jest.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(200)
    jest.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(80)

    const { container } = render(
      <ExpandableDescription description={'Line 1\nLine 2\nLine 3\nLine 4\nLine 5\nLine 6'} />
    )

    const showMore = screen.getByRole('button', { name: 'Show more' })
    expect(showMore).toBeInTheDocument()
    await userEvent.click(showMore)
    expect(screen.getByRole('button', { name: 'Show less' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Show less' }))
    expect(screen.getByRole('button', { name: 'Show more' })).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  })
})
