/* Copyright Contributors to the Open Cluster Management project */
import { Meta } from '@storybook/react'
import { AcmSearchInput, SearchableColumn, SearchConstraint, SearchOperator } from './AcmSearchInput'
import { useState } from 'react'

const meta: Meta = {
  title: 'Search Input',
  component: AcmSearchInput,
}
export default meta

const pendingConstraints: SearchConstraint[] = [{ columnId: 'name' }, { columnId: 'namespace' }]
export function AcmSearchInputStory() {
  const [, setActiveConstraints] = useState<SearchConstraint[]>([])
  const columns: SearchableColumn[] = [
    { columnId: 'name', availableOperators: [SearchOperator.Equals] },
    { columnId: 'namespace', availableOperators: [SearchOperator.Equals] },
    {
      columnId: 'distribution',
      columnDisplayName: 'distribution',
      availableOperators: [
        SearchOperator.Equals,
        SearchOperator.GreaterThan,
        SearchOperator.LessThan,
        SearchOperator.GreaterThanOrEqualTo,
        SearchOperator.LessThanOrEqualTo,
        SearchOperator.NotEquals,
      ],
    },
  ]
  return (
    <AcmSearchInput
      useAdvancedSearchPopper
      placeholder="Search"
      canAddConstraints
      setActiveConstraints={setActiveConstraints}
      pendingConstraints={pendingConstraints}
      searchableColumns={columns}
    />
  )
}
