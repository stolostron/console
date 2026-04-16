/* Copyright Contributors to the Open Cluster Management project */

import TextArea from './TextArea'
import { render } from '@testing-library/react'

const i18n = jest.fn((key) => key)

describe('TextArea', () => {
  it('renders without crashing', () => {
    const control = { id: 'ta1', name: 'YAML snippet', type: 'textarea', active: '' }
    const { container } = render(
      <TextArea controlId="ta1" i18n={i18n} control={control} controlData={[control]} handleChange={jest.fn()} />
    )
    expect(container.querySelector('textarea')).toBeInTheDocument()
  })
})
