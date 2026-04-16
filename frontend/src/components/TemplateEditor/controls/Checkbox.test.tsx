/* Copyright Contributors to the Open Cluster Management project */

import Checkbox from './Checkbox'
import { render, screen } from '@testing-library/react'

const i18n = jest.fn((key) => key)

describe('Checkbox', () => {
  it('renders a checkbox input', () => {
    const control = { id: 'c1', name: 'Accept', type: 'checkbox', active: false }
    render(<Checkbox controlId="c1" i18n={i18n} control={control} controlData={[control]} handleChange={jest.fn()} />)
    expect(screen.getByRole('checkbox', { name: 'Accept' })).toBeInTheDocument()
  })
})
