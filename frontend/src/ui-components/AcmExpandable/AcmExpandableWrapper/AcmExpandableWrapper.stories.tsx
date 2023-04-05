/* Copyright Contributors to the Open Cluster Management project */

import { Meta } from '@storybook/react'

import { AcmCountCard } from '../../AcmCountCard/AcmCountCard'
import { AcmTile } from '../../AcmTile/AcmTile'
import { AcmExpandableWrapper } from './AcmExpandableWrapper'
const meta: Meta = {
  title: 'Expandable',
  component: AcmExpandableWrapper,
}
export default meta

const suggestedSearchCardActions = [
  {
    text: 'Share',
    handleAction: () => alert('share action'),
  },
]
const savedSearchCardActions = [
  { text: 'Edit', handleAction: () => alert('edit action') },
  { text: 'Share', handleAction: () => alert('share action') },
  { text: 'Delete', handleAction: () => alert('delete action') },
]

export const ExpandableSavedSearchWrapper = () => {
  const count = [1, 2, 3, 4, 5, 6, 7]
  const renderAcmCountCards = count.map((n) => {
    return (
      <AcmCountCard
        key={n}
        cardHeader={{
          hasIcon: false,
          title: 'Saved search title with a max length of 50 chars',
          description:
            'Custom description with max length of 120 characters - Custom description with max length of 120 characters - Custom de',
          actions: [...savedSearchCardActions],
          onActionClick: (e) => {
            alert(e.target)
          },
        }}
        onCardClick={() => alert('cardclicked')}
        count={0}
        countTitle="Results"
        isSelectable={true}
      />
    )
  })
  return (
    <AcmExpandableWrapper headerLabel={'Saved searches'} withCount={true} expandable={true}>
      {renderAcmCountCards}
    </AcmExpandableWrapper>
  )
}

export const nonExpandableSuggestedSearchWrapper = () => {
  const count = [1, 2, 3]
  const renderAcmCountCards = count.map((n) => {
    return (
      <AcmCountCard
        key={n}
        cardHeader={{
          hasIcon: true,
          title: 'Suggested search title',
          description: 'Custom description with max length of 100 characters',
          actions: [...suggestedSearchCardActions],
          onActionClick: (e) => {
            alert(e.target)
          },
        }}
        onCardClick={() => alert('cardclicked')}
        count={0}
        countTitle="Results"
        isSelectable={true}
      />
    )
  })
  return (
    <AcmExpandableWrapper headerLabel={'Suggested search templates'} withCount={false} expandable={false}>
      {renderAcmCountCards}
    </AcmExpandableWrapper>
  )
}

export const ExpandableRelatedResWrapper = () => {
  const count = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  const renderAcmTiles = count.map((n) => {
    return (
      <AcmTile
        key={n}
        loading={false}
        isSelected={false}
        title={''}
        onClick={() => alert('tile clicked')}
        relatedResourceData={{ count: 99999, kind: 'veryLongKindNameForTestingPurposes' }}
      />
    )
  })
  return (
    <AcmExpandableWrapper withCount={false} expandable={true}>
      {renderAcmTiles}
    </AcmExpandableWrapper>
  )
}
