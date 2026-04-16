/* Copyright Contributors to the Open Cluster Management project */

import Wizard from './Wizard'
import { render } from '@testing-library/react'

const i18n = jest.fn((key) => key)

describe('Wizard', () => {
  it('renders wizard chrome', () => {
    const steps = [
      {
        title: { id: 'step-1', type: 'step', title: 'First' },
        sections: [{ title: { id: 'sec-1', type: 'section' }, content: [] }],
      },
    ]
    const { container } = render(
      <Wizard
        i18n={i18n}
        steps={steps}
        controlData={[]}
        controlClasses="test-wizard"
        setWizardRef={jest.fn()}
        handleCreateResource={jest.fn()}
        handleCancelCreate={jest.fn()}
        renderControlSections={() => <div data-testid="sections" />}
        renderNotifications={() => null}
      />
    )
    expect(container.querySelector('.pf-v6-c-wizard')).toBeInTheDocument()
  })
})
