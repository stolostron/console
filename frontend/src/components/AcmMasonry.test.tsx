/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import { AcmMasonry } from './AcmMasonry'

jest.mock('@react-hook/resize-observer', () => {
  return jest.fn((target, callback) => {
    if (callback && target.current) {
      setTimeout(() => {
        callback({
          contentRect: { width: 800, height: 100 },
        })
      }, 0)
    }
  })
})

describe('AcmMasonry', () => {
  it('renders with no children', () => {
    const { container } = render(<AcmMasonry minSize={200} />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('renders children in masonry layout', () => {
    render(
      <AcmMasonry minSize={200} maxColumns={2}>
        <div>Item 1</div>
        <div>Item 2</div>
        <div>Item 3</div>
      </AcmMasonry>
    )

    expect(screen.getByText('Item 1')).toBeInTheDocument()
    expect(screen.getByText('Item 2')).toBeInTheDocument()
    expect(screen.getByText('Item 3')).toBeInTheDocument()
  })

  it('renders grid with proper styling', () => {
    const { container } = render(
      <AcmMasonry minSize={200}>
        <div>Item 1</div>
        <div>Item 2</div>
      </AcmMasonry>
    )

    const grid = container.querySelector('[class*="pf-v5-l-grid"]')
    expect(grid).toBeInTheDocument()
    expect(grid).toHaveAttribute('class', expect.stringContaining('pf-v5-l-grid'))
  })

  it('respects maxColumns prop', () => {
    const { container } = render(
      <AcmMasonry minSize={100} maxColumns={2}>
        <div>Item 1</div>
        <div>Item 2</div>
        <div>Item 3</div>
      </AcmMasonry>
    )

    expect(container.firstChild).toBeInTheDocument()
  })
})
