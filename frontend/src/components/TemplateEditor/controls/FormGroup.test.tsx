/* Copyright Contributors to the Open Cluster Management project */

import FormGroup from './FormGroup'
import { render, screen } from '@testing-library/react'

const i18n = jest.fn((key) => key)

describe('FormGroup', () => {
  it('renders label and children', () => {
    const control = { id: 'f1', name: 'Name', type: 'text' }
    render(
      <FormGroup i18n={i18n} controlId="f1" control={control} controlData={[control]}>
        <input id="f1" aria-label="value" />
      </FormGroup>
    )
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByLabelText('value')).toBeInTheDocument()
  })
})
