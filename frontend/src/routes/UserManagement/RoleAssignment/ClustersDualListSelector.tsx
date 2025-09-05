import { DualListSelector, DualListSelectorTreeItemData } from '@patternfly/react-core'
import React, { useCallback, useEffect } from 'react'

type ClustersDualListSelectorProps = {
  onChoseOptions: (values: { id: string; value: string }[]) => void
  clusterSets: ClusterSet[]
}

type Cluster = {
  name: string
  namespaces?: string[]
}

type ClusterSet = {
  name: string
  clusters?: Cluster[]
}

const ClustersDualListSelector = ({ onChoseOptions, clusterSets }: ClustersDualListSelectorProps) => {
  const [availableOptions, setAvailableOptions] = React.useState<DualListSelectorTreeItemData[]>(
    clusterSets.map((clusterSet) => ({
      id: clusterSet.name,
      text: clusterSet.name,
      isChecked: false,
      checkProps: { 'aria-label': clusterSet.name },
      hasBadge: true,
      badgeProps: { isRead: true },
      children: clusterSet.clusters?.map((cluster) => ({
        id: cluster.name,
        text: cluster.name,
        isChecked: false,
        hasBadge: true,
        checkProps: { 'aria-label': cluster.name },
        children: cluster.namespaces?.map((namespace) => ({
          id: namespace,
          text: namespace,
          isChecked: false,
          checkProps: { 'aria-label': namespace },
        })),
      })),
    }))
  )

  const [chosenOptions, setChosenOptions] = React.useState<DualListSelectorTreeItemData[]>([])

  const onListChange = useCallback(
    (
      event: React.MouseEvent<HTMLElement>,
      newAvailableOptions: DualListSelectorTreeItemData[],
      newChosenOptions: DualListSelectorTreeItemData[]
    ) => {
      setAvailableOptions(newAvailableOptions.sort())
      setChosenOptions(newChosenOptions.sort())
      onChoseOptions(chosenOptions.filter((e) => e.isChecked).map((e) => ({ id: e.id, value: e.text })))
    },
    [chosenOptions, onChoseOptions]
  )

  useEffect(
    () => onChoseOptions(chosenOptions.filter((e) => e.isChecked).map((e) => ({ id: e.id, value: e.text }))),
    [chosenOptions, onChoseOptions]
  )

  return (
    <DualListSelector
      isSearchable
      isTree
      availableOptions={availableOptions}
      chosenOptions={chosenOptions}
      onListChange={onListChange as any}
      onOptionCheck={() =>
        onChoseOptions(chosenOptions.filter((e) => e.isChecked).map((e) => ({ id: e.id, value: e.text })))
      }
      id="clusters-dual-list-selector-tree"
    />
  )
}

export { ClustersDualListSelector }
