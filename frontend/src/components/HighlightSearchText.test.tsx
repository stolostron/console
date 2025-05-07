/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { screen } from '@testing-library/dom'
import { HighlightSearchText } from './HighlightSearchText'

const highlightCssClass = 'css-uh6mpl' // Example class name for highlighted text
describe('HighlightSearchText', () => {
  it('should render highlighted text when searchText matches part of the text', () => {
    render(<HighlightSearchText text="key=value" searchText="key" />)
    expect(screen.getByText('key')).toHaveClass(highlightCssClass)
    expect(screen.getByText('=value')).not.toHaveClass(highlightCssClass)
  })

  it('should render the full text without highlights when searchText is empty', () => {
    render(<HighlightSearchText text="key=value" searchText="" />)
    expect(screen.getByText('key=value')).not.toHaveClass(highlightCssClass)
  })

  it('should render a toggle button when supportsInequality is true', () => {
    render(<HighlightSearchText text="key=value" supportsInequality={true} toggleEquality={() => {}} />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('should truncate the text when isTruncate is true and text exceeds max length', () => {
    render(<HighlightSearchText text="very-very-very-long-key=value" isTruncate={true} />)
    expect(screen.getByText('very-very..ery-long-key=value')).toBeInTheDocument()
  })

  it('should render the full text when isTruncate is false', () => {
    render(<HighlightSearchText text="key=value" isTruncate={false} />)
    expect(screen.getByText('key=value')).toBeInTheDocument()
  })

  it('should render null when no text is provided', () => {
    const { container } = render(<HighlightSearchText />)
    expect(container.firstChild).toBeNull()
  })
})
