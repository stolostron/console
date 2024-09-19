import { Meta } from '@storybook/react'
import { AcmSearchInput, SearchableColumn, SearchConstraint, SearchOperator } from './AcmSearchInput'
import { useState } from 'react'

const meta: Meta = {
  title: 'Search Input',
  component: AcmSearchInput,
}
export default meta

const pendingConstraints: SearchConstraint[] = [{ columnName: 'name' }, { columnName: 'namespace' }]
export function AcmSearchInputStory() {
  const [, setActiveConstraints] = useState<SearchConstraint[]>([])
  const columns: SearchableColumn[] = [
    { columnName: 'name', availableOperators: [SearchOperator.Equals] },
    { columnName: 'namespace', availableOperators: [SearchOperator.Equals] },
  ]
  return (
    <AcmSearchInput
      useAdvancedSearchPopper
      canAddConstraints
      setActiveConstraints={setActiveConstraints}
      pendingConstraints={pendingConstraints}
      searchableColumns={columns}
    />
  )
}
