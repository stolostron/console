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
})
