/* Copyright Contributors to the Open Cluster Management project */

import SingleSelect from './SingleSelect'
import { render } from '@testing-library/react'

const i18n = jest.fn((key) => key)

describe('SingleSelect', () => {
  it('renders without crashing', () => {
    const control = {
      id: 's1',
      name: 'Channel',
      type: 'singleselect',
      active: '',
      available: ['a', 'b'],
    }
    const { container } = render(
      <SingleSelect controlId="s1" i18n={i18n} control={control} controlData={[control]} handleChange={jest.fn()} />
    )
    expect(container.querySelector('.creation-view-controls-singleselect')).toBeInTheDocument()
  })
})
