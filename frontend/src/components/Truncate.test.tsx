/* Copyright Contributors to the Open Cluster Management project */

import React from 'react'
import { render, screen, within } from '@testing-library/react'
import { Truncate } from './Truncate'

jest.mock('@patternfly/react-core', () => {
  const ReactRuntime = jest.requireActual('react')
  const actual = jest.requireActual('@patternfly/react-core')

  return {
    ...actual,
    Tooltip: ({ children, content }: { children?: React.ReactNode; content?: React.ReactNode }) =>
      ReactRuntime.createElement(
        ReactRuntime.Fragment,
        null,
        ReactRuntime.createElement('div', { id: 'tooltip-content' }, content),
        children
      ),
  }
})

const originalRequestAnimationFrame = window.requestAnimationFrame

describe('Truncate', () => {
  beforeEach(() => {
    jest.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(100)
    jest.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1)
    window.requestAnimationFrame = jest.fn(() => 0)
  })

  afterEach(() => {
    jest.restoreAllMocks()
    window.requestAnimationFrame = originalRequestAnimationFrame
  })

  it('keeps unkeyed tooltip segments mounted when their text changes', () => {
    const makeSegments = (highlight: string) => [
      React.createElement('span', { 'data-highlight': 'true' }, highlight),
      ' ',
      React.createElement('span', { key: 'remaining' }, 'remaining text'),
    ]

    const { rerender } = render(
      <Truncate content="first remaining text" isLink>
        {makeSegments('first')}
      </Truncate>
    )
    const tooltip = screen.getByTestId('tooltip-content')
    const firstSegment = within(tooltip).getByText('first')

    rerender(
      <Truncate content="second remaining text" isLink>
        {makeSegments('second')}
      </Truncate>
    )

    expect(within(screen.getByTestId('tooltip-content')).getByText('second')).toBe(firstSegment)
  })

  it('renders tooltip content from iterable children', () => {
    const segments = new Set<React.ReactNode>([
      React.createElement('span', null, 'iterable segment'),
      ' ',
      React.createElement('span', null, 'remaining segment'),
    ])

    render(<Truncate content="iterable segment" children={segments} />)

    const tooltip = within(screen.getByTestId('tooltip-content'))
    expect(tooltip.getByText('iterable segment')).toBeInTheDocument()
    expect(tooltip.getByText('remaining segment')).toBeInTheDocument()
  })
})
