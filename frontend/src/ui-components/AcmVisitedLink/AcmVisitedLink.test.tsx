/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { AcmVisitedLink } from './AcmVisitedLink'

const visitedLinksKey = 'visited-links'

// Helper to create storage item with timestamp (matching the format used by setItemWithExpiration)
function createStorageItem(value: string): string {
  return JSON.stringify({
    value,
    timestamp: Date.now(),
  })
}

describe('AcmVisitedLink', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  test('renders a link with string to prop', () => {
    const { getByRole } = render(
      <MemoryRouter>
        <AcmVisitedLink to="/clusters">Clusters</AcmVisitedLink>
      </MemoryRouter>
    )
    expect(getByRole('link')).toBeInTheDocument()
    expect(getByRole('link')).toHaveTextContent('Clusters')
    expect(getByRole('link')).toHaveAttribute('href', '/clusters')
  })

  test('renders a link with object to prop', () => {
    const { getByRole } = render(
      <MemoryRouter>
        <AcmVisitedLink to={{ pathname: '/applications', search: '?filter=test' }}>Applications</AcmVisitedLink>
      </MemoryRouter>
    )
    expect(getByRole('link')).toBeInTheDocument()
    expect(getByRole('link')).toHaveTextContent('Applications')
    expect(getByRole('link')).toHaveAttribute('href', '/applications?filter=test')
  })

  test('applies visited class when link was previously visited', () => {
    // Pre-populate localStorage with visited link
    localStorage.setItem(visitedLinksKey, createStorageItem(JSON.stringify(['/clusters'])))

    const { getByRole } = render(
      <MemoryRouter>
        <AcmVisitedLink to="/clusters">Clusters</AcmVisitedLink>
      </MemoryRouter>
    )
    expect(getByRole('link')).toHaveAttribute('class', expect.stringContaining('css-'))
  })

  test('does not apply visited class when link was not visited', () => {
    const { getByRole } = render(
      <MemoryRouter>
        <AcmVisitedLink to="/clusters">Clusters</AcmVisitedLink>
      </MemoryRouter>
    )
    expect(getByRole('link')).toHaveAttribute('class', '')
  })

  test('stores visited link in localStorage on click', async () => {
    render(
      <MemoryRouter>
        <AcmVisitedLink to="/clusters">Clusters</AcmVisitedLink>
      </MemoryRouter>
    )
    await userEvent.click(screen.getByRole('link'))

    const stored = localStorage.getItem(visitedLinksKey)
    expect(stored).not.toBeNull()
    const parsed = JSON.parse(stored!)
    expect(JSON.parse(parsed.value)).toContain('/clusters')
  })

  test('adds to existing visited links on click', async () => {
    // Pre-populate with existing visited link
    localStorage.setItem(visitedLinksKey, createStorageItem(JSON.stringify(['/applications'])))

    render(
      <MemoryRouter>
        <AcmVisitedLink to="/clusters">Clusters</AcmVisitedLink>
      </MemoryRouter>
    )
    await userEvent.click(screen.getByRole('link'))

    const stored = localStorage.getItem(visitedLinksKey)
    const parsed = JSON.parse(stored!)
    const visitedLinks = JSON.parse(parsed.value)
    expect(visitedLinks).toContain('/applications')
    expect(visitedLinks).toContain('/clusters')
  })

  test('does not add duplicate visited links', async () => {
    // Pre-populate with the same link
    localStorage.setItem(visitedLinksKey, createStorageItem(JSON.stringify(['/clusters'])))

    render(
      <MemoryRouter>
        <AcmVisitedLink to="/clusters">Clusters</AcmVisitedLink>
      </MemoryRouter>
    )
    await userEvent.click(screen.getByRole('link'))

    const stored = localStorage.getItem(visitedLinksKey)
    const parsed = JSON.parse(stored!)
    const visitedLinks = JSON.parse(parsed.value)
    expect(visitedLinks.filter((link: string) => link === '/clusters')).toHaveLength(1)
  })

  test('calls original onClick handler', async () => {
    const mockOnClick = jest.fn()

    render(
      <MemoryRouter>
        <AcmVisitedLink to="/clusters" onClick={mockOnClick}>
          Clusters
        </AcmVisitedLink>
      </MemoryRouter>
    )
    await userEvent.click(screen.getByRole('link'))

    expect(mockOnClick).toHaveBeenCalledTimes(1)
  })

  test('handles invalid JSON in localStorage gracefully on render', () => {
    // Store invalid JSON that will fail parsing
    localStorage.setItem(visitedLinksKey, 'invalid-json')

    const { getByRole } = render(
      <MemoryRouter>
        <AcmVisitedLink to="/clusters">Clusters</AcmVisitedLink>
      </MemoryRouter>
    )
    // Should render without visited class since parsing failed
    expect(getByRole('link')).toHaveAttribute('class', '')
  })

  test('handles invalid JSON in localStorage gracefully on click', async () => {
    // Store invalid JSON that will fail parsing
    localStorage.setItem(
      visitedLinksKey,
      createStorageItem('not-an-array') // Valid storage format but invalid visited links format
    )

    render(
      <MemoryRouter>
        <AcmVisitedLink to="/clusters">Clusters</AcmVisitedLink>
      </MemoryRouter>
    )
    // Click should not throw
    await userEvent.click(screen.getByRole('link'))

    // Should have stored the new link
    const stored = localStorage.getItem(visitedLinksKey)
    expect(stored).not.toBeNull()
  })

  test('handles object to prop with pathname for visited tracking', async () => {
    render(
      <MemoryRouter>
        <AcmVisitedLink to={{ pathname: '/applications' }}>Applications</AcmVisitedLink>
      </MemoryRouter>
    )
    await userEvent.click(screen.getByRole('link'))

    const stored = localStorage.getItem(visitedLinksKey)
    const parsed = JSON.parse(stored!)
    expect(JSON.parse(parsed.value)).toContain('/applications')
  })

  test('applies visited class with object to prop', () => {
    localStorage.setItem(visitedLinksKey, createStorageItem(JSON.stringify(['/applications'])))

    const { getByRole } = render(
      <MemoryRouter>
        <AcmVisitedLink to={{ pathname: '/applications' }}>Applications</AcmVisitedLink>
      </MemoryRouter>
    )
    expect(getByRole('link')).toHaveAttribute('class', expect.stringContaining('css-'))
  })

  test('handles non-array stored value gracefully', () => {
    // Store a non-array value
    localStorage.setItem(visitedLinksKey, createStorageItem(JSON.stringify({ key: 'value' })))

    const { getByRole } = render(
      <MemoryRouter>
        <AcmVisitedLink to="/clusters">Clusters</AcmVisitedLink>
      </MemoryRouter>
    )
    // Should render without visited class since stored value is not an array
    expect(getByRole('link')).toHaveAttribute('class', '')
  })

  test('has zero accessibility defects', async () => {
    const { container } = render(
      <MemoryRouter>
        <AcmVisitedLink to="/clusters">Clusters</AcmVisitedLink>
      </MemoryRouter>
    )
    expect(await axe(container)).toHaveNoViolations()
  })

  test('has zero accessibility defects with visited state', async () => {
    localStorage.setItem(visitedLinksKey, createStorageItem(JSON.stringify(['/clusters'])))

    const { container } = render(
      <MemoryRouter>
        <AcmVisitedLink to="/clusters">Clusters</AcmVisitedLink>
      </MemoryRouter>
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
