/* Copyright Contributors to the Open Cluster Management project */

import Form from './Form'
import { render } from '@testing-library/react'

const i18n = jest.fn((key) => key)

describe('Form', () => {
  it('renders the template control shell', () => {
    const noop = jest.fn()
    const { container } = render(
      <Form
        controlData={[]}
        originalControlData={[]}
        handleCancelCreate={noop}
        handleCreateResource={noop}
        handleControlChange={noop}
        handleGroupChange={noop}
        handleNewEditorMode={noop}
        i18n={i18n}
        isLoaded
      />
    )
    expect(container.querySelector('.creation-view-controls-container')).toBeInTheDocument()
  })
})
