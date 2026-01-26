/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import { ClusterSetAccessLevel } from './ClusterSetAccessLevel'

// Mock the translation hook
jest.mock('../../../../lib/acm-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

describe('ClusterSetAccessLevel', () => {
  it('renders the component with correct text', () => {
    render(<ClusterSetAccessLevel />)

    expect(
      screen.getByText('This role assignment will apply to all current and future resources in all clusters.')
    ).toBeInTheDocument()
  })

  it('renders with correct styling', () => {
    const { container } = render(<ClusterSetAccessLevel />)

    const panel = container.querySelector('.pf-v6-c-panel')
    expect(panel).toHaveStyle({
      backgroundColor: 'var(--pf-t--global--background--color--secondary--default)',
    })
  })

  it('has proper structure with Panel, PanelMain, and PanelMainBody', () => {
    const { container } = render(<ClusterSetAccessLevel />)

    const panel = container.querySelector('.pf-v6-c-panel')
    const panelMain = container.querySelector('.pf-v6-c-panel__main')
    const panelMainBody = container.querySelector('.pf-v6-c-panel__main-body')

    expect(panel).toBeInTheDocument()
    expect(panelMain).toBeInTheDocument()
    expect(panelMainBody).toBeInTheDocument()
  })
})
