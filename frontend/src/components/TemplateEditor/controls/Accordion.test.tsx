/* Copyright Contributors to the Open Cluster Management project */

import Accordion from './Accordion'
import { render } from '@testing-library/react'

const i18n = jest.fn((key) => key)

describe('Accordion', () => {
  it('renders a section title when provided', () => {
    const { container } = render(
      <Accordion
        controlId="sec-1"
        i18n={i18n}
        control={{ id: 'sec-1', type: 'section', title: 'Details', content: [] }}
        controlData={[]}
      />
    )
    expect(container.textContent).toContain('Details')
  })
})
