/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { axe } from 'jest-axe'
import { ExampleChipGroup } from './AcmChipGroup.stories'

describe('AcmChipGroup', () => {
  test('renders', () => {
    const { getByRole } = render(<ExampleChipGroup />)
    expect(getByRole('button', { name: '4 more' })).toBeInTheDocument()
    getByRole('button', { name: '4 more' }).click()
    expect(getByRole('button', { name: 'Show less' })).toBeInstanceOf(HTMLButtonElement)
  })
  test('has zero accessibility defects', async () => {
    const { container } = render(<ExampleChipGroup />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
