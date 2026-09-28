/* Copyright Contributors to the Open Cluster Management project */

import { render, screen, waitFor } from '@testing-library/react'
import { axe } from 'jest-axe'
import { ExpandableDescription } from './ExpandableDescription'

jest.mock('@react-hook/resize-observer')

import useResizeObserver from '@react-hook/resize-observer'
import { clickElement } from '~/lib/test-util'
const mockUseResizeObserver = jest.mocked(useResizeObserver)

describe('ExpandableDescription', () => {
  let resizeCallback: (() => void) | undefined

  beforeEach(() => {
    resizeCallback = undefined
    mockUseResizeObserver.mockImplementation((_target, callback) => {
      resizeCallback = callback as () => void
      return {} as ResizeObserver
    })
  })

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
    await clickElement(showMore)
    expect(screen.getByRole('button', { name: 'Show less' })).toBeInTheDocument()
    await clickElement(screen.getByRole('button', { name: 'Show less' }))
    expect(screen.getByRole('button', { name: 'Show more' })).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  })

  it('recalculates truncatable state when the container resizes', async () => {
    const scrollHeightSpy = jest.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(40)
    jest.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(40)

    render(<ExpandableDescription description="Resize-sensitive description" />)
    expect(screen.queryByRole('button', { name: 'Show more' })).not.toBeInTheDocument()

    scrollHeightSpy.mockReturnValue(200)
    resizeCallback?.()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Show more' })).toBeInTheDocument()
    })
  })
})
