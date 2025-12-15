/* Copyright Contributors to the Open Cluster Management project */
import { DualListSelectorTreeItemData } from '@patternfly/react-core'
import { DualListSelector } from '@patternfly/react-core/deprecated'
import React, { useCallback, useEffect, useRef } from 'react'
import { ClusterSet } from '../RoleAssignments/hook/RoleAssignmentDataHook'

type ClustersDualListSelectorProps = {
  onChoseOptions: (values: { id: string; value: string }[]) => void
  clusterSets: ClusterSet[]
}

const ClustersDualListSelector = ({ onChoseOptions, clusterSets }: ClustersDualListSelectorProps) => {
  const [availableOptions, setAvailableOptions] = React.useState<DualListSelectorTreeItemData[]>([])

  React.useEffect(() => {
    const newAvailableOptions = (clusterSets || []).map((clusterSet) => ({
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

  const addCheckedChildren = useCallback(
    (children: DualListSelectorTreeItemData[], selectedClusters: { id: string; value: string }[]) => {
      for (const child of children) {
        if (child.isChecked) {
          selectedClusters.push({ id: child.id, value: child.text })
        }
      }
    },
    []
  )

  const processOption = useCallback(
    (option: DualListSelectorTreeItemData, selectedClusters: { id: string; value: string }[]) => {
      const hasChildren = option.children && option.children.length > 0

      if (!hasChildren) {
        if (option.isChecked) {
          selectedClusters.push({ id: option.id, value: option.text })
        }
        return
      }

      if (option.isChecked) {
        for (const child of option.children!) {
          selectedClusters.push({ id: child.id, value: child.text })
        }
      } else {
        addCheckedChildren(option.children!, selectedClusters)
      }
    },
    [addCheckedChildren]
  )

  const extractSelectedClusters = useCallback(
    (options: DualListSelectorTreeItemData[]): { id: string; value: string }[] =>
      options.reduce((acc, curr) => {
        processOption(curr, acc)
        return acc
      }, []),
    [processOption]
  )

  const onListChange = useCallback(
    (
      _event: React.MouseEvent<HTMLElement>,
      newAvailableOptions: DualListSelectorTreeItemData[],
      newChosenOptions: DualListSelectorTreeItemData[]
    ) => {
      const sortedAvailableOptions = newAvailableOptions.toSorted((a, b) => a.text.localeCompare(b.text))
      const sortedChosenOptions = newChosenOptions.toSorted((a, b) => a.text.localeCompare(b.text))

      setAvailableOptions(sortedAvailableOptions)
      setChosenOptions(sortedChosenOptions)
    },
    []
  )

  useEffect(() => {
    const selectedClusters = extractSelectedClusters(chosenOptions)

    const hasChanged =
      selectedClusters.length !== previousSelectedClusters.current.length ||
      selectedClusters.some(
        (cluster, index) =>
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
