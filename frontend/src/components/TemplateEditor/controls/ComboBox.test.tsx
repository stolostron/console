/* Copyright Contributors to the Open Cluster Management project */

import ComboBox from './ComboBox'
import { render } from '@testing-library/react'

const i18n = jest.fn((key) => key)

describe('ComboBox', () => {
  it('renders without crashing', () => {
    const control = {
      id: 'cb1',
      name: 'Channel',
      type: 'combobox',
      active: '',
      available: ['stable', 'fast'],
    }
    const { container } = render(
      <ComboBox controlId="cb1" i18n={i18n} control={control} controlData={[control]} handleControlChange={jest.fn()} />
    )
    expect(container.querySelector('.creation-view-controls-combobox')).toBeInTheDocument()
  })
})
