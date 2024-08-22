/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { AcmExpandableSection } from './AcmExpandableSection'

describe('AcmExpandableSection', () => {
  test('renders in a collapsed state', () => {
    const { getByText, container } = render(
      <AcmExpandableSection label="Expandable Label" summary="Summary about this section">
        Section content
      </AcmExpandableSection>
    )
    expect(getByText('Expandable Label - Summary about this section')).toBeInTheDocument()
    expect(container.querySelector('.pf-v5-c-expandable-section__content')).not.toBeVisible()
  })
  test('can be expanded', () => {
    const { getByRole, container } = render(
      <AcmExpandableSection label="Expandable Label" summary="Summary about this section">
        Section content
      </AcmExpandableSection>
    )
    userEvent.click(getByRole('button'))
    expect(container.querySelector('.pf-v5-c-expandable-section__content')).toBeVisible()
  })
  test('has zero accessibility defects', async () => {
    const { getByRole, container } = render(
      <AcmExpandableSection label="Expandable Label" summary="Summary about this section">
        Section content
      </AcmExpandableSection>
    )
    expect(await axe(container)).toHaveNoViolations()
    userEvent.click(getByRole('button'))
    expect(await axe(container)).toHaveNoViolations()
  })
  test('can be hidden', async () => {
    const { container } = render(
      <AcmExpandableSection label="Expandable Label" summary="Summary about this section" hidden={true}>
        Section content
      </AcmExpandableSection>
    )
    expect(container).toMatchInlineSnapshot('<div />')
  })
  test('Handles expanded prop change on rerender', () => {
    const { rerender, container } = render(
      <AcmExpandableSection expanded={true} label="Expandable Label" summary="Summary about this section">
        Section content
      </AcmExpandableSection>
    )
    expect(container.querySelector('.pf-v5-c-expandable-section.pf-m-expanded')).toBeInTheDocument()
    rerender(
      <AcmExpandableSection expanded={false} label="Expandable Label" summary="Summary about this section">
        Section content
      </AcmExpandableSection>
    )
    expect(container.querySelector('.pf-v5-c-expandable-section.pf-m-expanded')).not.toBeInTheDocument()
  })
})
