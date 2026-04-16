/* Copyright Contributors to the Open Cluster Management project */

import Labels from './Labels'
import { render } from '@testing-library/react'

const i18n = jest.fn((key) => key)

describe('Labels', () => {
  it('renders without crashing', () => {
    const control = { id: 'l1', name: 'Labels', type: 'labels', active: [] }
    const { container } = render(
      <Labels controlId="l1" i18n={i18n} control={control} controlData={[control]} handleChange={jest.fn()} />
    )
    expect(container.querySelector('.creation-view-controls-labels')).toBeInTheDocument()
  })
})
