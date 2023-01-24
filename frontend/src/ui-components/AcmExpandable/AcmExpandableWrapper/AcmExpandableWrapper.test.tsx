/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { AcmCountCard } from '../../AcmCountCard/AcmCountCard'
import { AcmExpandableWrapper } from '../AcmExpandableWrapper/AcmExpandableWrapper'

describe('AcmExpandableWrapper', () => {
  const savedSearchWrapper = () => (
    <AcmExpandableWrapper headerLabel={'Saved Searches'} expandable={true} withCount={true}>
      <AcmCountCard
        cardHeader={{
          hasIcon: false,
          title: 'Test Search 1',
          description: 'Custom description with max amount of 60 characters',
          actions: [],
          onActionClick: (e) => {
            alert(e.target)
          },
        }}
        onCardClick={() => alert('cardclicked')}
        count={1234}
        countTitle="Results"
        isSelectable={true}
      />
    </AcmExpandableWrapper>
  )

  const suggestedSearchWrapper = () => (
    <AcmExpandableWrapper headerLabel={'Suggested Searches'} expandable={false} withCount={false}>
      <AcmCountCard
        cardHeader={{
          hasIcon: false,
          title: 'Test Search 1',
          description: 'Custom description with max amount of 60 characters',
          actions: [],
          onActionClick: (e) => {
            alert(e.target)
          },
        }}
        onCardClick={() => alert('cardclicked')}
        count={1234}
        countTitle="Results"
        isSelectable={true}
      />
    </AcmExpandableWrapper>
  )

  test('has zero accessibility defects', async () => {
    const { container } = render(savedSearchWrapper())
    expect(await axe(container)).toHaveNoViolations()
  })

  test('validates expandable wrapper renders in collapsed state', () => {
    const { getByText, container } = render(savedSearchWrapper())
    expect(getByText('Saved Searches')).toBeInTheDocument()
    expect(container.querySelector('.pf-c-button')).toBeInTheDocument()
  })

  test('toggles showAll button', () => {
    const { getByRole, getByText } = render(savedSearchWrapper())
    userEvent.click(getByRole('button'))
    expect(getByText('Show less')).toBeInTheDocument()
  })

  test('savedSearchCard shows count', () => {
    const { container } = render(savedSearchWrapper())
    expect(container.querySelector('.pf-c-title > span')).toBeInTheDocument()
  })

  test('suggestedSearchCard does not show count or show more button', () => {
    const { container } = render(suggestedSearchWrapper())
    expect(container.querySelector('.pf-c-title > span')).not.toBeInTheDocument()
    expect(container.querySelector('.pf-c-button')).not.toBeInTheDocument()
  })
})
