/* Copyright Contributors to the Open Cluster Management project */

import MultiTextInput from './MultiTextInput'
import { render } from '@testing-library/react'

const i18n = jest.fn((key) => key)

describe('MultiTextInput', () => {
  it('renders child rows', () => {
    const child = { id: 'mt-0', type: 'multitextMember', active: '' }
    const control = {
      id: 'mt',
      name: 'Keys',
      type: 'multitext',
      active: { multitextEntries: [''] },
      controlData: [child],
    }
    const { container } = render(
      <MultiTextInput
        controlId="mt"
        i18n={i18n}
        control={control}
        controlData={[control]}
        handleChange={jest.fn()}
        addButtonText="Add"
      />
    )
    expect(container.querySelector('.creation-view-controls-textbox')).toBeInTheDocument()
  })
})
