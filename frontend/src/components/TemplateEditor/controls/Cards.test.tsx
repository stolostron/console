/* Copyright Contributors to the Open Cluster Management project */

import Cards from './Cards'
import { render } from '@testing-library/react'

describe('Cards', () => {
  it('renders without crashing', () => {
    const control = {
      id: 'cards1',
      name: 'Pick one',
      type: 'cards',
      available: ['a'],
      availableMap: {
        a: { id: 'a', title: 'Option A', text: 'Desc' },
      },
    }
    const { container } = render(
      <Cards control={control} i18n={jest.fn((k) => k)} handleChange={jest.fn()} controlData={[]} controlId="cards1" />
    )
    expect(container.querySelector('.creation-view-controls-card-container')).toBeInTheDocument()
  })
})
