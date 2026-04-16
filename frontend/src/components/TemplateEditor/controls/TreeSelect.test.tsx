/* Copyright Contributors to the Open Cluster Management project */

import TreeSelect from './TreeSelect'
import { render } from '@testing-library/react'

const i18n = jest.fn((key) => key)

describe('TreeSelect', () => {
  it('renders without crashing', () => {
    const control = {
      id: 'ts1',
      name: 'Tree',
      type: 'treeselect',
      active: '',
      available: [],
    }
    const { container } = render(
      <TreeSelect controlId="ts1" i18n={i18n} control={control} controlData={[control]} handleChange={jest.fn()} />
    )
    expect(container.querySelector('.creation-view-controls-treeselect')).toBeInTheDocument()
  })
})
