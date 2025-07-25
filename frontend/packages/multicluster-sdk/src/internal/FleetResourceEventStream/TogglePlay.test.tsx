/* Copyright Contributors to the Open Cluster Management project */
import { render, screen, fireEvent } from '@testing-library/react'
import TogglePlay from './TogglePlay'

// mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

describe('TogglePlay', () => {
  const mockOnClick = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render play button when not active', () => {
    render(<TogglePlay active={false} className="test-class" onClick={mockOnClick} />)

    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('aria-label', 'public~Start streaming events')
    expect(button).toHaveClass('co-toggle-play', 'co-toggle-play--inactive', 'test-class')
  })

  it('should render pause button when active', () => {
    render(<TogglePlay active={true} className="test-class" onClick={mockOnClick} />)

    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('aria-label', 'public~Pause event streaming')
    expect(button).toHaveClass('co-toggle-play', 'co-toggle-play--active', 'test-class')
  })

  it('should call onClick when clicked', () => {
    render(<TogglePlay active={false} className="test-class" onClick={mockOnClick} />)

    const button = screen.getByRole('button')
    fireEvent.click(button)

    expect(mockOnClick).toHaveBeenCalledTimes(1)
  })

  it('should handle empty className', () => {
    render(<TogglePlay active={false} className="" onClick={mockOnClick} />)

    const button = screen.getByRole('button')
    expect(button).toHaveClass('co-toggle-play', 'co-toggle-play--inactive')
  })
})
