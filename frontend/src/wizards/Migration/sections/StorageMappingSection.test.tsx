/* Copyright Contributors to the Open Cluster Management project */
import { render, screen, fireEvent } from '@testing-library/react'
import { StorageMappingSection } from './StorageMappingSection'

jest.mock('@patternfly/react-core/deprecated', () => ({
  Select: ({ children }: any) => <div data-testid="select">{children}</div>,
  SelectOption: ({ children }: any) => <div>{children}</div>,
  SelectVariant: { single: 'single' },
}))

const defaultProps = {
  srcStorage: 'source-storage-1',
  dstStorage: '',
  setDstStorage: jest.fn(),
  options: [
    { id: 'stor1', value: 'storage1', text: 'Storage 1' },
    { id: 'stor2', value: 'storage2', text: 'Storage 2' },
    { id: 'stor3', value: 'storage3', text: 'Storage 3' },
  ],
}

describe('StorageMappingSection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('initial rendering', () => {
    it('renders section title correctly', () => {
      render(<StorageMappingSection {...defaultProps} />)

      expect(screen.getByText('Storage mapping')).toBeInTheDocument()
    })

    it('displays source storage value', () => {
      render(<StorageMappingSection {...defaultProps} />)

      expect(screen.getByText('Source storage')).toBeInTheDocument()
      expect(screen.getByText('source-storage-1')).toBeInTheDocument()
    })

    it('displays target storage label', () => {
      render(<StorageMappingSection {...defaultProps} />)

      expect(screen.getByText('Target storage')).toBeInTheDocument()
    })

    it('shows dash when destination storage is empty', () => {
      render(<StorageMappingSection {...defaultProps} />)

      expect(screen.getByText('-')).toBeInTheDocument()
    })

    it('shows destination storage value when set', () => {
      const props = { ...defaultProps, dstStorage: 'target-storage-1' }
      render(<StorageMappingSection {...props} />)

      expect(screen.getByText('target-storage-1')).toBeInTheDocument()
    })
  })

  describe('editing functionality', () => {
    it('shows edit button initially', () => {
      render(<StorageMappingSection {...defaultProps} />)

      expect(screen.getByText('Edit')).toBeInTheDocument()
    })

    it('hides edit button when in edit mode', () => {
      render(<StorageMappingSection {...defaultProps} />)

      const editButton = screen.getByText('Edit')
      fireEvent.click(editButton)

      expect(screen.queryByText('Edit')).not.toBeInTheDocument()
    })
  })

  describe('props validation', () => {
    it('handles empty source storage', () => {
      const props = { ...defaultProps, srcStorage: '' }
      render(<StorageMappingSection {...props} />)

      expect(screen.getAllByText('-')).toHaveLength(2)
    })

    it('handles pre-selected destination storage', () => {
      const props = { ...defaultProps, dstStorage: 'storage2' }
      render(<StorageMappingSection {...props} />)

      expect(screen.getByText('storage2')).toBeInTheDocument()
    })

    it('handles empty options array', () => {
      const props = { ...defaultProps, options: [] }
      render(<StorageMappingSection {...props} />)

      expect(screen.getByText('Storage mapping')).toBeInTheDocument()
    })
  })

  describe('component structure', () => {
    it('renders without crashing', () => {
      const { container } = render(<StorageMappingSection {...defaultProps} />)
      expect(container).toBeInTheDocument()
    })

    it('maintains consistent layout structure', () => {
      render(<StorageMappingSection {...defaultProps} />)

      expect(screen.getByText('Source storage')).toBeInTheDocument()
      expect(screen.getByText('Target storage')).toBeInTheDocument()
      expect(screen.getByText('Storage mapping')).toBeInTheDocument()
    })

    it('displays read-only source content correctly', () => {
      render(<StorageMappingSection {...defaultProps} />)

      expect(screen.getByText('source-storage-1')).toBeInTheDocument()
    })
  })

  describe('prop updates', () => {
    it('updates display when props change', () => {
      const { rerender } = render(<StorageMappingSection {...defaultProps} />)

      expect(screen.getByText('source-storage-1')).toBeInTheDocument()

      rerender(<StorageMappingSection {...defaultProps} srcStorage="new-source" dstStorage="new-target" />)

      expect(screen.getByText('new-source')).toBeInTheDocument()
      expect(screen.getByText('new-target')).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('handles special characters in storage names', () => {
      const props = {
        ...defaultProps,
        srcStorage: 'storage-with-special_chars!@#',
        dstStorage: 'target_storage-123',
      }
      render(<StorageMappingSection {...props} />)

      expect(screen.getByText('storage-with-special_chars!@#')).toBeInTheDocument()
      expect(screen.getByText('target_storage-123')).toBeInTheDocument()
    })
  })
})
