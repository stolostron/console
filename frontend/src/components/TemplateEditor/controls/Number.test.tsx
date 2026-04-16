/* Copyright Contributors to the Open Cluster Management project */

import NumberControl from './Number'
import { render } from '@testing-library/react'

const i18n = jest.fn((key) => key)

describe('Number', () => {
  it('renders without crashing', () => {
    const control = { id: 'n1', name: 'Replicas', type: 'number', active: 1 }
    const { container } = render(
      <NumberControl controlId="n1" i18n={i18n} control={control} controlData={[control]} handleChange={jest.fn()} />
    )
    expect(container.querySelector('.creation-view-controls-number')).toBeInTheDocument()
  })
})
