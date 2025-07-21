/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { StorageBulletChart } from './StorageBulletChart'

jest.mock('@patternfly/react-charts', () => ({
  Chart: ({ children }: any) => <div data-testid="chart">{children}</div>,
  ChartBar: () => <div data-testid="chart-bar" />,
  ChartStack: ({ children }: any) => <div data-testid="chart-stack">{children}</div>,
  ChartContainer: () => <div data-testid="chart-container" />,
}))

describe('StorageBulletChart', () => {
  const defaultProps = {
    used: 100,
    reserved: 50,
    total: 300,
  }

  it('renders with correct storage total', () => {
    render(<StorageBulletChart {...defaultProps} />)

    expect(screen.getByText('Storage: 300 GB')).toBeInTheDocument()
  })

  it('displays used storage information', () => {
    render(<StorageBulletChart {...defaultProps} />)

    expect(screen.getByText('100 GB used')).toBeInTheDocument()
  })

  it('calculates and displays free storage correctly', () => {
    render(<StorageBulletChart {...defaultProps} />)

    // free = total - used - reserved = 300 - 100 - 50 = 150
    expect(screen.getByText('150 GB free')).toBeInTheDocument()
  })

  it('displays legend with correct labels', () => {
    render(<StorageBulletChart {...defaultProps} />)

    expect(screen.getByText('100 GB used')).toBeInTheDocument()
    expect(screen.getByText('150 GB free')).toBeInTheDocument()
  })

  describe('edge cases', () => {
    it('handles zero used storage', () => {
      render(<StorageBulletChart used={0} reserved={50} total={300} />)

      expect(screen.getByText('0 GB used')).toBeInTheDocument()
      expect(screen.getByText('250 GB free')).toBeInTheDocument() // 300 - 0 - 50 = 250
    })

    it('handles zero reserved storage', () => {
      render(<StorageBulletChart used={100} reserved={0} total={300} />)

      expect(screen.getByText('100 GB used')).toBeInTheDocument()
      expect(screen.getByText('200 GB free')).toBeInTheDocument() // 300 - 100 - 0 = 200
    })

    it('handles fully utilized storage', () => {
      render(<StorageBulletChart used={200} reserved={100} total={300} />)

      expect(screen.getByText('200 GB used')).toBeInTheDocument()
      expect(screen.getByText('0 GB free')).toBeInTheDocument() // 300 - 200 - 100 = 0
    })

    it('handles small storage values', () => {
      render(<StorageBulletChart used={1} reserved={2} total={10} />)

      expect(screen.getByText('Storage: 10 GB')).toBeInTheDocument()
      expect(screen.getByText('1 GB used')).toBeInTheDocument()
      expect(screen.getByText('7 GB free')).toBeInTheDocument() // 10 - 1 - 2 = 7
    })

    it('handles large storage values', () => {
      render(<StorageBulletChart used={1000} reserved={500} total={5000} />)

      expect(screen.getByText('Storage: 5000 GB')).toBeInTheDocument()
      expect(screen.getByText('1000 GB used')).toBeInTheDocument()
      expect(screen.getByText('3500 GB free')).toBeInTheDocument() // 5000 - 1000 - 500 = 3500
    })
  })

  describe('calculation accuracy', () => {
    it('calculates free space correctly with various inputs', () => {
      const testCases = [
        { used: 10, reserved: 5, total: 100, expectedFree: 85 },
        { used: 75, reserved: 15, total: 200, expectedFree: 110 },
        { used: 0, reserved: 0, total: 50, expectedFree: 50 },
        { used: 25, reserved: 25, total: 50, expectedFree: 0 },
      ]

      testCases.forEach(({ used, reserved, total, expectedFree }) => {
        const { rerender } = render(<StorageBulletChart used={used} reserved={reserved} total={total} />)

        expect(screen.getByText(`${expectedFree} GB free`)).toBeInTheDocument()

        rerender(<div />)
      })
    })
  })

  describe('component structure', () => {
    it('renders without crashing', () => {
      const { container } = render(<StorageBulletChart {...defaultProps} />)
      expect(container).toBeInTheDocument()
    })

    it('contains all essential text elements', () => {
      render(<StorageBulletChart {...defaultProps} />)

      expect(screen.getByText('Storage: 300 GB')).toBeInTheDocument()

      expect(screen.getByText('100 GB used')).toBeInTheDocument()
      expect(screen.getByText('150 GB free')).toBeInTheDocument()
    })
  })

  describe('props validation', () => {
    it('handles different prop combinations correctly', () => {
      const testProps = [
        { used: 50, reserved: 25, total: 100 },
        { used: 0, reserved: 0, total: 1000 },
        { used: 999, reserved: 1, total: 1000 },
      ]

      testProps.forEach((props) => {
        const { rerender } = render(<StorageBulletChart {...props} />)

        expect(screen.getByText(`Storage: ${props.total} GB`)).toBeInTheDocument()
        expect(screen.getByText(`${props.used} GB used`)).toBeInTheDocument()

        const expectedFree = props.total - props.used - props.reserved
        expect(screen.getByText(`${expectedFree} GB free`)).toBeInTheDocument()

        rerender(<div />)
      })
    })
  })
})
