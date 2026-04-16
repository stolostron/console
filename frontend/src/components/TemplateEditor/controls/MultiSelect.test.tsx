/* Copyright Contributors to the Open Cluster Management project */

import MultiSelect from './MultiSelect'
import { render } from '@testing-library/react'

const i18n = jest.fn((key) => key)

describe('MultiSelect', () => {
  it('renders without crashing', () => {
    const control = {
      id: 'ms1',
      name: 'Clusters',
      type: 'multiselect',
      active: [],
      available: ['one', 'two'],
    }
    const { container } = render(
      <MultiSelect controlId="ms1" i18n={i18n} control={control} controlData={[control]} handleChange={jest.fn()} />
    )
    expect(container.querySelector('.creation-view-controls-singleselect')).toBeInTheDocument()
  })
})
