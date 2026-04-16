/* Copyright Contributors to the Open Cluster Management project */

import TextInput from './TextInput'
import { render } from '@testing-library/react'

const i18n = jest.fn((key) => key)

describe('TextInput', () => {
  it('renders without crashing', () => {
    const control = { id: 't1', name: 'Name', type: 'text', active: '' }
    const { container } = render(
      <TextInput controlId="t1" i18n={i18n} control={control} controlData={[control]} handleChange={jest.fn()} />
    )
    expect(container.querySelector('input')).toBeInTheDocument()
  })
})
