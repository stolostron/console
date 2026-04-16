/* Copyright Contributors to the Open Cluster Management project */

import BooleanControl from './Boolean'
import { render, screen } from '@testing-library/react'

const i18n = jest.fn((key) => key)

describe('Boolean', () => {
  it('renders true and false choices', () => {
    const control = { id: 'b1', name: 'Flag', type: 'boolean', isTrue: false }
    render(
      <BooleanControl controlId="b1" i18n={i18n} control={control} controlData={[control]} handleChange={jest.fn()} />
    )
    expect(screen.getByRole('radio', { name: /True/i })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /False/i })).toBeInTheDocument()
  })
})
