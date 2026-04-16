/* Copyright Contributors to the Open Cluster Management project */

import Values from './Values'
import { render } from '@testing-library/react'

const i18n = jest.fn((key) => key)

describe('Values', () => {
  it('renders without crashing', () => {
    const control = { id: 'v1', name: 'Values', type: 'values', active: [] }
    const { container } = render(
      <Values controlId="v1" i18n={i18n} control={control} controlData={[control]} handleChange={jest.fn()} />
    )
    expect(container.querySelector('.creation-view-controls-labels')).toBeInTheDocument()
  })
})
