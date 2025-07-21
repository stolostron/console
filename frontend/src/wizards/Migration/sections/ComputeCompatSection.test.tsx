/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { ComputeCompatSection } from './ComputeCompatSection'

const defaultProps = {
  srcCompute: 'source-compute-1',
  dstCompute: 'target-compute-1',
}

describe('ComputeCompatSection', () => {
  describe('initial rendering', () => {
    it('renders section title correctly', () => {
      render(<ComputeCompatSection {...defaultProps} />)

      expect(screen.getByText('Compute compatibility')).toBeInTheDocument()
    })

    it('displays source cluster compute label and value', () => {
      render(<ComputeCompatSection {...defaultProps} />)

      expect(screen.getByText('Source cluster compute')).toBeInTheDocument()
      expect(screen.getByText('source-compute-1')).toBeInTheDocument()
    })

    it('displays target cluster compute label and value', () => {
      render(<ComputeCompatSection {...defaultProps} />)

      expect(screen.getByText('Target cluster compute')).toBeInTheDocument()
      expect(screen.getByText('target-compute-1')).toBeInTheDocument()
    })
  })

  describe('empty values handling', () => {
    it('shows dash when source compute is empty', () => {
      const props = { ...defaultProps, srcCompute: '' }
      render(<ComputeCompatSection {...props} />)

      expect(screen.getByText('-')).toBeInTheDocument()
    })

    it('shows dash when target compute is empty', () => {
      const props = { ...defaultProps, dstCompute: '' }
      render(<ComputeCompatSection {...props} />)

      expect(screen.getByText('-')).toBeInTheDocument()
    })

    it('shows two dashes when both values are empty', () => {
      const props = { srcCompute: '', dstCompute: '' }
      render(<ComputeCompatSection {...props} />)

      expect(screen.getAllByText('-')).toHaveLength(2)
    })
  })

  describe('props validation', () => {
    it('handles various compute values correctly', () => {
      const testCases = [
        { src: 'intel-x86', dst: 'amd-64' },
        { src: 'ARM64', dst: 'x86_64' },
        { src: 'compute-class-a', dst: 'compute-class-b' },
      ]

      testCases.forEach(({ src, dst }) => {
        const { rerender } = render(<ComputeCompatSection srcCompute={src} dstCompute={dst} />)

        expect(screen.getByText(src)).toBeInTheDocument()
        expect(screen.getByText(dst)).toBeInTheDocument()

        rerender(<div />)
      })
    })

    it('handles special characters in compute names', () => {
      const props = {
        srcCompute: 'compute-with_special-chars!@#',
        dstCompute: 'target_compute-123',
      }
      render(<ComputeCompatSection {...props} />)

      expect(screen.getByText('compute-with_special-chars!@#')).toBeInTheDocument()
      expect(screen.getByText('target_compute-123')).toBeInTheDocument()
    })

    it('handles very long compute names', () => {
      const props = {
        srcCompute: 'very-long-compute-name-that-might-overflow-the-container-width',
        dstCompute: 'another-very-long-target-compute-name-for-testing-purposes',
      }
      render(<ComputeCompatSection {...props} />)

      expect(screen.getByText('very-long-compute-name-that-might-overflow-the-container-width')).toBeInTheDocument()
      expect(screen.getByText('another-very-long-target-compute-name-for-testing-purposes')).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('maintains proper heading hierarchy', () => {
      render(<ComputeCompatSection {...defaultProps} />)

      const mainHeading = screen.getByRole('heading', { level: 3 })
      const subHeadings = screen.getAllByRole('heading', { level: 4 })

      expect(mainHeading).toHaveTextContent('Compute compatibility')
      expect(subHeadings).toHaveLength(2)
      expect(subHeadings[0]).toHaveTextContent('Source cluster compute')
      expect(subHeadings[1]).toHaveTextContent('Target cluster compute')
    })
  })

  describe('component structure', () => {
    it('renders without crashing', () => {
      const { container } = render(<ComputeCompatSection {...defaultProps} />)
      expect(container).toBeInTheDocument()
    })

    it('maintains consistent layout structure', () => {
      render(<ComputeCompatSection {...defaultProps} />)

      expect(screen.getByText('Source cluster compute')).toBeInTheDocument()
      expect(screen.getByText('Target cluster compute')).toBeInTheDocument()

      expect(screen.getByText('Compute compatibility')).toBeInTheDocument()
    })

    it('displays read-only content correctly', () => {
      render(<ComputeCompatSection {...defaultProps} />)

      expect(screen.getByText('source-compute-1')).toBeInTheDocument()
      expect(screen.getByText('target-compute-1')).toBeInTheDocument()

      expect(screen.queryByRole('button')).not.toBeInTheDocument()
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    })
  })

  describe('prop updates', () => {
    it('updates display when props change', () => {
      const { rerender } = render(<ComputeCompatSection {...defaultProps} />)

      expect(screen.getByText('source-compute-1')).toBeInTheDocument()
      expect(screen.getByText('target-compute-1')).toBeInTheDocument()

      rerender(<ComputeCompatSection srcCompute="new-source" dstCompute="new-target" />)

      expect(screen.getByText('new-source')).toBeInTheDocument()
      expect(screen.getByText('new-target')).toBeInTheDocument()
      expect(screen.queryByText('source-compute-1')).not.toBeInTheDocument()
      expect(screen.queryByText('target-compute-1')).not.toBeInTheDocument()
    })
  })
})
