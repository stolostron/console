/* Copyright Contributors to the Open Cluster Management project */
import { DualListSelector, DualListSelectorTreeItemData } from '@patternfly/react-core'
import React, { useCallback, useEffect, useRef } from 'react'
import { ClusterSet } from './hook/RoleAssignmentDataHook'

type ClustersDualListSelectorProps = {
  onChoseOptions: (values: { id: string; value: string }[]) => void
  clusterSets: ClusterSet[]
}

const ClustersDualListSelector = ({ onChoseOptions, clusterSets }: ClustersDualListSelectorProps) => {
  const [availableOptions, setAvailableOptions] = React.useState<DualListSelectorTreeItemData[]>([])

  // Update availableOptions when clusterSets change
  React.useEffect(() => {
    const newAvailableOptions = clusterSets.map((clusterSet) => ({
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
      })),
    }))
    setAvailableOptions(newAvailableOptions)
  }, [clusterSets])

  const [chosenOptions, setChosenOptions] = React.useState<DualListSelectorTreeItemData[]>([])
  const previousSelectedClusters = useRef<{ id: string; value: string }[]>([])

  const extractSelectedClusters = useCallback((options: DualListSelectorTreeItemData[]) => {
    const selectedClusters: { id: string; value: string }[] = []

    options.forEach((option) => {
      if (!option.children || option.children.length === 0) {
        if (option.isChecked) {
          selectedClusters.push({ id: option.id, value: option.text })
        }
      } else if (option.children) {
        if (option.isChecked) {
          option.children.forEach((child) => {
            selectedClusters.push({ id: child.id, value: child.text })
          })
        } else {
          option.children.forEach((child) => {
            if (child.isChecked) {
              selectedClusters.push({ id: child.id, value: child.text })
            }
          })
        }
      }
    })

    return selectedClusters
  }, [])

  const onListChange = useCallback(
    (
      _event: React.MouseEvent<HTMLElement>,
      newAvailableOptions: DualListSelectorTreeItemData[],
      newChosenOptions: DualListSelectorTreeItemData[]
    ) => {
      setAvailableOptions(newAvailableOptions.sort())
      setChosenOptions(newChosenOptions.sort())
      // Don't call onChoseOptions here - let useEffect handle it
    },
    []
  )

  useEffect(() => {
    const selectedClusters = extractSelectedClusters(chosenOptions)
    
    // Check if the selected clusters have actually changed
    const hasChanged = 
      selectedClusters.length !== previousSelectedClusters.current.length ||
      selectedClusters.some((cluster, index) => 
        !previousSelectedClusters.current[index] || 
        cluster.id !== previousSelectedClusters.current[index].id ||
        cluster.value !== previousSelectedClusters.current[index].value
      )
    
    if (hasChanged) {
      previousSelectedClusters.current = selectedClusters
      onChoseOptions(selectedClusters)
    }
  }, [chosenOptions, onChoseOptions, extractSelectedClusters])

  const handleOptionCheck = useCallback(
    (
      _event: React.MouseEvent<Element> | React.ChangeEvent<HTMLInputElement> | React.KeyboardEvent<Element>,
      checked: boolean,
      checkedId: string
    ) => {
      const updatedChosenOptions = chosenOptions.map((option) => {
        if (option.id === checkedId) {
          if (option.children && option.children.length > 0) {
            const updatedChildren = option.children.map((child) => ({
              ...child,
              isChecked: checked,
            }))
            return { ...option, isChecked: checked, children: updatedChildren }
          }
          return { ...option, isChecked: checked }
        }

        if (option.children) {
          const updatedChildren = option.children.map((child) =>
            child.id === checkedId ? { ...child, isChecked: checked } : child
          )

          const allChildrenChecked = updatedChildren.every((child) => child.isChecked)

          return {
            ...option,
            isChecked: allChildrenChecked,
            children: updatedChildren,
          }
        }

        return option
      })
      setChosenOptions(updatedChosenOptions)
    },
    [chosenOptions]
  )

  return (
    <DualListSelector
      isSearchable
      isTree
      availableOptions={availableOptions}
      chosenOptions={chosenOptions}
      onListChange={onListChange as any}
      onOptionCheck={handleOptionCheck}
      id="clusters-dual-list-selector-tree"
    />
  )
}

export { ClustersDualListSelector }
