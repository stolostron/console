/* Copyright Contributors to the Open Cluster Management project */

import { render, waitFor } from '@testing-library/react'
import { axe } from 'jest-axe'
import { AcmExpandableCard } from './AcmExpandableCard'
import { clickElement } from '~/lib/test-util'

describe('AcmExpandableCard', () => {
  test('renders', async () => {
    const { container, getByText, getByRole, queryByText } = render(
      <AcmExpandableCard title="Status">Body</AcmExpandableCard>
    )
    expect(await axe(container)).toHaveNoViolations()
    expect(getByText('Status')).toBeInTheDocument()
    expect(getByText('Body')).toBeInTheDocument()
    await clickElement(getByRole('button'))
    await waitFor(() => expect(queryByText('Body')).toBeNull())
    await clickElement(getByRole('button'))
    await waitFor(() => expect(getByText('Body')).toBeInTheDocument())
  })
})
