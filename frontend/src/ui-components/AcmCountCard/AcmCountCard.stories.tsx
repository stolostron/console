/* Copyright Contributors to the Open Cluster Management project */

import { css } from '@emotion/css'
import { Meta } from '@storybook/react'
import { KeyboardEvent } from 'react'

import { AcmCountCard } from './AcmCountCard'

const meta: Meta = {
  title: 'Count Card',
  component: AcmCountCard,
}
export default meta

const handleCardClick = () => {
  alert('Card clicked')
}

const handleKeyPress = (e: KeyboardEvent<Element>) => {
  alert(`'${e.key}' key pressed, (charCode: ${e.charCode})`)
}

const suggestedSearchCardActions = [{ text: 'Share', handleAction: () => alert('share action') }]
const savedSearchCardActions = [
  { text: 'Edit', handleAction: () => alert('edit action') },
  { text: 'Share', handleAction: () => alert('share action') },
  { text: 'Delete', handleAction: () => alert('delete action') },
]

const root = css({
  '& article': {
    margin: '1rem',
  },
})

export const SuggestedSearchCard = () => {
  return (
    <div className={root}>
      <AcmCountCard
        cardHeader={{
          hasIcon: true,
          title: 'Workloads',
          description: 'A pre-defined search to help you review your workloads',
          actions: [...suggestedSearchCardActions],
          onActionClick: (e) => {
            alert(e.target)
          },
        }}
        onCardClick={handleCardClick}
        count={13000}
        countTitle="Results"
        isSelectable={true}
        onKeyPress={(e) => handleKeyPress(e)}
      />
      <AcmCountCard
        cardHeader={{
          hasIcon: true,
          title: 'Unhealthy Pods',
          description: 'Show pods with unhealthy status',
          actions: [...suggestedSearchCardActions],
          onActionClick: (e) => {
            alert(e.target)
          },
        }}
        onCardClick={handleCardClick}
        count={0}
        countTitle="Unhealthy"
        isSelectable={true}
        onKeyPress={(e) => handleKeyPress(e)}
      />
    </div>
  )
}

export const SavedSearchCard = () => {
  return (
    <div className={root}>
      <AcmCountCard
        cardHeader={{
          hasIcon: false,
          title: 'long name long name long name long name long names',
          description:
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed feugiat vitae ligula sit amet placerat.',
          actions: [...savedSearchCardActions],
          onActionClick: (e) => {
            alert(e.target)
          },
        }}
        onCardClick={handleCardClick}
        count={1234}
        countTitle="Results"
        isSelectable={true}
        onKeyPress={(e) => handleKeyPress(e)}
      />
      <AcmCountCard
        cardHeader={{
          hasIcon: false,
          title: 'Test Search 2',
          description: 'Custom description with max amount of 60 characters',
          actions: [...savedSearchCardActions],
          onActionClick: (e) => {
            alert(e.target)
          },
        }}
        onCardClick={handleCardClick}
        count={0}
        countTitle="Results"
        isSelectable={true}
        onKeyPress={(e) => handleKeyPress(e)}
      />
    </div>
  )
}

export const CardSkeleton = () => {
  return (
    <div className={root}>
      <AcmCountCard loading />
      <AcmCountCard loading />
      <AcmCountCard loading />
    </div>
  )
}
