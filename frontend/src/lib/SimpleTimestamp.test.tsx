/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'
import SimpleTimestamp from './SimpleTimestamp'

describe('SimpleTimestamp', () => {
  const timestamp = '2025-01-03T18:53:59.000Z'

  test('renders the component with a valid timestamp', () => {
    render(<SimpleTimestamp timestamp={timestamp} />)
    expect(screen.getByText('Jan 3, 2025, 1:53 PM')).toBeInTheDocument()
  })

  test('renders the component with an invalid timestamp', () => {
    const invalidTimestamp = ''
    render(<SimpleTimestamp timestamp={invalidTimestamp} />)
    expect(screen.getByText('Invalid Date')).toBeInTheDocument()
  })

  test('renders the component with a numeric timestamp', () => {
    const numericTimestamp = new Date(timestamp).getTime() // Equivalent to '2025-01-03T18:53:59Z'
    render(<SimpleTimestamp timestamp={numericTimestamp} />)
    expect(screen.getByText('Jan 3, 2025, 1:53 PM')).toBeInTheDocument()
  })

  test('renders the component with a Date object timestamp', () => {
    const dateObjectTimestamp = new Date(timestamp)
    render(<SimpleTimestamp timestamp={dateObjectTimestamp} />)
    expect(screen.getByText('Jan 3, 2025, 1:53 PM')).toBeInTheDocument()
  })
})
