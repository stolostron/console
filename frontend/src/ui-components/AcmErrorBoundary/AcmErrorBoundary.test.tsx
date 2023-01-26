/* Copyright Contributors to the Open Cluster Management project */

import { useState, useEffect } from 'react'
import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { AcmErrorBoundary } from './AcmErrorBoundary'
import { AcmButton } from '../AcmButton/AcmButton'

describe('AcmErrorBoundary', () => {
  const ErrorBoundary = () => {
    return (
      <AcmErrorBoundary actions={<AcmButton>Refresh page</AcmButton>}>
        <ErrorButton />
        <div>Hello</div>
      </AcmErrorBoundary>
    )
  }

  const ErrorButton = () => {
    const [error, setError] = useState<boolean>(false)

    useEffect(() => {
      if (error) {
        const object = '{"foo": "ba}'
        JSON.parse(object)
      }
    }, [error])

    return <AcmButton onClick={() => setError(true)}>Throw error</AcmButton>
  }
  test('renders', async () => {
    const { getByText, container } = render(<ErrorBoundary />)
    expect(getByText('Throw error')).toBeInTheDocument()
    userEvent.click(getByText('Throw error'))
    await waitFor(() => expect(getByText('Uh oh, something went wrong...')).toBeInTheDocument())
    expect(getByText('Refresh page')).toBeInTheDocument()
    expect(getByText('See error details...')).toBeInTheDocument()
    userEvent.click(getByText('See error details...'))
    expect(getByText('SyntaxError')).toBeInTheDocument()
    expect(getByText('Description:')).toBeInTheDocument()
    expect(getByText('Component trace:')).toBeInTheDocument()
    expect(getByText('Stack trace:')).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  })
})
