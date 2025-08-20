/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { screen } from '@testing-library/dom'
import { HighlightSearchText } from './HighlightSearchText'
import { getFragmentedTextMatcher } from '../lib/test-util'

describe('HighlightSearchText', () => {
  it('should render highlighted text when searchText matches part of the text', () => {
    render(<HighlightSearchText text="key=value" searchText="key" />)
    expect(screen.getByText('key')).toHaveAttribute('data-highlight', 'true')
    expect(screen.getByText('=value')).not.toHaveAttribute('data-highlight')
  })

  it('should render the full text without highlights when searchText is empty', () => {
    render(<HighlightSearchText text="key=value" searchText="" />)
    expect(screen.getByText('key=value')).not.toHaveAttribute('data-highlight')
  })

  it('should render a toggle button when supportsInequality is true', () => {
    render(<HighlightSearchText text="key=value" supportsInequality={true} toggleEquality={() => {}} />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('should truncate the text when text exceeds max length', () => {
    render(<HighlightSearchText text="very-very-very-very-very-very-long-key=value" />)
    // Text may be fragmented across multiple elements due to truncation
    expect(
      screen.getAllByText(getFragmentedTextMatcher('very-very-very-very-very-very-long-key=value'))[0]
    ).toBeInTheDocument()
  })

  it('should render the full text when it does not exceed max length', () => {
    render(<HighlightSearchText text="key=value" />)
    expect(screen.getByText('key=value')).toBeInTheDocument()
  })
  it('should render null when no text is provided', () => {
    const { container } = render(<HighlightSearchText />)
    expect(container.firstChild).toBeNull()
  })

  it('should render links with data-link attribute when isLink is true', () => {
    render(<HighlightSearchText text="example.com" isLink={true} />)
    expect(screen.getByText('example.com')).toHaveAttribute('data-link', 'true')
  })

  it('should render highlighted links when isLink is true and searchText matches', () => {
    render(<HighlightSearchText text="example.com" searchText="example" isLink={true} />)
    expect(screen.getByText('example')).toHaveAttribute('data-highlight', 'true')
    expect(screen.getByText('example')).toHaveAttribute('data-link', 'true')
    expect(screen.getByText('.com')).toHaveAttribute('data-link', 'true')
    expect(screen.getByText('.com')).not.toHaveAttribute('data-highlight')
  })

  describe('Fuzzy highlighting', () => {
    it('should use exact matching when found', () => {
      render(<HighlightSearchText text="operation" searchText="oper" useFuzzyHighlighting={true} />)
      expect(screen.getByText('oper')).toHaveAttribute('data-highlight', 'true')
      expect(screen.getByText('ation')).not.toHaveAttribute('data-highlight')
    })

    it('should fall back to fuzzy highlighting when exact match not found', () => {
      const { container } = render(
        <HighlightSearchText text="operation" searchText="opr" useFuzzyHighlighting={true} />
      )

      // Look for highlighted elements instead of specific text
      const highlightedElements = container.querySelectorAll('[data-highlight="true"]')
      expect(highlightedElements.length).toBeGreaterThan(0)

      // Check that we have the expected highlighted text content
      // With substring matching, "opr" should highlight all o, p, r characters in "operation"
      // This includes both 'o' characters, so we get "opro"
      const highlightedText = Array.from(highlightedElements)
        .map((el) => el.textContent)
        .join('')
      expect(highlightedText).toBe('opro')
    })

    it('should highlight fuzzy matches in sequence', () => {
      render(<HighlightSearchText text="operation" searchText="ope" useFuzzyHighlighting={true} />)
      expect(screen.getByText('ope')).toHaveAttribute('data-highlight', 'true')
      expect(screen.getByText('ration')).not.toHaveAttribute('data-highlight')
    })

    it('should highlight all matching substrings regardless of order', () => {
      const { container } = render(
        <HighlightSearchText text="operation" searchText="otn" useFuzzyHighlighting={true} />
      )

      // With substring matching, all 'o', 't', 'n' characters should be highlighted
      const highlightedElements = container.querySelectorAll('[data-highlight="true"]')
      expect(highlightedElements.length).toBeGreaterThan(0)

      // Check that we highlight all instances of o, t, n
      // This includes both 'o' characters, so we get "oton"
      const highlightedText = Array.from(highlightedElements)
        .map((el) => el.textContent)
        .join('')
      expect(highlightedText).toBe('oton')
    })

    it('should highlight repeated characters multiple times', () => {
      const { container } = render(<HighlightSearchText text="pepper" searchText="pp" useFuzzyHighlighting={true} />)

      // Both 'p' characters should be highlighted
      const highlightedElements = container.querySelectorAll('[data-highlight="true"]')
      const highlightedText = Array.from(highlightedElements)
        .map((el) => el.textContent)
        .join('')
      expect(highlightedText).toBe('pp')
    })

    it('should not highlight when fuzzy highlighting is disabled', () => {
      render(<HighlightSearchText text="operation" searchText="opr" useFuzzyHighlighting={false} />)
      expect(screen.getByText('operation')).not.toHaveAttribute('data-highlight')
    })

    it('should work with links and fuzzy highlighting', () => {
      const { container } = render(
        <HighlightSearchText text="operation.com" searchText="opr" isLink={true} useFuzzyHighlighting={true} />
      )

      // Look for highlighted elements
      const highlightedElements = container.querySelectorAll('[data-highlight="true"]')
      expect(highlightedElements.length).toBeGreaterThan(0)

      // Check that we have the expected highlighted text content
      // This includes all 'o' characters (3 total: positions 0, 7, 11) plus 'p' and 'r', so we get "oproo"
      const highlightedText = Array.from(highlightedElements)
        .map((el) => el.textContent)
        .join('')
      expect(highlightedText).toBe('oproo')

      // Check that link attributes are present
      const linkElements = container.querySelectorAll('[data-link="true"]')
      expect(linkElements.length).toBeGreaterThan(0)
    })

    it('should handle case-insensitive fuzzy matching', () => {
      render(<HighlightSearchText text="Operation" searchText="oper" useFuzzyHighlighting={true} />)
      expect(screen.getByText('Oper')).toHaveAttribute('data-highlight', 'true')
      expect(screen.getByText('ation')).not.toHaveAttribute('data-highlight')
    })
  })
})
