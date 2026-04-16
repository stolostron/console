/* Copyright Contributors to the Open Cluster Management project */

import Prompt from './Prompt'
import { render } from '@testing-library/react'

const i18n = jest.fn((key) => key)

describe('Prompt', () => {
  it('returns null when prompts have no recognized type', () => {
    const control = { id: 'p1', type: 'text', prompts: {} }
    const { container } = render(<Prompt control={control} i18n={i18n} />)
    expect(container.firstChild).toBeNull()
  })
})
